'use client'

import { useRef, useEffect, useCallback } from 'react'
import { Copy, Check, Download, Hash, Command } from 'lucide-react'
import clsx from 'clsx'
import { getMethodConfig } from '@/data/translator'
import type { Translation, RepoResult } from '@/data/translator'
import type { Suggestion } from '@/components/translator/TechLeadPanel'
import type { ZombieEntry } from '@/components/translator/ZombiePanel'
import { TechLeadPanel } from '@/components/translator/TechLeadPanel'
import { BusinessRulesPanel } from '@/components/translator/BusinessRulesPanel'
import { ZombiePanel } from '@/components/translator/ZombiePanel'
import { AgentRulesPanel } from '@/components/translator/AgentRulesPanel'
import Skeleton from '@/components/ui/Skeleton'
import AIToolbar from '@/components/translator/AIToolbar'

interface Props {
  code: string
  onCodeChange: (code: string) => void
  translation: (Translation & { result?: string | RepoResult }) | null
  submitting: boolean
  onKeyDown: (e: React.KeyboardEvent) => void
  copied: boolean
  onCopy: () => void
  onDownload: () => void
  aiViewMode: string
  aiLoading: boolean
  aiSuggestions: Suggestion[]
  aiBusinessRules: string
  aiZombies: ZombieEntry[]
  aiAgentRules: string
  aiAgentFilename: string
  aiSourceLang: string
  onAuditar: () => void
  onExtraerReglas: () => void
  onDetectZombie: () => void
  onGenerateAgentRules: () => void
}

function useAutoResize(ref: React.RefObject<HTMLTextAreaElement | null>, value: string) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(el.scrollHeight, 320)}px`
  }, [ref, value])
}

export default function CodePanel({
  code, onCodeChange, translation, submitting,
  onKeyDown, copied, onCopy, onDownload,
  aiViewMode, aiLoading, aiSuggestions, aiBusinessRules, aiZombies,
  aiAgentRules, aiAgentFilename, aiSourceLang,
  onAuditar, onExtraerReglas, onDetectZombie, onGenerateAgentRules,
}: Props) {
  const sourceRef = useRef<HTMLTextAreaElement>(null)
  const resultRef = useRef<HTMLTextAreaElement>(null)

  useAutoResize(sourceRef, code)

  const resultText = translation?.result && typeof translation.result === 'string'
    ? translation.result
    : ''

  useAutoResize(resultRef, resultText)

  const methodConfig = getMethodConfig(translation?.method)
  const MethodIcon = methodConfig?.icon

  const showAiPanel = aiViewMode !== 'translate'

  const sourceLines = code.split('\n').length
  const resultLines = resultText ? resultText.split('\n').length : 0

  const renderRightPanel = () => {
    if (submitting) {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="w-28 h-4" />
            <div className="flex gap-3">
              <Skeleton className="w-20 h-4" />
              <Skeleton className="w-16 h-4" />
            </div>
          </div>
          <Skeleton className="w-full h-80" />
        </div>
      )
    }
    if (!showAiPanel) {
      return (
        <>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-secondary-400">Código Traducido</label>
            <div className="flex items-center gap-2">
              {methodConfig && MethodIcon && (
                <span className={clsx('flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border', methodConfig.color)}>
                  <MethodIcon className="w-3 h-3" />
                  {methodConfig.label}
                </span>
              )}
              {resultText && (
                <>
                  <button
                    onClick={onDownload}
                    className="flex items-center gap-1.5 text-xs text-secondary-500 hover:text-white transition-colors"
                    title="Descargar"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Descargar</span>
                  </button>
                  <button
                    onClick={onCopy}
                    className="flex items-center gap-1.5 text-xs text-secondary-500 hover:text-white transition-colors"
                    title="Copiar al portapapeles"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">{copied ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </>
              )}
            </div>
          </div>
          <textarea
            ref={resultRef}
            readOnly
            value={resultText}
            placeholder={submitting ? 'Traduciendo...' : 'El resultado aparecerá aquí'}
            className="w-full min-h-80 bg-code-800 border border-code-700 rounded-2xl p-4 text-sm font-mono text-green-400 resize-none focus:outline-none placeholder:text-secondary-600 overflow-hidden"
            spellCheck={false}
          />
          {resultText && (
            <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-secondary-600">
              <Hash className="w-3 h-3" />
              <span>{resultLines} línea{resultLines !== 1 ? 's' : ''}</span>
            </div>
          )}
        </>
      )
    }

    switch (aiViewMode) {
      case 'techlead':
        return <TechLeadPanel suggestions={aiSuggestions} />
      case 'business':
        return <BusinessRulesPanel markdown={aiBusinessRules} />
      case 'zombie':
        return <ZombiePanel zombies={aiZombies} />
      case 'agentrules':
        return (
          <div className="h-80 overflow-hidden rounded-2xl border border-code-700">
            <AgentRulesPanel markdown={aiAgentRules} suggestedFilename={aiAgentFilename} />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-secondary-400">Código Original</label>
          <span className="text-[10px] text-secondary-600 flex items-center gap-1">
            <Hash className="w-3 h-3" />
            {sourceLines} línea{sourceLines !== 1 ? 's' : ''}
          </span>
        </div>
        <AIToolbar
          loadingAi={aiLoading}
          viewMode={aiViewMode}
          onAuditar={onAuditar}
          onExtraerReglas={onExtraerReglas}
          onDetectZombie={onDetectZombie}
          onGenerateAgentRules={onGenerateAgentRules}
        />
        <textarea
          ref={sourceRef}
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          onKeyDown={onKeyDown}
          className="w-full min-h-80 bg-code-800 border border-code-700 rounded-2xl p-4 text-sm font-mono text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent overflow-hidden"
          spellCheck={false}
        />
      </div>
      <div>
        {renderRightPanel()}
      </div>
    </div>
  )
}
