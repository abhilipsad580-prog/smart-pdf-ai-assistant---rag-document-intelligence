import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.js';
import { DocumentUpload } from './components/DocumentUpload.js';
import { DocumentCard } from './components/DocumentCard.js';
import { ChatStream } from './components/ChatStream.js';
import { SourceInspector } from './components/SourceInspector.js';
import { SummaryModal } from './components/SummaryModal.js';
import { TestGuideModal } from './components/TestGuideModal.js';
import { api, resetLocalSession } from './utils/api.js';
import type { UploadedDocInfo, ChatMessage, SourceCitation, DocumentSummary } from './types.js';
import { FileText, Database, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';

export default function App() {
  const [documents, setDocuments] = useState<UploadedDocInfo[]>([]);
  const [totalChunks, setTotalChunks] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [isLoadingAnswer, setIsLoadingAnswer] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals & Panels
  const [activeSummary, setActiveSummary] = useState<DocumentSummary | null>(null);
  const [isTestGuideOpen, setIsTestGuideOpen] = useState(false);
  const [inspectorSources, setInspectorSources] = useState<SourceCitation[] | null>(null);
  const [inspectorQuestion, setInspectorQuestion] = useState<string | undefined>();
  const [inspectorActiveChunkId, setInspectorActiveChunkId] = useState<string | undefined>();

  // Fetch initial documents and chat history
  const loadInitialData = async () => {
    try {
      const docData = await api.getDocuments();
      setDocuments(docData.documents || []);
      setTotalChunks(docData.totalChunks || 0);

      if (docData.documents && docData.documents.length > 0) {
        // Collect suggestions from the latest doc
        const latestDoc = docData.documents[docData.documents.length - 1];
        if (latestDoc.suggestedQuestions) {
          setSuggestedQuestions(latestDoc.suggestedQuestions);
        }
      }

      const historyData = await api.getChatHistory();
      if (historyData.history && historyData.history.length > 0) {
        setMessages(historyData.history);
      }
    } catch (err: any) {
      console.warn('Initial data load:', err.message);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Upload handler (supports multiple files)
  const handleUpload = async (files: FileList | File[]) => {
    setIsProcessing(true);
    setErrorMessage(null);

    const fileArray = Array.from(files);
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      setProcessingStatus(`Processing "${file.name}" (${i + 1}/${fileArray.length})...`);
      try {
        const res = await api.uploadDocument(file);
        if (res.document) {
          setDocuments((prev) => {
            const filtered = prev.filter((d) => d.id !== res.document.id);
            return [...filtered, res.document];
          });
          setTotalChunks((prev) => prev + (res.document.chunkCount || 0));
          if (res.document.suggestedQuestions && res.document.suggestedQuestions.length > 0) {
            setSuggestedQuestions(res.document.suggestedQuestions);
          }
        }
      } catch (err: any) {
        console.error('File upload failed:', err);
        setErrorMessage(err.message || `Failed to process ${file.name}`);
        break;
      }
    }

    setIsProcessing(false);
    setProcessingStatus('');
  };

  // Load sample whitepaper
  const handleLoadSample = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    setProcessingStatus('Generating authentic 3-page Renewable Energy Whitepaper...');

    try {
      const res = await api.loadSampleDocument();
      if (res.document) {
        setDocuments((prev) => {
          const filtered = prev.filter((d) => d.id !== res.document.id);
          return [...filtered, res.document];
        });
        setTotalChunks((prev) => prev + (res.document.chunkCount || 0));
        if (res.document.suggestedQuestions) {
          setSuggestedQuestions(res.document.suggestedQuestions);
        }
      }
    } catch (err: any) {
      console.error('Sample loading error:', err);
      setErrorMessage(err.message || 'Failed to load sample whitepaper.');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Delete document
  const handleDeleteDocument = async (id: string) => {
    try {
      await api.deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      const docData = await api.getDocuments();
      setTotalChunks(docData.totalChunks || 0);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete document');
    }
  };

  // Summarize document
  const handleSummarize = async (id?: string) => {
    setIsSummarizing(true);
    setErrorMessage(null);
    try {
      const res = await api.summarizeDocument(id);
      if (res.summary) {
        setActiveSummary(res.summary);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to summarize document');
    } finally {
      setIsSummarizing(false);
    }
  };

  // Ask question
  const handleSendMessage = async (question: string) => {
    if (isLoadingAnswer) return;
    setIsLoadingAnswer(true);
    setErrorMessage(null);

    // Optimistically add user message
    const tempUserMsg: ChatMessage = {
      id: `temp_u_${Date.now()}`,
      role: 'user',
      content: question,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await api.askQuestion(question);
      if (res.assistantMessage) {
        setMessages((prev) => [...prev, res.assistantMessage]);
      }
    } catch (err: any) {
      console.error('Ask error:', err);
      const errorAssistantMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `Unable to complete retrieval: ${err.message || 'Unknown network error'}.`,
        timestamp: new Date().toISOString(),
        groundingStatus: 'error',
      };
      setMessages((prev) => [...prev, errorAssistantMsg]);
    } finally {
      setIsLoadingAnswer(false);
    }
  };

  // Open Source Inspector
  const handleOpenSources = (sources: SourceCitation[], question?: string, chunkId?: string) => {
    setInspectorSources(sources);
    setInspectorQuestion(question);
    setInspectorActiveChunkId(chunkId);
  };

  // Reset Session
  const handleResetSession = async () => {
    if (!window.confirm('Reset the current session? This will clear all uploaded documents, vectorized chunks, and conversation history.')) {
      return;
    }
    setIsResetting(true);
    try {
      await api.resetSession();
      resetLocalSession();
      setDocuments([]);
      setTotalChunks(0);
      setMessages([]);
      setSuggestedQuestions([]);
      setInspectorSources(null);
      setActiveSummary(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reset session');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 font-sans antialiased">
      {/* Top Header */}
      <Header
        totalDocs={documents.length}
        totalChunks={totalChunks}
        onResetSession={handleResetSession}
        onOpenTestGuide={() => setIsTestGuideOpen(true)}
        isResetting={isResetting}
      />

      {/* Global Error Banner if any */}
      {errorMessage && (
        <div className="bg-red-500 text-white px-4 py-2 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 max-w-6xl mx-auto w-full">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1 font-medium">{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-white hover:text-red-200 font-bold ml-2"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace Split */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 flex flex-col lg:flex-row gap-5 overflow-hidden">
        {/* Left Sidebar: Document Manager Hub */}
        <div className="w-full lg:w-80 xl:w-96 flex flex-col space-y-4 shrink-0">
          {/* Upload Dropzone */}
          <DocumentUpload
            onUpload={handleUpload}
            onLoadSample={handleLoadSample}
            isProcessing={isProcessing}
            processingStatus={processingStatus}
          />

          {/* Uploaded Documents List */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 flex-1 flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-blue-600" />
                <span>Uploaded Documents ({documents.length})</span>
              </h2>

              {documents.length > 0 && (
                <button
                  onClick={() => handleSummarize()}
                  disabled={isSummarizing}
                  className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md transition-colors disabled:opacity-50"
                  title="Summarize all documents in session"
                >
                  {isSummarizing ? 'Summarizing...' : 'Summarize All'}
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[420px] lg:max-h-none pr-1">
              {documents.length === 0 ? (
                <div className="text-center py-8 text-slate-400 space-y-2">
                  <FileText className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-medium text-slate-500">No documents indexed yet</p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    Upload your own PDF or click "Load Sample 3-Page Whitepaper" to start testing RAG retrieval.
                  </p>
                </div>
              ) : (
                documents.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    document={doc}
                    onDelete={handleDeleteDocument}
                    onSummarize={handleSummarize}
                    isSummarizing={isSummarizing}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Center / Right: Chat Stream & Source Inspector */}
        <div className="flex-1 flex bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden relative">
          <div className="flex-1 flex flex-col h-[700px] lg:h-[calc(100vh-140px)]">
            <ChatStream
              messages={messages}
              suggestedQuestions={suggestedQuestions}
              onSendMessage={handleSendMessage}
              isLoading={isLoadingAnswer}
              onOpenSources={handleOpenSources}
              hasDocuments={documents.length > 0}
              onLoadSample={handleLoadSample}
            />
          </div>

          {/* Slide-out Source Inspector Drawer */}
          {inspectorSources && (
            <div className="w-full sm:w-96 shrink-0 h-full absolute sm:relative right-0 top-0 z-20">
              <SourceInspector
                sources={inspectorSources}
                onClose={() => setInspectorSources(null)}
                question={inspectorQuestion}
                activeChunkId={inspectorActiveChunkId}
              />
            </div>
          )}
        </div>
      </main>

      {/* Summary Modal */}
      <SummaryModal
        summary={activeSummary}
        onClose={() => setActiveSummary(null)}
      />

      {/* Test Guide Modal */}
      {isTestGuideOpen && (
        <TestGuideModal
          onClose={() => setIsTestGuideOpen(false)}
          onRunTestQuery={(q) => handleSendMessage(q)}
        />
      )}
    </div>
  );
}
