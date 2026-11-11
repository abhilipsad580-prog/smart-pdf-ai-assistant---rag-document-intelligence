/**
 * API client for Smart PDF AI Assistant
 */

const SESSION_KEY = 'smart_pdf_session_id';

export function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function resetLocalSession(): string {
  const newId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  localStorage.setItem(SESSION_KEY, newId);
  return newId;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const sessionId = getSessionId();
  const headers = new Headers(options.headers || {});
  headers.set('X-Session-ID', sessionId);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({ error: 'Non-JSON response received from server' }));

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}: Request failed`);
  }

  return data as T;
}

export const api = {
  getDocuments: () =>
    request<{ documents: any[]; totalDocuments: number; totalChunks: number }>('/api/documents/list'),

  uploadDocument: (file: File): Promise<{ success: boolean; document: any }> => {
    return new Promise<{ success: boolean; document: any }>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          const data = await request<{ success: boolean; document: any }>('/api/documents/upload', {
            method: 'POST',
            body: JSON.stringify({
              fileName: file.name,
              fileSize: file.size,
              fileBase64: base64,
            }),
          });
          resolve(data);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file from browser'));
      reader.readAsDataURL(file);
    });
  },

  loadSampleDocument: () =>
    request<{ success: boolean; document: any }>('/api/documents/sample', {
      method: 'POST',
    }),

  deleteDocument: (id: string) =>
    request<{ success: boolean }>(`/api/documents/${id}`, {
      method: 'DELETE',
    }),

  summarizeDocument: (documentId?: string) =>
    request<{ success: boolean; summary: any }>('/api/documents/summary', {
      method: 'POST',
      body: JSON.stringify({ documentId }),
    }),

  askQuestion: (question: string, documentIds?: string[]) =>
    request<{
      answer: string;
      sources: any[];
      groundingStatus: 'grounded' | 'insufficient_evidence';
      retrievedCount: number;
      userMessage: any;
      assistantMessage: any;
    }>('/api/chat/ask', {
      method: 'POST',
      body: JSON.stringify({ question, documentIds }),
    }),

  getChatHistory: () =>
    request<{ history: any[] }>('/api/chat/history'),

  resetSession: () =>
    request<{ success: boolean }>('/api/session/reset', {
      method: 'POST',
    }),
};
