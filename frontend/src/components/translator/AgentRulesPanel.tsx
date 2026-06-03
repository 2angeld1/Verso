import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Download, Copy, Bot } from 'lucide-react';
import toast from 'react-hot-toast';

const FORMAT_OPTIONS = [
  { value: 'agents', label: 'AGENTS.md (Genérico)', filename: 'AGENTS.md' },
  { value: 'cursorrules', label: '.cursorrules (Cursor)', filename: '.cursorrules' },
  { value: 'copilot', label: 'Copilot Instructions', filename: 'copilot-instructions.md' },
  { value: 'claude', label: 'CLAUDE.md (Claude)', filename: 'CLAUDE.md' },
];

interface AgentRulesPanelProps {
  markdown: string;
  suggestedFilename: string;
}

export function AgentRulesPanel({ markdown, suggestedFilename }: AgentRulesPanelProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(markdown);
    toast.success('Reglas copiadas — pégalas en tu proyecto');
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = suggestedFilename || 'AGENTS.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Descargado como ${suggestedFilename}`);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-700/50 rounded-xl overflow-hidden shadow-xl">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800/80 border-b border-slate-700/50">
        <div className="flex items-center space-x-2">
          <Bot size={16} className="text-purple-400" />
          <h3 className="text-sm font-semibold text-slate-200">Contexto para tu IA favorita</h3>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleCopy}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-md transition-colors"
            title="Copiar"
          >
            <Copy size={16} />
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1 px-2 py-1 text-xs text-purple-400 hover:text-purple-300 bg-purple-400/10 hover:bg-purple-400/20 rounded-md transition-colors font-medium"
            title="Descargar"
          >
            <Download size={14} />
            {suggestedFilename}
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-6 prose prose-invert prose-sm max-w-none">
        {markdown ? (
          <ReactMarkdown>{markdown}</ReactMarkdown>
        ) : (
          <div className="flex h-full items-center justify-center text-slate-500">
            Selecciona un formato y genera las reglas para tu IA.
          </div>
        )}
      </div>
    </div>
  );
}

export { FORMAT_OPTIONS };
