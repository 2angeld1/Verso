'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Copy, Check, Download, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import { getMethodConfig } from '@/data/translator'
import type { Translation } from '@/data/translator'
import type { WsStatus } from '@/hooks/useTranslator'

const MonacoEditor = dynamic(() => import('@monaco-editor/react').then(m => m.default), { ssr: false })
const MonacoDiffEditor = dynamic(() => import('@monaco-editor/react').then(m => m.DiffEditor), { ssr: false })

// Map language names to Monaco language identifiers
function getMonacoLang(lang: string | undefined): string {
  if (!lang) return 'plaintext'
  const map: Record<string, string> = {
    'PHP': 'php',
    'JavaScript': 'javascript',
    'TypeScript': 'typescript',
    'Python': 'python',
    'Java': 'java',
    'Go': 'go',
    'Rust': 'rust',
    'C#': 'csharp',
    'C++': 'cpp',
    'COBOL': 'cobol',
    'Ruby': 'ruby',
    'Kotlin': 'kotlin',
  }
  return map[lang] || 'plaintext'
}

const PHASE_CONFIG: Record<string, { label: string; color: string; gradient: string }> = {
  analyzing: {
    label: 'Analizando',
    color: 'text-blue-400',
    gradient: 'from-blue-500 to-cyan-500',
  },
  cache: {
    label: 'Caché',
    color: 'text-cyan-400',
    gradient: 'from-cyan-500 to-teal-500',
  },
  translating: {
    label: 'Traduciendo',
    color: 'text-amber-400',
    gradient: 'from-amber-500 to-orange-500',
  },
  completed: {
    label: 'Completado',
    color: 'text-emerald-400',
    gradient: 'from-emerald-500 to-green-500',
  },
}

interface Props {
  code: string
  onCodeChange: (code: string) => void
  translation: (Translation & { result?: string | object }) | null
  submitting: boolean
  onKeyDown: (e: React.KeyboardEvent) => void
  copied: boolean
  onCopy: () => void
  onDownload: () => void
  wsStatus: WsStatus | null
  sourceLang?: string
  targetLang?: string
}

export default function CodePanel({
  code, onCodeChange, translation, submitting,
  onKeyDown, copied, onCopy, onDownload,
  wsStatus, sourceLang, targetLang,
}: Props) {
  const resultText = useMemo(() => {
    if (translation?.result && typeof translation.result === 'string') return translation.result
    return ''
  }, [translation])

  const methodConfig = getMethodConfig(translation?.method)
  const MethodIcon = methodConfig?.icon
  const hasResult = !!resultText
  const progress = wsStatus ? (wsStatus.step / wsStatus.total_steps) * 100 : 0
  const phaseConfig = wsStatus ? PHASE_CONFIG[wsStatus.phase] || PHASE_CONFIG.analyzing : null

  const monacoOptions = {
    minimap: { enabled: false },
    fontSize: 13,
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
    fontLigatures: true,
    lineNumbers: 'on' as const,
    scrollBeyondLastLine: false,
    padding: { top: 16, bottom: 16 },
    renderLineHighlight: 'line' as const,
    bracketPairColorization: { enabled: true },
    smoothScrolling: true,
    cursorBlinking: 'smooth' as const,
    cursorSmoothCaretAnimation: 'on' as const,
    wordWrap: 'on' as const,
  }

  return (
    <div className="mb-8" onKeyDown={onKeyDown}>
      {/* Real-time Progress Bar */}
      <AnimatePresence>
        {wsStatus && submitting && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6"
          >
            <div className="bg-code-800 border border-code-700 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className={clsx('w-5 h-5', phaseConfig?.color || 'text-primary-400')} />
                  </motion.div>
                  <span className="text-sm font-semibold text-white">{wsStatus.message}</span>
                </div>
                <span className="text-xs font-mono text-secondary-500">
                  {wsStatus.step}/{wsStatus.total_steps}
                </span>
              </div>
              <div className="relative w-full h-2 bg-code-700 rounded-full overflow-hidden">
                <motion.div
                  className={clsx('absolute inset-y-0 left-0 rounded-full bg-gradient-to-r', phaseConfig?.gradient)}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
                {/* Scanning shimmer effect */}
                <motion.div
                  className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: ['-80px', '400px'] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                />
              </div>
              {/* Step indicators */}
              <div className="flex justify-between mt-3">
                {['Análisis', 'Caché', 'Traducción', 'Listo'].map((label, i) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className={clsx(
                      'w-2 h-2 rounded-full transition-colors',
                      i + 1 <= wsStatus.step
                        ? 'bg-emerald-400'
                        : i + 1 === wsStatus.step + 1
                        ? 'bg-amber-400 animate-pulse'
                        : 'bg-code-600'
                    )} />
                    <span className={clsx(
                      'text-[10px] font-medium transition-colors',
                      i + 1 <= wsStatus.step ? 'text-emerald-400' :
                      i + 1 === wsStatus.step + 1 ? 'text-amber-400' : 'text-secondary-600'
                    )}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor Area */}
      {submitting ? (
        /* Skeleton Loading State */
        <div className="grid grid-cols-2 gap-[1px] bg-code-700 border border-code-700 rounded-2xl overflow-hidden h-[420px]">
          <div className="bg-code-900 p-4">
            <div className="opacity-50 pointer-events-none">
              <MonacoEditor
                height="100%"
                language={getMonacoLang(sourceLang)}
                value={code}
                theme="vs-dark"
                options={{ ...monacoOptions, readOnly: true }}
              />
            </div>
          </div>
          <div className="bg-code-900 p-6 flex flex-col gap-3 relative overflow-hidden">
            {/* Skeleton Lines */}
            <div className="w-3/4 h-4 bg-code-800 rounded animate-pulse" />
            <div className="w-1/2 h-4 bg-code-800 rounded animate-pulse" />
            <div className="w-5/6 h-4 bg-code-800 rounded animate-pulse mt-2" />
            <div className="w-full h-4 bg-code-800 rounded animate-pulse" />
            <div className="w-2/3 h-4 bg-code-800 rounded animate-pulse" />
            <div className="w-4/5 h-4 bg-code-800 rounded animate-pulse mt-2" />
            
            {/* Laser scanner effect over skeleton */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-500/10 to-transparent w-full h-32"
              animate={{ y: ['-100%', '400%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        </div>
      ) : hasResult ? (
        /* Diff View: Side-by-side comparison like VS Code */
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold text-white">Comparativa de cambios</h3>
              {methodConfig && MethodIcon && (
                <span className={clsx('flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border', methodConfig.color)}>
                  <MethodIcon className="w-3 h-3" />
                  {methodConfig.label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
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
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl overflow-hidden border border-code-700"
          >
            <MonacoDiffEditor
              height="420px"
              language={getMonacoLang(targetLang || sourceLang)}
              original={code}
              modified={resultText}
              theme="vs-dark"
              options={{
                ...monacoOptions,
                readOnly: true,
                renderSideBySide: true,
                enableSplitViewResizing: true,
                renderOverviewRuler: false,
                diffWordWrap: 'on',
              }}
            />
          </motion.div>
          <p className="text-[10px] text-secondary-600 mt-2 text-center">
            🔴 Líneas eliminadas (original)&nbsp;&nbsp;·&nbsp;&nbsp;🟢 Líneas agregadas (traducción)
          </p>
        </div>
      ) : (
        /* Single Editor: Input mode */
        <div>
          <label className="block text-sm font-semibold text-secondary-400 mb-2">Código Original</label>
          <div className="rounded-2xl overflow-hidden border border-code-700">
            <MonacoEditor
              height="380px"
              language={getMonacoLang(sourceLang)}
              value={code}
              onChange={(val) => onCodeChange(val || '')}
              theme="vs-dark"
              options={monacoOptions}
            />
          </div>
          <p className="text-[10px] text-secondary-600 mt-2">
            Ctrl+Enter para traducir · Sintaxis resaltada automáticamente
          </p>
        </div>
      )}
    </div>
  )
}
