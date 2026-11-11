import type { ChatMessage, DocumentChunk, UploadedDocument } from './types.js';

export interface UserSessionData {
  sessionId: string;
  documents: Map<string, UploadedDocument>;
  chunks: DocumentChunk[];
  chatHistory: ChatMessage[];
  lastActive: number;
}

class SessionStore {
  private sessions: Map<string, UserSessionData> = new Map();

  constructor() {
    // Run garbage collection every 30 minutes to clean up inactive sessions (>4 hours)
    setInterval(() => this.cleanupInactiveSessions(), 30 * 60 * 1000);
  }

  public getOrCreateSession(sessionId: string): UserSessionData {
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = {
        sessionId,
        documents: new Map(),
        chunks: [],
        chatHistory: [],
        lastActive: Date.now(),
      };
      this.sessions.set(sessionId, session);
    } else {
      session.lastActive = Date.now();
    }
    return session;
  }

  public addDocument(sessionId: string, doc: UploadedDocument, chunks: DocumentChunk[]): void {
    const session = this.getOrCreateSession(sessionId);
    session.documents.set(doc.id, doc);
    // Remove any previous chunks for the same docId if re-uploaded
    session.chunks = session.chunks.filter((c) => c.docId !== doc.id).concat(chunks);
  }

  public removeDocument(sessionId: string, docId: string): boolean {
    const session = this.getOrCreateSession(sessionId);
    const removed = session.documents.delete(docId);
    session.chunks = session.chunks.filter((c) => c.docId !== docId);
    return removed;
  }

  public clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  public getDocuments(sessionId: string): UploadedDocument[] {
    const session = this.getOrCreateSession(sessionId);
    return Array.from(session.documents.values());
  }

  public getChunks(sessionId: string, documentIds?: string[]): DocumentChunk[] {
    const session = this.getOrCreateSession(sessionId);
    if (!documentIds || documentIds.length === 0) {
      return session.chunks;
    }
    const filterSet = new Set(documentIds);
    return session.chunks.filter((c) => filterSet.has(c.docId));
  }

  public addChatMessage(sessionId: string, message: ChatMessage): void {
    const session = this.getOrCreateSession(sessionId);
    session.chatHistory.push(message);
  }

  public getChatHistory(sessionId: string): ChatMessage[] {
    const session = this.getOrCreateSession(sessionId);
    return session.chatHistory;
  }

  private cleanupInactiveSessions(): void {
    const cutoff = Date.now() - 4 * 60 * 60 * 1000; // 4 hours
    for (const [id, session] of this.sessions.entries()) {
      if (session.lastActive < cutoff) {
        this.sessions.delete(id);
      }
    }
  }
}

export const sessionStore = new SessionStore();
