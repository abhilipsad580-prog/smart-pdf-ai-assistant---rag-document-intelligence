import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  ShieldCheck,
  AlertCircle,
  Copy,
  Check,
  Layers,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import type { ChatMessage, SourceCitation } from '../types.js';

interface ChatStreamProps {
  messages: ChatMessage[];
  suggestedQuestions: string[];
  onSendMessage: (question: string) => Promise<void>;
  isLoading: boolean;
  onOpenSources: (sources: SourceCitation[], question?: string, chunkId?: string) => void;
  hasDocuments: boolean;
  onLoadSample: () => void;
}

export const ChatStream: React.FC<ChatStreamProps> = ({
  messages,
  suggestedQuestions,
  onSendMessage,
  isLoading,
  onOpenSources,
  hasDocuments,
  onLoadSample,
}) => {
  const [input, setInput] = useState('');
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const q = input.trim();
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    onSendMessage(q);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
  };

  const copyAnswer = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  /**
   * Formats text content and turns [DocumentName, page X] into interactive clickable citation badges
   */
  const renderMessageContent = (content: string, sources?: SourceCitation[]) => {
    // Regex matches [DocumentName, page X] or [Page X] or [Doc, p. X]
    const citationRegex = /\[([^\]]*?page\s*\d+[^\]]*?)\]/gi;
    const parts = content.split(citationRegex);

    if (parts.length <= 1) {
      return <div className="whitespace-pre-wrap leading-relaxed">{content}</div>;
    }

    return (
      <div className="whitespace-pre-wrap leading-relaxed">
        {parts.map((part, i) => {
          // Check if this part matches citation pattern
          if (/page\s*\d+/i.test(part)) {
            // Extract page number if present
            const pageMatch = part.match(/page\s*(\d+)/i);
            const pageNum = pageMatch ? parseInt(pageMatch[1], 10) : undefined;
            const matchingSource = sources?.find((s) => s.pageNumber === pageNum);

            return (
              <button
                key={i}
                type="button"
                onClick={() => {
                  if (sources && sources.length > 0) {
                    onOpenSources(sources, undefined, matchingSource?.chunkId);
                  }
                }}
                className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-300 transition-colors cursor-pointer"
                title={`Click to view verified source excerpt from Page ${pageNum || ''}`}
              >
                <span>[{part}]</span>
              </button>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/50">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {messages.length === 0 ? (
          // Empty State / Welcome Screen
          <div className="max-w-2xl mx-auto py-8 px-4 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-700 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20">
              <Bot className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Retrieval-Augmented Document Intelligence
              </h2>
              <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                Upload any PDF to extract pages, create high-dimensional embeddings, and ask questions. Every factual claim is strictly grounded in retrieved document passages with verified page citations.
              </p>
            </div>

            {/* How RAG Works 4-Step Diagram */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-left pt-2">
              <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Step 1</span>
                <h4 className="text-xs font-bold text-slate-800 mt-1">Page Text Extraction</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Extracts text page-by-page preserving original 1-based page numbers.</p>
              </div>

              <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Step 2</span>
                <h4 className="text-xs font-bold text-slate-800 mt-1">Chunk & Embed</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Splits into overlapping passages and generates vector embeddings.</p>
              </div>

              <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Step 3</span>
                <h4 className="text-xs font-bold text-slate-800 mt-1">Cosine Retrieval</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Calculates similarity scores to retrieve only top relevant evidence.</p>
              </div>

              <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Step 4</span>
                <h4 className="text-xs font-bold text-slate-800 mt-1">Grounded Citations</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Gemini answers strictly from context and cites [Doc, page X].</p>
              </div>
            </div>

            {!hasDocuments && (
              <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 inline-block text-center space-y-2 mt-4">
                <p className="text-xs font-medium text-blue-900">
                  Ready to test? Load our 3-page Renewable Energy whitepaper with 1 click:
                </p>
                <button
                  onClick={onLoadSample}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Load Sample Whitepaper (Pages 1, 2, 3)</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isInsufficient = msg.groundingStatus === 'insufficient_evidence';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white shadow-xs ${
                    isUser ? 'bg-blue-600' : 'bg-slate-900'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Body */}
                <div
                  className={`flex flex-col space-y-1.5 max-w-[88%] ${
                    isUser
                      ? 'items-end'
                      : 'items-start'
                  }`}
                >
                  <div
                    className={`rounded-2xl p-4 text-xs shadow-xs ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-tr-xs'
                        : isInsufficient
                        ? 'bg-amber-50/90 border border-amber-200 text-slate-900 rounded-tl-xs'
                        : 'bg-white border border-slate-200/90 text-slate-900 rounded-tl-xs'
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    ) : (
                      renderMessageContent(msg.content, msg.sources)
                    )}

                    {/* Sources Badge / Grounding Verification Bar on Assistant Messages */}
                    {!isUser && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          {isInsufficient ? (
                            <span className="flex items-center gap-1 text-amber-700 font-semibold bg-amber-100/80 px-2 py-0.5 rounded">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Strict Grounding: Insufficient Evidence in Doc
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              Grounded in Retrieved Evidence
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {msg.sources && msg.sources.length > 0 && (
                            <button
                              type="button"
                              onClick={() => onOpenSources(msg.sources!, msg.content)}
                              className="flex items-center gap-1 text-blue-700 font-semibold hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded transition-colors"
                            >
                              <Layers className="w-3 h-3" />
                              <span>View Sources ({msg.sources.length})</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => copyAnswer(msg.content, msg.id)}
                            className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 transition-colors"
                            title="Copy answer"
                          >
                            {copiedMsgId === msg.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-400 px-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}

        {/* Loading Bubble */}
        {isLoading && (
          <div className="flex gap-3 max-w-xl mr-auto">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200/90 rounded-2xl rounded-tl-xs p-4 text-xs text-slate-600 shadow-xs space-y-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
                </span>
                <span className="font-semibold text-slate-800">
                  Retrieving relevant passages & verifying evidence...
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Searching cosine vector space across indexed pages and enforcing strict citation rules.
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions Carousel */}
      {hasDocuments && suggestedQuestions.length > 0 && (
        <div className="px-4 py-2 bg-slate-100/90 border-t border-slate-200/80">
          <div className="flex items-center gap-1.5 mb-1 text-[11px] font-semibold text-slate-600">
            <Sparkles className="w-3 h-3 text-blue-600" />
            <span>Suggested Questions (Click to test):</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                disabled={isLoading}
                onClick={() => onSendMessage(q)}
                className="shrink-0 text-[11px] font-medium text-slate-700 bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs transition-colors text-left disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="p-4 bg-white border-t border-slate-200 shadow-md">
        <form onSubmit={handleSubmit} className="flex items-end gap-2 max-w-4xl mx-auto">
          <div className="flex-1 relative rounded-xl border border-slate-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 bg-slate-50/50 transition-all">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              disabled={isLoading || !hasDocuments}
              placeholder={
                hasDocuments
                  ? 'Ask a question about the uploaded PDF documents (e.g. "What was the LCOE in 2024?")...'
                  : 'Please upload or load a sample PDF document to start asking questions...'
              }
              className="w-full text-xs text-slate-900 placeholder:text-slate-400 bg-transparent py-3 px-3.5 resize-none focus:outline-none max-h-36 disabled:cursor-not-allowed"
            />
          </div>

          <button
            type="submit"
            disabled={!input.trim() || isLoading || !hasDocuments}
            className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ask</span>
          </button>
        </form>
      </div>
    </div>
  );
};
