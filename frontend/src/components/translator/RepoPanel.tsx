'use client'

import { useState } from 'react'
import { FolderTree, FileCode2, Download, Copy, Check } from 'lucide-react'
import clsx from 'clsx'
import { getMethodConfig } from '@/data/translator'
import type { RepoResult, RepoFile } from '@/data/translator'

interface Props {
  repoUrl: string
  onRepoUrlChange: (url: string) => void
  onKeyDown: (e: React.KeyboardEvent) => void
  repoResult: RepoResult | null
}

export default function RepoPanel({ repoUrl, onRepoUrlChange, onKeyDown, repoResult }: Props) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const currentFile = repoResult?.files.find(f => f.path === selectedFile)

  const handleCopy = () => {
    const text = currentFile?.translated
    if (text) {
      navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownloadAll = () => {
    if (!repoResult) return
    const text = repoResult.files.map(f =>
      `// === ${f.path} ===\n${f.translated}`
    ).join('\n\n')
    if (!text) return
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'translated.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadFile = () => {
    if (!currentFile?.translated) return
    const blob = new Blob([currentFile.translated], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = currentFile.path.replace('/', '_')
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mb-8">
      <label className="block text-sm font-semibold text-secondary-400 mb-2">URL del Repositorio GitHub</label>
      <div className="flex gap-3">
        <input
          type="text"
          value={repoUrl}
          onChange={(e) => onRepoUrlChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="https://github.com/usuario/repo"
          className="flex-1 h-14 bg-code-800 border border-code-700 rounded-2xl px-4 text-sm font-mono text-white placeholder:text-secondary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>
      <p className="text-xs text-secondary-500 mt-2">
        Usa la API pública de GitHub. Repos grandes pueden tomar varios segundos.
      </p>

      {repoResult && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-code-800 border border-code-700 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <FolderTree className="w-4 h-4 text-primary-400" />
                <span className="text-sm font-semibold text-white">Archivos</span>
                <span className="text-[10px] text-secondary-500 ml-auto">
                  {repoResult.translated}/{repoResult.total_files}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-4 text-[10px]">
                <span className="text-emerald-400">{repoResult.translated} traducidos</span>
                {repoResult.skipped > 0 && <span className="text-secondary-500">· {repoResult.skipped} omitidos</span>}
                {repoResult.errors > 0 && <span className="text-red-400">· {repoResult.errors} errores</span>}
                <button
                  onClick={handleDownloadAll}
                  className="ml-auto flex items-center gap-1 text-[10px] text-primary-400 hover:text-white transition-colors"
                >
                  <Download className="w-3 h-3" />
                  Todo
                </button>
              </div>
              <div className="space-y-0.5 max-h-64 overflow-y-auto">
                {repoResult.files.map((f) => (
                  <button
                    key={f.path}
                    onClick={() => setSelectedFile(f.path)}
                    className={clsx(
                      'w-full text-left px-3 py-2 rounded-lg text-xs font-mono transition-colors flex items-center gap-2',
                      selectedFile === f.path
                        ? 'bg-primary-600/20 text-primary-300 border border-primary-700'
                        : 'text-secondary-400 hover:text-white hover:bg-code-700 border border-transparent'
                    )}
                  >
                    <FileCode2 className="w-3 h-3 shrink-0" />
                    <span className="truncate">{f.path}</span>
                    {f.method === 'error' && <span className="ml-auto text-red-400">!</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-secondary-400">
                  {currentFile ? currentFile.path : 'Traducción'}
                </label>
                {currentFile && (() => {
                  const cfg = getMethodConfig(currentFile.method)
                  const Icon = cfg?.icon
                  return cfg && Icon ? (
                    <span className={clsx('flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border', cfg.color)}>
                      <Icon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                  ) : null
                })()}
              </div>
              {currentFile?.translated && (
                <>
                  <button
                    onClick={handleDownloadFile}
                    className="flex items-center gap-1.5 text-xs text-secondary-500 hover:text-white transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Descargar
                  </button>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs text-secondary-500 hover:text-white transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copiado' : 'Copiar'}
                  </button>
                </>
              )}
            </div>
            <textarea
              readOnly
              value={currentFile?.translated || ''}
              placeholder="Selecciona un archivo para ver su traducción"
              className="w-full h-80 bg-code-800 border border-code-700 rounded-2xl p-4 text-sm font-mono text-green-400 resize-none focus:outline-none placeholder:text-secondary-600"
              spellCheck={false}
            />
          </div>
        </div>
      )}
    </div>
  )
}
