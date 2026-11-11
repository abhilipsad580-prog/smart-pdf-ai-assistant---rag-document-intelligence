import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { extractPDFPages, createSamplePDFBuffer } from './server/pdfExtractor.js';
import {
  chunkPages,
  embedChunks,
  getEmbedding,
  searchChunks,
  answerQuestion,
  summarizeDocument,
  generateSuggestedQuestions,
} from './server/ragEngine.js';
import { sessionStore } from './server/sessionStore.js';
import type { UploadedDocument } from './server/types.js';
import { sanitizeError } from './server/security.js';

dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

// Increase payload limit to support PDFs up to 50MB in base64
app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ limit: '60mb', extended: true }));

// Helper to extract session ID from request headers or query
function getSessionId(req: express.Request): string {
  const headerId = req.headers['x-session-id'];
  if (typeof headerId === 'string' && headerId.trim()) {
    return headerId.trim();
  }
  return 'default-session';
}

// -------------------------------------------------------------
// API Routes
// -------------------------------------------------------------

/**
 * Health check & runtime status
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiKeyConfigured: !!process.env.GEMINI_API_KEY,
  });
});

/**
 * POST /api/documents/upload
 * Upload a PDF file in base64 format, extract pages, chunk, and embed
 */
app.post('/api/documents/upload', async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const { fileName, fileBase64, fileSize } = req.body;

    if (!fileBase64) {
      return res.status(400).json({ error: 'Missing fileBase64 in request body.' });
    }

    const cleanFileName = (fileName || 'Uploaded_Document.pdf').replace(/[^\w\.\-\s]/g, '_');

    // Decode base64
    const buffer = Buffer.from(fileBase64, 'base64');

    if (buffer.length > 30 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size exceeds maximum allowed limit of 30MB.' });
    }

    // Step 1 & 2: Extract text page by page
    const extraction = await extractPDFPages(buffer);

    const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Step 3: Split into overlapping text chunks preserving page numbers
    const chunks = chunkPages(extraction.pages, docId, cleanFileName);

    // Step 4: Generate embeddings for chunks
    const embeddedChunks = await embedChunks(chunks);

    // Generate intelligent suggested questions
    const suggestedQuestions = await generateSuggestedQuestions(extraction.pages);

    const document: UploadedDocument = {
      id: docId,
      name: cleanFileName,
      size: fileSize || buffer.length,
      pageCount: extraction.pages.length,
      chunkCount: chunks.length,
      totalWords: extraction.totalWords,
      isScanned: extraction.isScanned,
      uploadedAt: new Date().toISOString(),
      suggestedQuestions,
      pages: extraction.pages,
    };

    // Store in session
    sessionStore.addDocument(sessionId, document, embeddedChunks);

    res.json({
      success: true,
      document: {
        id: document.id,
        name: document.name,
        size: document.size,
        pageCount: document.pageCount,
        chunkCount: document.chunkCount,
        totalWords: document.totalWords,
        isScanned: document.isScanned,
        uploadedAt: document.uploadedAt,
        suggestedQuestions: document.suggestedQuestions,
        scanWarning: extraction.scanWarning,
      },
    });
  } catch (error: any) {
    const safeError = sanitizeError(error, 'Failed to process and vectorize uploaded PDF document.');
    console.error('PDF upload error:', safeError);
    res.status(500).json({ error: safeError });
  }
});

/**
 * POST /api/documents/sample
 * Load pre-packaged authentic 3-page Renewable Energy & Grid Storage Whitepaper 2026
 */
app.post('/api/documents/sample', async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const sampleBuffer = await createSamplePDFBuffer();
    const fileName = 'Global_Clean_Energy_Transition_Report_2026.pdf';

    const extraction = await extractPDFPages(sampleBuffer);
    const docId = `sample_${Date.now()}`;
    const chunks = chunkPages(extraction.pages, docId, fileName);
    const embeddedChunks = await embedChunks(chunks);

    const sampleSuggestedQuestions = [
      'What was the Levelized Cost of Electricity (LCOE) reached by solar and wind in 2024?',
      'What battery chemistry captured 88% of utility storage and what is its cycle life?',
      'What are the binding requirements under the 2030 Clean Energy Mandate?',
      'What is the capital budget allocated for fusion reactors in the report? (Negative test)',
    ];

    const document: UploadedDocument = {
      id: docId,
      name: fileName,
      size: sampleBuffer.length,
      pageCount: extraction.pages.length,
      chunkCount: chunks.length,
      totalWords: extraction.totalWords,
      isScanned: false,
      uploadedAt: new Date().toISOString(),
      suggestedQuestions: sampleSuggestedQuestions,
      pages: extraction.pages,
    };

    sessionStore.addDocument(sessionId, document, embeddedChunks);

    res.json({
      success: true,
      document: {
        id: document.id,
        name: document.name,
        size: document.size,
        pageCount: document.pageCount,
        chunkCount: document.chunkCount,
        totalWords: document.totalWords,
        isScanned: false,
        uploadedAt: document.uploadedAt,
        suggestedQuestions: sampleSuggestedQuestions,
      },
    });
  } catch (error: any) {
    const safeError = sanitizeError(error, 'Failed to initialize sample document.');
    console.error('Sample PDF creation error:', safeError);
    res.status(500).json({ error: safeError });
  }
});

/**
 * GET /api/documents/list
 * List all documents uploaded in this session
 */
app.get('/api/documents/list', (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const docs = sessionStore.getDocuments(sessionId);
    const totalChunks = sessionStore.getChunks(sessionId).length;

    res.json({
      documents: docs.map((d) => ({
        id: d.id,
        name: d.name,
        size: d.size,
        pageCount: d.pageCount,
        chunkCount: d.chunkCount,
        totalWords: d.totalWords,
        isScanned: d.isScanned,
        uploadedAt: d.uploadedAt,
        suggestedQuestions: d.suggestedQuestions,
      })),
      totalDocuments: docs.length,
      totalChunks,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/documents/:id
 * Remove a document from the session
 */
app.delete('/api/documents/:id', (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const docId = req.params.id;
    const removed = sessionStore.removeDocument(sessionId, docId);
    res.json({ success: removed });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/documents/summary
 * Generate an executive summary of an uploaded document
 */
app.post('/api/documents/summary', async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const { documentId } = req.body;

    const docs = sessionStore.getDocuments(sessionId);
    if (docs.length === 0) {
      return res.status(400).json({ error: 'No documents uploaded yet to summarize.' });
    }

    const targetDoc = documentId ? docs.find((d) => d.id === documentId) : docs[0];
    if (!targetDoc) {
      return res.status(404).json({ error: 'Specified document not found in session.' });
    }

    const summary = await summarizeDocument(targetDoc.name, targetDoc.pages);
    res.json({ success: true, summary });
  } catch (error: any) {
    const safeError = sanitizeError(error, 'Failed to generate document summary.');
    console.error('Summary error:', safeError);
    res.status(500).json({ error: safeError });
  }
});

/**
 * POST /api/chat/ask
 * Genuine RAG QA: Embeds query, retrieves top chunks via cosine similarity,
 * prompts Gemini 3.8 Flash with strict grounding, and attaches verified citations.
 */
app.post('/api/chat/ask', async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const { question, documentIds } = req.body;

    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ error: 'Question is required.' });
    }

    const allChunks = sessionStore.getChunks(sessionId, documentIds);
    const docs = sessionStore.getDocuments(sessionId);

    if (allChunks.length === 0) {
      return res.status(400).json({
        error: 'No document text found in current session. Please upload a PDF first.',
      });
    }

    // Step 5 & 6: Vector search query
    const queryVector = await getEmbedding(question);
    const retrievedChunks = searchChunks(queryVector, allChunks, 5, 0.25);

    const docNames = docs.map((d) => d.name);

    // Step 7, 8, 9, 10: Grounded answer generation + citation verification
    const { answer, sources, groundingStatus } = await answerQuestion(
      question,
      retrievedChunks,
      docNames
    );

    // Save to session history
    const userMessage = {
      id: `msg_${Date.now()}_u`,
      role: 'user' as const,
      content: question,
      timestamp: new Date().toISOString(),
    };
    const assistantMessage = {
      id: `msg_${Date.now()}_a`,
      role: 'assistant' as const,
      content: answer,
      timestamp: new Date().toISOString(),
      sources,
      groundingStatus,
    };

    sessionStore.addChatMessage(sessionId, userMessage);
    sessionStore.addChatMessage(sessionId, assistantMessage);

    res.json({
      answer,
      sources,
      groundingStatus,
      retrievedCount: retrievedChunks.length,
      userMessage,
      assistantMessage,
    });
  } catch (error: any) {
    const safeError = sanitizeError(error, 'Failed to retrieve answer from documents.');
    console.error('Chat error:', safeError);
    res.status(500).json({ error: safeError });
  }
});

/**
 * GET /api/chat/history
 */
app.get('/api/chat/history', (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const history = sessionStore.getChatHistory(sessionId);
    res.json({ history });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/session/reset
 * Clear current session
 */
app.post('/api/session/reset', (req, res) => {
  try {
    const sessionId = getSessionId(req);
    sessionStore.clearSession(sessionId);
    res.json({ success: true, message: 'Session reset successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// Dev & Production Vite Middleware Mounting
// -------------------------------------------------------------

async function startServer() {
  if (!isProd) {
    // Development mode: mount Vite middleware for live client code
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: serve built assets from dist
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart PDF AI Assistant server running on http://0.0.0.0:${PORT} [mode: ${isProd ? 'production' : 'development'}]`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup failure:', err);
  process.exit(1);
});
