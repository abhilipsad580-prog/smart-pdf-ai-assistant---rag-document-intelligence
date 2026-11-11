import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react';

interface DocumentUploadProps {
  onUpload: (files: FileList | File[]) => Promise<void>;
  onLoadSample: () => Promise<void>;
  isProcessing: boolean;
  processingStatus: string;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onUpload,
  onLoadSample,
  isProcessing,
  processingStatus,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const validateAndUpload = async (files: FileList | File[]) => {
    setErrorMsg(null);
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
        setErrorMsg(`"${file.name}" is not a PDF file. Please upload PDF documents.`);
        return;
      }
      if (file.size > 30 * 1024 * 1024) {
        setErrorMsg(`"${file.name}" exceeds the 30MB file size limit.`);
        return;
      }
    }

    try {
      await onUpload(files);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to process PDF.');
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isProcessing) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await validateAndUpload(e.dataTransfer.files);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await validateAndUpload(e.target.files);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-blue-600" />
          <span>Upload PDF Document</span>
        </h2>
        <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
          Max 30MB • Multi-PDF
        </span>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
          isDragOver
            ? 'border-blue-500 bg-blue-50/80 ring-2 ring-blue-500/20'
            : isProcessing
            ? 'border-slate-300 bg-slate-50/80 cursor-wait'
            : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          className="hidden"
          onChange={handleFileChange}
          disabled={isProcessing}
        />

        {isProcessing ? (
          <div className="flex flex-col items-center justify-center py-2 space-y-2">
            <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
            <p className="text-xs font-semibold text-slate-800">{processingStatus || 'Processing document...'}</p>
            <p className="text-[11px] text-slate-500">
              Extracting pages, chunking text & generating Gemini vector embeddings...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-1.5">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-1">
              <Upload className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-800">
              Drag & drop PDF here, or <span className="text-blue-600 underline">browse</span>
            </p>
            <p className="text-[11px] text-slate-500">
              Supports searchable text PDFs with multi-page structure
            </p>
          </div>
        )}
      </div>

      {/* Error alert */}
      {errorMsg && (
        <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">{errorMsg}</div>
        </div>
      )}

      {/* Sample PDF One-Click Load */}
      <div className="pt-1">
        <button
          onClick={onLoadSample}
          disabled={isProcessing}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-lg transition-colors disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Load Sample 3-Page Whitepaper</span>
        </button>
        <p className="text-[10px] text-slate-500 text-center mt-1">
          Instant test document with facts on pages 1, 2 & 3 to verify citations
        </p>
      </div>
    </div>
  );
};
