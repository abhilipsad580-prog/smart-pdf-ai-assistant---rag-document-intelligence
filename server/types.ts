/**
 * Types for Smart PDF AI Assistant - RAG Document Intelligence
 */

export interface PDFPageData {
  pageNumber: number; // 1-based page number
  text: string;
  charCount: number;
}

export interface DocumentChunk {
  id: string;
  docId: string;
  docName: string;
  pageNumber: number;
  chunkIndex: number;
  text: string;
  charCount: number;
  embedding?: number[];
}

export interface UploadedDocument {
  id: string;
  name: string;
  size: number;
  pageCount: number;
  chunkCount: number;
  totalWords: number;
  isScanned: boolean;
  uploadedAt: string;
  suggestedQuestions: string[];
  pages: PDFPageData[];
}

export interface RetrievedChunk {
  id: string;
  docId: string;
  docName: string;
  pageNumber: number;
  text: string;
  score: number; // Cosine similarity (0 to 1)
}

export interface SourceCitation {
  docName: string;
  pageNumber: number;
  chunkId: string;
  excerpt: string;
  score: number;
  verified: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: SourceCitation[];
  groundingStatus?: 'grounded' | 'insufficient_evidence' | 'error';
}

export interface DocumentSummary {
  docId: string;
  docName: string;
  overview: string;
  keyPoints: { topic: string; details: string; page: number }[];
  pageReferences: number[];
}
