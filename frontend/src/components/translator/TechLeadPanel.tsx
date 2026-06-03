import React from 'react';
import { AlertCircle, CheckCircle2, Code2 } from 'lucide-react';
import toast from 'react-hot-toast';

export interface Suggestion {
  type: string;
  line: number;
  description: string;
  refactored_code: string;
}

interface TechLeadPanelProps {
  suggestions: Suggestion[];
}

export function TechLeadPanel({ suggestions }: TechLeadPanelProps) {
  const handleApply = (suggestion: Suggestion) => {
    // In a full implementation, this would apply the refactored_code to the editor
    navigator.clipboard.writeText(suggestion.refactored_code);
    toast.success('Código copiado para aplicar manually');
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-700/50 rounded-xl overflow-hidden shadow-xl">
      <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-700/50">
        <h3 className="text-sm font-semibold text-slate-200">Tech Lead Auditor</h3>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {suggestions.length === 0 ? (
          <div className="flex h-full items-center justify-center text-slate-500">
            No se han encontrado code smells.
          </div>
        ) : (
          suggestions.map((s, i) => (
            <div key={i} className="bg-slate-800 rounded-lg border border-slate-700 p-4 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <AlertCircle size={18} className="text-amber-400" />
                  <span className="font-semibold text-slate-200">{s.type} Violation</span>
                  <span className="text-xs text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full">Line {s.line}</span>
                </div>
                <button
                  onClick={() => handleApply(s)}
                  className="flex items-center space-x-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-400/10 hover:bg-emerald-400/20 px-2 py-1 rounded transition-colors"
                >
                  <CheckCircle2 size={14} />
                  <span>Accept Refactor</span>
                </button>
              </div>
              <p className="text-sm text-slate-300 mb-4">{s.description}</p>
              <div className="bg-slate-950 rounded border border-slate-800 p-3 overflow-x-auto">
                <div className="flex items-center space-x-2 text-xs text-slate-500 mb-2">
                  <Code2 size={12} />
                  <span>Propuesta de Código Limpio</span>
                </div>
                <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap">
                  {s.refactored_code}
                </pre>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
