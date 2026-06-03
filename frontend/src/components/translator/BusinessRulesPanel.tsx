import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Download, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

interface BusinessRulesPanelProps {
  markdown: string;
}

export function BusinessRulesPanel({ markdown }: BusinessRulesPanelProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(markdown);
    toast.success('Reglas copiadas al portapapeles');
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'business_rules.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Documento descargado');
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-700/50 rounded-xl overflow-hidden shadow-xl">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800/80 border-b border-slate-700/50">
        <h3 className="text-sm font-semibold text-slate-200">Documentación de Negocio</h3>
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
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-md transition-colors"
            title="Descargar MD"
          >
            <Download size={16} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-6 prose prose-invert prose-sm max-w-none">
        {markdown ? (
          <ReactMarkdown>{markdown}</ReactMarkdown>
        ) : (
          <div className="flex h-full items-center justify-center text-slate-500">
            No se han generado reglas de negocio aún.
          </div>
        )}
      </div>
    </div>
  );
}
