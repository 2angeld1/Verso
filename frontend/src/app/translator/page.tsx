'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Code2,
  Layers,
  ChevronDown,
  Copy,
  Check,
  Loader2,
  Clock,
  Github,
  FolderTree,
  FileCode2,
  Zap,
  Brain,
  Database,
  Puzzle,
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';

interface Language {
  name: string
  label: string
  versions: string[]
  sourceVersions: string[]
  canTranslateTo: string[]
  targetLang: string
}

interface Translation {
  id: string
  sourceLang: string
  sourceVersion: string
  targetLang: string
  targetVersion: string
  status: string
  filesTotal: number
  filesDone: number
  createdAt: string
  result?: string
  method?: string
}

interface RepoFile {
  path: string
  language: string
  original: string
  translated: string
  method: string
}

interface RepoResult {
  repo_url: string
  total_files: number
  translated: number
  skipped: number
  errors: number
  files: RepoFile[]
}

const PHP_CODE = `<?php
mysql_connect("localhost", "root", "pass");
mysql_select_db("test");

$result = mysql_query("SELECT * FROM users");
while ($row = mysql_fetch_assoc($result)) {
    echo $row['name'] . "<br>";
}

eregi("hello", $text);
split(",", $csv);
?>`;

const JS_CODE = `var x = 1;
var name = "Mundo";

function hello(name) {
    return "Hola " + name;
}

function add(a, b) {
    return a + b;
}

module.exports = { hello, add };`;

const METHOD_CONFIG: Record<string, { label: string, icon: any, color: string }> = {
  cache: { label: 'Caché', icon: Database, color: 'text-cyan-400 bg-cyan-900/20 border-cyan-800' },
  rules: { label: 'Reglas', icon: Puzzle, color: 'text-amber-400 bg-amber-900/20 border-amber-800' },
  rules_fallback: { label: 'Reglas (fallback)', icon: Puzzle, color: 'text-amber-400 bg-amber-900/20 border-amber-800' },
  repo: { label: 'Repo', icon: Github, color: 'text-purple-400 bg-purple-900/20 border-purple-800' },
};

function getMethodConfig(method: string | undefined) {
  if (!method) return null;
  if (METHOD_CONFIG[method]) return METHOD_CONFIG[method];
  if (method.startsWith('gemini:')) return { label: `Gemini ${method.split(':')[1]}`, icon: Brain, color: 'text-emerald-400 bg-emerald-900/20 border-emerald-800' };
  if (method.startsWith('cohere:')) return { label: `Cohere ${method.split(':')[1]}`, icon: Brain, color: 'text-blue-400 bg-blue-900/20 border-blue-800' };
  return { label: method, icon: Zap, color: 'text-secondary-400 bg-code-700 border-code-600' };
}

export default function TranslatorPage() {
  const [languages, setLanguages] = useState<Language[]>([])
  const [sourceLang, setSourceLang] = useState('PHP')
  const [targetLang, setTargetLang] = useState('PHP')
  const [sourceVersion, setSourceVersion] = useState('5.6')
  const [targetVersion, setTargetVersion] = useState('8.2')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [code, setCode] = useState(PHP_CODE)
  const [repoUrl, setRepoUrl] = useState('')
  const [mode, setMode] = useState<'code' | 'repo'>('code')
  const [translation, setTranslation] = useState<Translation & { result?: string | RepoResult } | null>(null)
  const [recent, setRecent] = useState<Translation[]>([])
  const [copied, setCopied] = useState(false)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  const isSameLang = sourceLang === targetLang
  const currentSource = languages.find((l) => l.name === sourceLang)
  const compatibleTargets = currentSource?.canTranslateTo || [sourceLang]
  const showTargetVersion = targetLang === sourceLang || targetLang === currentSource?.targetLang

  useEffect(() => {
    fetch('/api/languages')
      .then((r) => r.json())
      .then((data: Language[]) => {
        setLanguages(data)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    fetch('/api/translate')
      .then((r) => r.json())
      .then(setRecent)
  }, [])

  useEffect(() => {
    if (sourceLang === 'JavaScript' || sourceLang === 'TypeScript') {
      setCode(JS_CODE)
    } else {
      setCode(PHP_CODE)
    }

    if (!compatibleTargets.includes(targetLang)) {
      setTargetLang(sourceLang)
      setTargetVersion(currentSource?.versions?.[0] || '')
    }
  }, [sourceLang])

  useEffect(() => {
    setSourceVersion(currentSource?.sourceVersions?.[0] || currentSource?.versions?.[0] || '')
  }, [sourceLang])

  const currentTarget = languages.find((l) => l.name === targetLang)

  const handleTranslate = useCallback(async () => {
    setSubmitting(true)
    setTranslation(null)
    setSelectedFile(null)
    try {
      const body: any = {
        sourceLang,
        sourceVersion,
        targetLang,
        targetVersion,
      }

      if (mode === 'repo') {
        body.repoUrl = repoUrl
      } else {
        body.code = code
      }

      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Error al traducir')
        return
      }
      setTranslation(data)

      if (data.method === 'repo' && data.result?.files?.length > 0) {
        setSelectedFile(data.result.files[0].path)
      }

      setRecent((prev) => [data, ...prev].slice(0, 20))
      toast.success('Traducción completada')
    } catch (e) {
      toast.error('Error de conexión')
    } finally {
      setSubmitting(false)
    }
  }, [sourceLang, sourceVersion, targetLang, targetVersion, code, repoUrl, mode])

  const handleCopy = () => {
    let text = ''
    if (translation?.result && typeof translation.result === 'string') {
      text = translation.result
    } else if (translation?.result && typeof translation.result === 'object') {
      const repoResult = translation.result as RepoResult
      if (selectedFile) {
        text = repoResult.files.find(f => f.path === selectedFile)?.translated || ''
      } else {
        text = repoResult.files.map(f =>
          `// === ${f.path} ===\n${f.translated}`
        ).join('\n\n')
      }
    }
    if (text) {
      navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success('Copiado al portapapeles')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleTranslate()
    }
  }

  const methodConfig = getMethodConfig(translation?.method)
  const MethodIcon = methodConfig?.icon

  const repoResult = translation?.result && typeof translation.result === 'object'
    ? translation.result as RepoResult
    : null

  const currentFile = repoResult?.files.find(f => f.path === selectedFile)

  if (loading) {
    return (
      <div className="min-h-screen bg-code-900 pt-32 flex items-start justify-center">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin mt-20" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-code-900 pt-32 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
            Traductor de Código
          </h1>
          <p className="text-lg text-secondary-400">
            Traduce código entre lenguajes usando IA híbrida (Gemini → Cohere → Reglas) con caché inteligente.
          </p>
        </motion.div>

        {/* Mode Toggle */}
        <div className="flex justify-center mb-10">
          <div className="bg-code-800 border border-code-700 rounded-2xl p-1 inline-flex">
            <button
              onClick={() => setMode('code')}
              className={clsx(
                'px-6 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-2',
                mode === 'code'
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                  : 'text-secondary-400 hover:text-white'
              )}
            >
              <Code2 className="w-4 h-4" />
              Código
            </button>
            <button
              onClick={() => setMode('repo')}
              className={clsx(
                'px-6 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-2',
                mode === 'repo'
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                  : 'text-secondary-400 hover:text-white'
              )}
            >
              <Github className="w-4 h-4" />
              Repo GitHub
            </button>
          </div>
        </div>

        {/* Language Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center mb-10">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-secondary-400 mb-2">Lenguaje Origen</label>
            <div className="relative">
              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="w-full h-14 bg-code-800 border border-code-700 rounded-2xl px-4 pr-10 text-sm font-medium text-white appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {languages.map((l) => (
                  <option key={l.name}>{l.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-500 pointer-events-none" />
            </div>
          </div>

          <div className="flex justify-center pt-6">
            <div className="w-12 h-12 bg-primary-600/10 rounded-2xl flex items-center justify-center">
              <ArrowRight className="w-6 h-6 text-primary-400" />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-secondary-400 mb-2">Lenguaje Destino</label>
            <div className="relative">
              <select
                value={targetLang}
                onChange={(e) => {
                  setTargetLang(e.target.value)
                  const lang = languages.find(l => l.name === e.target.value)
                  setTargetVersion(lang?.versions?.[0] || '')
                }}
                className="w-full h-14 bg-code-800 border border-code-700 rounded-2xl px-4 pr-10 text-sm font-medium text-white appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {languages
                  .filter(l => compatibleTargets.includes(l.name))
                  .map((l) => (
                    <option key={l.name}>{l.name}</option>
                  ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Version Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <div>
            <label className="block text-sm font-semibold text-secondary-400 mb-2">Versión Origen</label>
            <div className="flex flex-wrap gap-2">
              {currentSource?.sourceVersions?.map((v) => (
                <button
                  key={v}
                  onClick={() => setSourceVersion(v)}
                  className={clsx(
                    'px-4 py-2 rounded-xl text-sm font-mono font-medium border transition-all',
                    sourceVersion === v
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-code-800 text-secondary-400 border-code-700 hover:border-primary-600 hover:text-white'
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          {showTargetVersion && (
            <div>
              <label className="block text-sm font-semibold text-secondary-400 mb-2">Versión Destino</label>
              <div className="flex flex-wrap gap-2">
                {currentTarget?.versions?.map((v) => (
                  <button
                    key={v}
                    onClick={() => setTargetVersion(v)}
                    className={clsx(
                      'px-4 py-2 rounded-xl text-sm font-mono font-medium border transition-all',
                      targetVersion === v
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-code-800 text-secondary-400 border-code-700 hover:border-primary-600 hover:text-white'
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Code Input or Repo URL */}
        {mode === 'code' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-semibold text-secondary-400 mb-2">Código Original</label>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={handleKeyDown}
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
                  {translation?.result && typeof translation.result === 'string' && (
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 text-xs text-secondary-500 hover:text-white transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copiado' : 'Copiar'}
                    </button>
                  )}
                </div>
              </div>
              <textarea
                readOnly
                value={(translation?.result && typeof translation.result === 'string') ? translation.result : ''}
                placeholder={submitting ? 'Traduciendo...' : 'El resultado aparecerá aquí'}
                className="w-full h-80 bg-code-800 border border-code-700 rounded-2xl p-4 text-sm font-mono text-green-400 resize-none focus:outline-none placeholder:text-secondary-600"
                spellCheck={false}
              />
            </div>
          </div>
        ) : (
          <div className="mb-8">
            <label className="block text-sm font-semibold text-secondary-400 mb-2">URL del Repositorio GitHub</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="https://github.com/usuario/repo o https://github.com/usuario/repo/tree/rama/ruta"
                className="flex-1 h-14 bg-code-800 border border-code-700 rounded-2xl px-4 text-sm font-mono text-white placeholder:text-secondary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <p className="text-xs text-secondary-500 mt-2">
              Usa la API pública de GitHub. Repos grandes pueden tomar varios segundos.
            </p>

            {/* Repo Result */}
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
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 text-xs text-secondary-500 hover:text-white transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copiado' : 'Copiar'}
                    </button>
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
        )}

        {/* Translate Button */}
        <div className="text-center mb-16">
          <button
            onClick={handleTranslate}
            disabled={submitting || (mode === 'code' ? !code.trim() : !repoUrl.trim())}
            className={clsx(
              'h-14 px-10 rounded-2xl font-bold text-sm transition-all inline-flex items-center gap-3',
              submitting || (mode === 'code' ? !code.trim() : !repoUrl.trim())
                ? 'bg-code-700 text-secondary-500 cursor-not-allowed'
                : 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-600/20'
            )}
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Layers className="w-5 h-5" />
            )}
            {submitting
              ? 'Traduciendo...'
              : mode === 'repo'
              ? `Traducir Repo a ${targetLang}`
              : `Traducir a ${targetLang}`}
          </button>
        </div>

        {/* Recent Translations */}
        {recent.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-secondary-500" />
              Traducciones recientes
            </h3>
            <div className="space-y-3">
              {recent.map((t) => (
                <div
                  key={t.id}
                  className="bg-code-800 border border-code-700 rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <Code2 className="w-5 h-5 text-secondary-500" />
                    <div>
                      <p className="text-sm font-medium text-white">
                        {t.sourceLang} {t.sourceVersion} → {t.targetLang} {t.targetVersion}
                      </p>
                      <p className="text-xs text-secondary-500">
                        {new Date(t.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span className={clsx(
                    'px-2 py-0.5 rounded-full text-[10px] font-semibold',
                    t.status === 'pending' && 'bg-amber-900/30 text-amber-400',
                    t.status === 'completed' && 'bg-emerald-900/30 text-emerald-400',
                    t.status === 'failed' && 'bg-red-900/30 text-red-400',
                  )}>
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
