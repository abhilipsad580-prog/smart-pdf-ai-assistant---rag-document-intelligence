import React from 'react';
import { FileText, Trash2, FileCheck, AlertTriangle, BookMarked, Eye } from 'lucide-react';
import type { UploadedDocInfo } from '../types.js';

interface DocumentCardProps {
  document: UploadedDocInfo;
  onDelete: (id: string) => void;
  onSummarize: (id: string) => void;
  isSummarizing: boolean;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onDelete,
  onSummarize,
  isSummarizing,
}) => {
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-3.5 space-y-2.5 transition-all hover:border-slate-300">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-100/70 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3
              className="text-xs font-bold text-slate-900 truncate"
              title={document.name}
            >
              {document.name}
            </h3>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
              <span>{formatSize(document.size)}</span>
              <span>•</span>
              <span className="font-medium text-slate-700">{document.pageCount} {document.pageCount === 1 ? 'page' : 'pages'}</span>
              <span>•</span>
              <span>{document.chunkCount} chunks</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => onDelete(document.id)}
          className="text-slate-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors"
          title="Delete document from session"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Scanned PDF Alert if detected */}
      {document.isScanned && (
        <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-1.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold">Scanned/Image-Only PDF:</strong> Negligible text found. Optical Character Recognition (OCR) is required to parse rasterized images. Please upload a searchable digital PDF.
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
        <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
          <FileCheck className="w-3.5 h-3.5" />
          <span>Vectorized & Ready</span>
        </div>

        <button
          onClick={() => onSummarize(document.id)}
          disabled={isSummarizing}
          className="flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100/80 px-2.5 py-1 rounded-md transition-colors disabled:opacity-50"
        >
          <BookMarked className="w-3 h-3" />
          <span>Summarize</span>
        </button>
      </div>
    </div>
  );
};
