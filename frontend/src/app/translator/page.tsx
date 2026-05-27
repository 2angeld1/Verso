'use client'

import { motion } from 'framer-motion'
import { Layers, Code2, Github, Loader2 } from 'lucide-react'
import clsx from 'clsx'

import LanguageSelector from '@/components/translator/LanguageSelector'
import VersionSelector from '@/components/translator/VersionSelector'
import CodePanel from '@/components/translator/CodePanel'
import RepoPanel from '@/components/translator/RepoPanel'
import RecentTranslations from '@/components/translator/RecentTranslations'
import { useTranslator } from '@/hooks/useTranslator'

export default function TranslatorPage() {
  const {
    loading,
    mode, setMode,
    languages, sourceLang, targetLang, compatibleTargets,
    sourceVersion, targetVersion, currentSource, currentTarget, isAutoDetect,
    code, setCode,
    repoUrl, setRepoUrl,
    submitting, translation, copied,
    repoResult,
    recent,
    handleTranslate, handleDownload, handleCopy, handleKeyDown,
    handleSourceChange, handleTargetChange,
    setSourceVersion, setTargetVersion,
  } = useTranslator()

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

        <LanguageSelector
          sourceLang={sourceLang}
          targetLang={targetLang}
          languages={languages}
          compatibleTargets={compatibleTargets}
          onSourceChange={handleSourceChange}
          onTargetChange={handleTargetChange}
        />

        <VersionSelector
          sourceVersion={sourceVersion}
          targetVersion={targetVersion}
          sourceVersions={currentSource?.sourceVersions}
          targetVersions={currentTarget?.versions}
          isAutoDetect={isAutoDetect}
          onSourceChange={setSourceVersion}
          onTargetChange={setTargetVersion}
        />

        {mode === 'code' ? (
          <CodePanel
            code={code}
            onCodeChange={setCode}
            translation={translation}
            submitting={submitting}
            onKeyDown={handleKeyDown}
            copied={copied}
            onCopy={handleCopy}
            onDownload={handleDownload}
          />
        ) : (
          <RepoPanel
            repoUrl={repoUrl}
            onRepoUrlChange={setRepoUrl}
            onKeyDown={handleKeyDown}
            repoResult={repoResult}
          />
        )}

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

        <RecentTranslations recent={recent} />
      </div>
    </div>
  )
}
