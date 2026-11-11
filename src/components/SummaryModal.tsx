import React, { useState } from 'react';
import { X, BookMarked, Copy, Check, FileText, CheckCircle2 } from 'lucide-react';
import type { DocumentSummary } from '../types.js';

interface SummaryModalProps {
  summary: DocumentSummary | null;
  onClose: () => void;
}

export const SummaryModal: React.FC<SummaryModalProps> = ({ summary, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!summary) return null;

  const copySummary = () => {
    navigator.clipboard.writeText(summary.overview);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <BookMarked className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Executive Document Summary</h3>
              <p className="text-xs text-slate-300 truncate max-w-sm" title={summary.docName}>
                {summary.docName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copySummary}
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Executive Overview text */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Executive Synthesis
            </h4>
            <div className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200 whitespace-pre-wrap">
              {summary.overview}
            </div>
          </div>

          {/* Page References Overview */}
          {summary.keyPoints && summary.keyPoints.length > 0 && (
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Section Highlights & Page References
              </h4>
              <div className="grid grid-cols-1 gap-2.5">
                {summary.keyPoints.map((point, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-slate-200 bg-white flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <span className="font-semibold text-xs text-slate-900">
                        {point.topic}
                      </span>
                      <p className="text-[11px] text-slate-600 line-clamp-2">
                        {point.details}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                      Page {point.page}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
