import React from 'react';
import { BookOpen, Sparkles, RotateCcw, HelpCircle, Layers, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  totalDocs: number;
  totalChunks: number;
  onResetSession: () => void;
  onOpenTestGuide: () => void;
  isResetting: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  totalDocs,
  totalChunks,
  onResetSession,
  onOpenTestGuide,
  isResetting,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Title */}
        <div className="flex items-center space-x-3.5 w-full md:w-auto">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-inner shadow-blue-400/30">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white">
                Smart PDF AI Assistant
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                RAG Engine
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Document Intelligence with Grounded Retrieval & Page-Number Citations
            </p>
          </div>
        </div>

        {/* Index Stats & Action Controls */}
        <div className="flex items-center flex-wrap gap-2.5 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>
              <strong className="text-white font-semibold">{totalDocs}</strong> {totalDocs === 1 ? 'doc' : 'docs'}
            </span>
            <span className="text-slate-500">•</span>
            <span>
              <strong className="text-white font-semibold">{totalChunks}</strong> vector chunks
            </span>
          </div>

          <button
            onClick={onOpenTestGuide}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            title="View testing instructions & RAG pipeline guide"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Testing Guide</span>
          </button>

          <button
            onClick={onResetSession}
            disabled={isResetting || (totalDocs === 0 && totalChunks === 0)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-red-950/40 hover:border-red-800/60 border border-slate-700 rounded-lg transition-colors disabled:opacity-40 disabled:pointer-events-none"
            title="Clear all documents and conversation data"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>Reset Session</span>
          </button>
        </div>
      </div>
    </header>
  );
};
