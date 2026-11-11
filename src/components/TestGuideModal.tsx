import React from 'react';
import { X, CheckCircle, HelpCircle, FileCheck, ShieldAlert, GitBranch, ArrowRight, BookOpen } from 'lucide-react';

interface TestGuideModalProps {
  onClose: () => void;
  onRunTestQuery: (query: string) => void;
}

export const TestGuideModal: React.FC<TestGuideModalProps> = ({ onClose, onRunTestQuery }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">RAG Architecture & Testing Guide</h3>
              <p className="text-xs text-slate-300">
                How Retrieval-Augmented Generation works and verification test cases
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {/* Architecture Summary */}
          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 space-y-1.5">
            <h4 className="font-bold text-blue-950 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              <span>How the RAG Pipeline Works</span>
            </h4>
            <p className="text-blue-900 leading-relaxed text-[11px]">
              When a PDF is uploaded, our server extracts each page individually to preserve 1-based page numbers. It creates overlapping text passages and embeds them into a 3072-dimensional vector space using Gemini. When you ask a question, the server embeds your query, computes cosine vector similarity to retrieve only the top relevant chunks, and prompts Gemini 3.8 Flash to answer <strong>strictly</strong> using the retrieved text with explicit <code className="bg-blue-100 px-1 py-0.5 rounded text-blue-800 font-mono">[DocName, page X]</code> citations.
            </p>
          </div>

          {/* Test Scenarios */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Recommended Verification Test Cases
            </h4>

            {/* Test 1 */}
            <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">1. Fact Retrieval with Page 1 Citation</span>
                <button
                  onClick={() => {
                    onRunTestQuery('What was the Levelized Cost of Electricity (LCOE) reached by solar and wind in 2024?');
                    onClose();
                  }}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <span>Test this</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                <strong>Expected result:</strong> Answers $32/MWh for solar and $34/MWh for onshore wind, with explicit citation <code className="text-blue-600">[...pdf, page 1]</code>.
              </p>
            </div>

            {/* Test 2 */}
            <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">2. Technical Specification with Page 2 Citation</span>
                <button
                  onClick={() => {
                    onRunTestQuery('What battery chemistry captured 88% of utility storage and what is its cycle life?');
                    onClose();
                  }}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <span>Test this</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                <strong>Expected result:</strong> Answers Lithium Iron Phosphate (LFP) with over 8,000 cycles, citing <code className="text-blue-600">[...pdf, page 2]</code>.
              </p>
            </div>

            {/* Test 3 */}
            <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">3. Policy & Mandates with Page 3 Citation</span>
                <button
                  onClick={() => {
                    onRunTestQuery('What are the binding requirements under the 2030 Clean Energy Mandate?');
                    onClose();
                  }}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <span>Test this</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                <strong>Expected result:</strong> Answers 80% zero-carbon electricity by 2030, citing <code className="text-blue-600">[...pdf, page 3]</code>.
              </p>
            </div>

            {/* Test 4: Negative condition */}
            <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-950 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                  <span>4. Negative Evidence Test (Absent Topic)</span>
                </span>
                <button
                  onClick={() => {
                    onRunTestQuery('What is the capital expenditure budget for nuclear fusion reactors?');
                    onClose();
                  }}
                  className="text-[11px] font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1"
                >
                  <span>Test negative case</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <p className="text-[11px] text-amber-900">
                <strong>Expected result:</strong> Must respond with: <em>"I couldn't find enough information in the uploaded document to answer that question."</em> Proves the model refuses to hallucinate facts outside the uploaded context.
              </p>
            </div>
          </div>

          {/* Export to GitHub instructions */}
          <div className="p-3.5 rounded-xl bg-slate-900 text-white space-y-2">
            <h4 className="font-bold flex items-center gap-1.5 text-xs text-white">
              <GitBranch className="w-4 h-4 text-emerald-400" />
              <span>Exporting or Syncing to GitHub</span>
            </h4>
            <div className="text-[11px] text-slate-300 space-y-1.5 font-mono">
              <p>1. Initialize Git repository:</p>
              <div className="bg-slate-800 p-2 rounded text-slate-200">
                git init && git add . && git commit -m "Smart PDF AI Assistant"
              </div>
              <p className="font-sans text-[11px] text-slate-400 mt-1">
                2. Push to your GitHub repo. All Gemini API keys are safely configured in environment variables and never committed.
              </p>
            </div>
          </div>
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
