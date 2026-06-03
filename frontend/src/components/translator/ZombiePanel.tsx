import React from 'react';
import { Skull, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export interface ZombieEntry {
  type: string;
  line: number;
  name: string;
  reason: string;
}

interface ZombiePanelProps {
  zombies: ZombieEntry[];
}

export function ZombiePanel({ zombies }: ZombiePanelProps) {
  const handleCopyName = (name: string) => {
    navigator.clipboard.writeText(name);
    toast.success(`"${name}" copiado — busca y elimina en tu editor`);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-700/50 rounded-xl overflow-hidden shadow-xl">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800/80 border-b border-slate-700/50">
        <div className="flex items-center space-x-2">
          <Skull size={16} className="text-red-400" />
          <h3 className="text-sm font-semibold text-slate-200">Código Zombi Detectado</h3>
          {zombies.length > 0 && (
            <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full font-mono">
              {zombies.length} encontrado{zombies.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {zombies.length === 0 ? (
          <div className="flex h-full items-center justify-center text-slate-500">
            No se ha detectado código zombi aún.
          </div>
        ) : (
          zombies.map((z, i) => (
            <div key={i} className="bg-slate-800 rounded-lg border border-slate-700 p-4 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Skull size={16} className="text-red-400" />
                  <span className="font-semibold text-slate-200 text-sm">{z.type}</span>
                  <span className="text-xs text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full font-mono">
                    Línea {z.line}
                  </span>
                </div>
                <button
                  onClick={() => handleCopyName(z.name)}
                  className="flex items-center space-x-1 text-xs font-medium text-red-400 hover:text-red-300 bg-red-400/10 hover:bg-red-400/20 px-2 py-1 rounded transition-colors"
                >
                  <Trash2 size={14} />
                  <span>Eliminar Zombi</span>
                </button>
              </div>
              <p className="text-xs font-mono text-amber-300 mb-2">
                {z.name}
              </p>
              <p className="text-sm text-slate-400">
                {z.reason}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
