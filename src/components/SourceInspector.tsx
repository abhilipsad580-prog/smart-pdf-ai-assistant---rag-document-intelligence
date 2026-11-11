import React, { useState } from 'react';
import { X, CheckCircle2, Copy, Check, ExternalLink, ShieldCheck, FileText } from 'lucide-react';
import type { SourceCitation } from '../types.js';

interface SourceInspectorProps {
  sources: SourceCitation[];
  onClose: () => void;
  activeChunkId?: string;
  question?: string;
}

export const SourceInspector: React.FC<SourceInspectorProps> = ({
  sources,
  onClose,
  activeChunkId,
  question,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-white border-l border-slate-200 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="text-sm font-bold">Retrieved Source Evidence</h3>
            <p className="text-[11px] text-slate-300">
              {sources.length} {sources.length === 1 ? 'passage' : 'passages'} retrieved via vector search
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
          title="Close source panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {question && (
        <div className="p-3 bg-blue-50/70 border-b border-blue-100 text-xs text-blue-900">
          <span className="font-semibold text-blue-950">Query:</span> "{question}"
        </div>
      )}

      {/* Sources list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 divide-y divide-slate-100">
        {sources.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            No source passages to display.
          </div>
        ) : (
          sources.map((source, idx) => {
            const isTargeted = activeChunkId === source.chunkId;
            return (
              <div
                key={source.chunkId || idx}
                className={`pt-3.5 first:pt-0 rounded-lg p-3 transition-all ${
                  isTargeted ? 'bg-amber-50/60 ring-2 ring-amber-400' : 'bg-slate-50/60'
                }`}
              >
                {/* Source Metadata Badges */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-600 text-white">
                      Source #{idx + 1}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Page {source.pageNumber}
                    </span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                      {Math.round(source.score * 100)}% Match
                    </span>
                  </div>

                  <button
                    onClick={() => copyToClipboard(source.excerpt, source.chunkId)}
                    className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 bg-white border border-slate-200 px-2 py-0.5 rounded hover:bg-slate-100 transition-colors"
                    title="Copy excerpt text"
                  >
                    {copiedId === source.chunkId ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600 font-medium">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Document Name */}
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 mb-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate" title={source.docName}>
                    {source.docName}
                  </span>
                </div>

                {/* Excerpt */}
                <div className="text-xs text-slate-700 bg-white p-2.5 rounded border border-slate-200/90 leading-relaxed font-sans">
                  "{source.excerpt}"
                </div>

                {/* Verification tag */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                  <span className="font-mono">ID: {source.chunkId}</span>
                  {source.verified ? (
                    <span className="text-emerald-700 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Cited in Response
                    </span>
                  ) : (
                    <span className="text-slate-500">Retrieved Candidate</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer explanation */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-600 leading-normal">
        <strong className="text-slate-800">Grounding Guarantee:</strong> The language model receives only these retrieved excerpts and is prohibited from fabricating facts outside this evidence.
      </div>
    </div>
  );
};
