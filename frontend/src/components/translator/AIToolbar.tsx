'use client'

import { Search, FileText, Skull, Bot, Loader2 } from 'lucide-react'
import clsx from 'clsx'

interface Props {
  loadingAi: boolean
  viewMode: string
  onAuditar: () => void
  onExtraerReglas: () => void
  onDetectZombie: () => void
  onGenerateAgentRules: () => void
}

export default function AIToolbar({
  loadingAi, viewMode,
  onAuditar, onExtraerReglas, onDetectZombie, onGenerateAgentRules,
}: Props) {
  const buttons = [
    { id: 'techlead', label: 'Auditar', icon: Search, onClick: onAuditar },
    { id: 'business', label: 'Reglas Negocio', icon: FileText, onClick: onExtraerReglas },
    { id: 'zombie', label: 'Zombies', icon: Skull, onClick: onDetectZombie },
    { id: 'agentrules', label: 'Agentes IA', icon: Bot, onClick: onGenerateAgentRules },
  ]

  return (
    <div className="flex flex-wrap items-center gap-1.5 mb-3">
      {buttons.map((btn) => {
        const Icon = btn.icon
        const isActive = viewMode === btn.id
        return (
          <button
            key={btn.id}
            onClick={btn.onClick}
            disabled={loadingAi}
            className={clsx(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all',
              isActive
                ? 'bg-primary-600/20 text-primary-300 border border-primary-700'
                : 'text-secondary-500 hover:text-secondary-300 hover:bg-code-700 border border-transparent',
              loadingAi && 'opacity-50 cursor-not-allowed',
            )}
          >
            {loadingAi && isActive ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Icon className="w-3 h-3" />
            )}
            {btn.label}
          </button>
        )
      })}
    </div>
  )
}
