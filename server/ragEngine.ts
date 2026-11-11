import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { sanitizeError } from './security.js';
import type {
  DocumentChunk,
  DocumentSummary,
  PDFPageData,
  RetrievedChunk,
  SourceCitation,
} from './types.js';

dotenv.config({ path: '.env.local' });

const apiKey = process.env.GEMINI_API_KEY || '';

const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

/**
 * Splits extracted PDF pages into overlapping chunks while preserving 1-based page numbers.
 */
export function chunkPages(
  pages: PDFPageData[],
  docId: string,
  docName: string,
  chunkSize = 650,
  overlap = 150
): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  let chunkCounter = 0;

  for (const page of pages) {
    const text = page.text.trim();
    if (!text) continue;

    // If page is relatively short, keep as single chunk
    if (text.length <= chunkSize) {
      chunkCounter++;
      chunks.push({
        id: `${docId}_p${page.pageNumber}_c${chunkCounter}`,
        docId,
        docName,
        pageNumber: page.pageNumber,
        chunkIndex: chunkCounter,
        text,
        charCount: text.length,
      });
      continue;
    }

    // Overlapping sliding window within this page
    let start = 0;
    while (start < text.length) {
      let end = Math.min(start + chunkSize, text.length);

      // Attempt to break at a sentence or word boundary if not at end
      if (end < text.length) {
        const lastPeriod = text.lastIndexOf('. ', end);
        const lastNewline = text.lastIndexOf('\n', end);
        const naturalBreak = Math.max(lastPeriod, lastNewline);

        if (naturalBreak > start + chunkSize * 0.6) {
          end = naturalBreak + (naturalBreak === lastPeriod ? 1 : 0);
        } else {
          const lastSpace = text.lastIndexOf(' ', end);
          if (lastSpace > start + chunkSize * 0.7) {
            end = lastSpace;
          }
        }
      }

      const chunkText = text.substring(start, end).trim();
      if (chunkText.length > 20) {
        chunkCounter++;
        chunks.push({
          id: `${docId}_p${page.pageNumber}_c${chunkCounter}`,
          docId,
          docName,
          pageNumber: page.pageNumber,
          chunkIndex: chunkCounter,
          text: chunkText,
          charCount: chunkText.length,
        });
      }

      if (end >= text.length) break;
      start = Math.max(start + 1, end - overlap);
    }
  }

  return chunks;
}

/**
 * Calculates standard cosine similarity between two numeric vectors.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const len = Math.min(vecA.length, vecB.length);

  for (let i = 0; i < len; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Fallback semantic TF-IDF token vectorizer if external API quota or key is not available
 */
function createFallbackVector(text: string, dimensions = 256): number[] {
  const vec = new Array(dimensions).fill(0);
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let hash = 0;
    for (let c = 0; c < word.length; c++) {
      hash = (hash << 5) - hash + word.charCodeAt(c);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dimensions;
    vec[idx] += 1 / Math.sqrt(words.length);
  }
  return vec;
}

/**
 * Generates embedding for a single text using Gemini API
 */
export async function getEmbedding(text: string): Promise<number[]> {
  if (!apiKey) {
    return createFallbackVector(text);
  }

  try {
    const response = await ai.models.embedContent({
      model: 'gemini-embedding-2',
      contents: text.slice(0, 3000),
    });

    const values = response.embeddings?.[0]?.values;
    if (values && values.length > 0) {
      return values;
    }
    return createFallbackVector(text);
  } catch (err: any) {
    console.warn('Gemini embedding API call failed, using high-dimensional token vector fallback:', sanitizeError(err));
    return createFallbackVector(text);
  }
}

/**
 * Embeds multiple chunks with concurrency control
 */
export async function embedChunks(chunks: DocumentChunk[]): Promise<DocumentChunk[]> {
  const batchSize = 5;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (chunk) => {
        if (!chunk.embedding) {
          chunk.embedding = await getEmbedding(chunk.text);
        }
      })
    );
  }
  return chunks;
}

/**
 * Searches stored chunks using cosine similarity vector search
 */
export function searchChunks(
  queryVector: number[],
  chunks: DocumentChunk[],
  topK = 5,
  minThreshold = 0.25
): RetrievedChunk[] {
  const scored = chunks.map((chunk) => {
    const score = chunk.embedding ? cosineSimilarity(queryVector, chunk.embedding) : 0;
    return {
      id: chunk.id,
      docId: chunk.docId,
      docName: chunk.docName,
      pageNumber: chunk.pageNumber,
      text: chunk.text,
      score,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).filter((item) => item.score >= minThreshold);
}

/**
 * Answers a user question strictly using retrieved context with verified citations.
 */
export async function answerQuestion(
  question: string,
  retrievedChunks: RetrievedChunk[],
  docNames: string[]
): Promise<{
  answer: string;
  sources: SourceCitation[];
  groundingStatus: 'grounded' | 'insufficient_evidence';
}> {
  // If zero chunks passed similarity threshold
  if (retrievedChunks.length === 0) {
    return {
      answer:
        "I couldn't find enough information in the uploaded document to answer that question. No relevant passages met the retrieval threshold.",
      sources: [],
      groundingStatus: 'insufficient_evidence',
    };
  }

  // Construct context blocks with explicit document and page metadata
  const contextText = retrievedChunks
    .map(
      (chunk, idx) =>
        `[Source #${idx + 1} | Document: ${chunk.docName} | Page: ${chunk.pageNumber} | Chunk ID: ${chunk.id}]\n${chunk.text}`
    )
    .join('\n\n---\n\n');

  const systemInstruction = `You are "Smart PDF AI Assistant", an uncompromising Document Intelligence RAG engine.
Your purpose is to answer user questions using ONLY the provided retrieved context passages.

CRITICAL RULES:
1. Answer factually and strictly based ONLY on the evidence provided in the Retrieved Context.
2. DO NOT assume, extrapolate, or bring in outside world knowledge that is not in the text.
3. Every key factual claim MUST cite its source using this format: [DocumentName, page X] (for example: [${docNames[0] || 'Document.pdf'}, page 2]).
4. If the retrieved passages DO NOT contain sufficient factual evidence to answer the question, you MUST start your response with the EXACT sentence:
"I couldn't find enough information in the uploaded document to answer that question."
Then briefly explain what specific data is missing or state what topic the available passages actually discuss.
5. Format your response cleanly using Markdown (bold terms, bullet points, headers where appropriate).`;

  const prompt = `Retrieved Context from Uploaded Document(s):
${contextText}

User Question: ${question}

Instructions:
- Provide an accurate, grounded answer with page citations [DocumentName, page X].
- If the context does not contain the answer, reply with: "I couldn't find enough information in the uploaded document to answer that question."`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2, // Low temperature for factual precision
      },
    });

    const answer = response.text || "I couldn't find enough information in the uploaded document to answer that question.";

    // Check if the model stated insufficient evidence
    const isInsufficient = answer.includes("couldn't find enough information") ||
      answer.includes("not enough information in the uploaded document");

    // Build source citations and verify them against retrieved chunks
    const sources: SourceCitation[] = retrievedChunks.map((chunk) => {
      // Excerpt snippet of ~150 chars
      const snippet = chunk.text.length > 180 ? chunk.text.slice(0, 180) + '...' : chunk.text;
      const citationPattern = new RegExp(`page\\s*${chunk.pageNumber}`, 'i');
      const verified = !isInsufficient && (citationPattern.test(answer) || answer.toLowerCase().includes(chunk.docName.toLowerCase()));

      return {
        docName: chunk.docName,
        pageNumber: chunk.pageNumber,
        chunkId: chunk.id,
        excerpt: snippet,
        score: Math.round(chunk.score * 100) / 100,
        verified,
      };
    });

    return {
      answer,
      sources: isInsufficient ? [] : sources,
      groundingStatus: isInsufficient ? 'insufficient_evidence' : 'grounded',
    };
  } catch (error: any) {
    const safeError = sanitizeError(error, 'Unknown error occurred while contacting AI model.');
    console.error('Answer generation error:', safeError);
    return {
      answer: `Error generating response: ${safeError}`,
      sources: [],
      groundingStatus: 'insufficient_evidence',
    };
  }
}

/**
 * Summarizes the document with structured highlights and page citations.
 */
export async function summarizeDocument(
  docName: string,
  pages: PDFPageData[]
): Promise<DocumentSummary> {
  const pagesExcerpt = pages
    .map((p) => `[Page ${p.pageNumber}]\n${p.text.slice(0, 1200)}`)
    .join('\n\n');

  const prompt = `Please create a structured executive summary of the uploaded document "${docName}".
Analyze the following text page by page:
${pagesExcerpt}

Return the summary with:
1. An Executive Overview (2-3 concise paragraphs).
2. Key Findings & Topics (with exact [Page X] citations).
3. Practical Takeaways.

Maintain strict factual fidelity to the text.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an expert executive document analyst. Be precise, structured, and cite pages accurately.',
        temperature: 0.3,
      },
    });

    const overview = response.text || 'Unable to generate summary.';

    // Extract key points
    const keyPoints: { topic: string; details: string; page: number }[] = [];
    const pageReferences: number[] = [];

    for (const page of pages) {
      pageReferences.push(page.pageNumber);
      const firstLine = page.text.split('\n').filter(Boolean)[0] || `Section on page ${page.pageNumber}`;
      keyPoints.push({
        topic: firstLine.slice(0, 60),
        details: page.text.slice(0, 180).replace(/\n/g, ' ') + '...',
        page: page.pageNumber,
      });
    }

    return {
      docId: docName,
      docName,
      overview,
      keyPoints,
      pageReferences,
    };
  } catch (err: any) {
    const safeError = sanitizeError(err, 'Failed to complete summary');
    return {
      docId: docName,
      docName,
      overview: `Document summary could not be completed: ${safeError}`,
      keyPoints: [],
      pageReferences: pages.map((p) => p.pageNumber),
    };
  }
}

/**
 * Generates 3-4 intelligent suggested questions from the document text
 */
export async function generateSuggestedQuestions(pages: PDFPageData[]): Promise<string[]> {
  const sampleText = pages
    .slice(0, 3)
    .map((p) => `[Page ${p.pageNumber}] ${p.text.slice(0, 600)}`)
    .join('\n\n');

  if (!sampleText || sampleText.length < 50) {
    return [
      'What are the key topics discussed in this document?',
      'Can you summarize the main findings?',
      'What important statistics or dates are mentioned?',
    ];
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Based on this document excerpt, produce 4 specific, insightful questions that can be answered directly by the document text.
Return ONLY 4 questions, one per line. Do not number them. No introduction.

Excerpt:
${sampleText}`,
      config: {
        temperature: 0.4,
      },
    });

    const questions = (response.text || '')
      .split('\n')
      .map((q) => q.replace(/^\d+[\.\)]\s*/, '').replace(/^[-*•]\s*/, '').trim())
      .filter((q) => q.length > 10 && q.endsWith('?'))
      .slice(0, 4);

    if (questions.length > 0) {
      return questions;
    }
  } catch (e) {
    // Fallback
  }

  return [
    'What are the primary conclusions outlined in this document?',
    'What specific data points or metrics are reported?',
    'Which policies or recommendations are introduced?',
    'What challenges or future steps are detailed on the later pages?',
  ];
}
