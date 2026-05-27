'use client'

import { Copy, Check, Download } from 'lucide-react'
import clsx from 'clsx'
import { getMethodConfig } from '@/data/translator'
import type { Translation } from '@/data/translator'

interface Props {
  code: string
  onCodeChange: (code: string) => void
  translation: (Translation & { result?: string | object }) | null
  submitting: boolean
  onKeyDown: (e: React.KeyboardEvent) => void
  copied: boolean
  onCopy: () => void
  onDownload: () => void
}

export default function CodePanel({
  code, onCodeChange, translation, submitting,
  onKeyDown, copied, onCopy, onDownload,
}: Props) {
  const resultText = translation?.result && typeof translation.result === 'string'
    ? translation.result
    : ''

  const methodConfig = getMethodConfig(translation?.method)
  const MethodIcon = methodConfig?.icon

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div>
        <label className="block text-sm font-semibold text-secondary-400 mb-2">Código Original</label>
        <textarea
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          onKeyDown={onKeyDown}
          className="w-full h-80 bg-code-800 border border-code-700 rounded-2xl p-4 text-sm font-mono text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          spellCheck={false}
        />
      </div>
      <div>
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
                >
                  <Download className="w-3.5 h-3.5" />
                  Descargar
                </button>
                <button
                  onClick={onCopy}
                  className="flex items-center gap-1.5 text-xs text-secondary-500 hover:text-white transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </>
            )}
          </div>
        </div>
        <textarea
          readOnly
          value={resultText}
          placeholder={submitting ? 'Traduciendo...' : 'El resultado aparecerá aquí'}
          className="w-full h-80 bg-code-800 border border-code-700 rounded-2xl p-4 text-sm font-mono text-green-400 resize-none focus:outline-none placeholder:text-secondary-600"
          spellCheck={false}
        />
      </div>
    </div>
  )
}
