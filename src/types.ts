export interface UploadedDocInfo {
  id: string;
  name: string;
  size: number;
  pageCount: number;
  chunkCount: number;
  totalWords: number;
  isScanned: boolean;
  uploadedAt: string;
  suggestedQuestions: string[];
  scanWarning?: string;
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
