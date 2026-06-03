'use client'

import { motion } from 'framer-motion'
import { Layers, Code2, Github, Loader2, RotateCcw } from 'lucide-react'
import clsx from 'clsx'

import Skeleton from '@/components/ui/Skeleton'
import LanguageSelector from '@/components/translator/LanguageSelector'
import VersionSelector from '@/components/translator/VersionSelector'
import CodePanel from '@/components/translator/CodePanel'
import RepoPanel from '@/components/translator/RepoPanel'
import RecentTranslations from '@/components/translator/RecentTranslations'
import { useTranslator } from '@/hooks/useTranslator'
import { useAiTools } from '@/hooks/useAiTools'

export default function TranslatorPage() {
  const {
    loading, loadingRecent,
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

  const {
    viewMode, loadingAi, suggestions, businessRules, zombies,
    agentRules, agentFilename,
    setViewMode,
    handleAuditar, handleExtraerReglas, handleDetectZombie, handleGenerateAgentRules,
  } = useAiTools()

  if (loading) {
    return (
      <div className="min-h-screen bg-code-900 pt-32 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-4">
            <Skeleton className="w-96 h-10 mx-auto" />
            <Skeleton className="w-[500px] h-5 mx-auto" />
          </div>
          <div className="flex justify-center mb-10">
            <Skeleton className="w-48 h-14 rounded-2xl" />
          </div>
          <div className="grid grid-cols-5 gap-4 mb-10">
            <Skeleton className="col-span-2 h-14" />
            <Skeleton className="w-12 h-12 rounded-2xl justify-self-center" />
            <Skeleton className="col-span-2 h-14" />
          </div>
          <div className="grid grid-cols-2 gap-6 mb-8">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
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
            aiViewMode={viewMode}
            aiLoading={loadingAi}
            aiSuggestions={suggestions}
            aiBusinessRules={businessRules}
            aiZombies={zombies}
            aiAgentRules={agentRules}
            aiAgentFilename={agentFilename}
            aiSourceLang={sourceLang}
            onAuditar={() => handleAuditar(code, sourceLang)}
            onExtraerReglas={() => handleExtraerReglas(code, sourceLang)}
            onDetectZombie={() => handleDetectZombie(code, sourceLang)}
            onGenerateAgentRules={() => handleGenerateAgentRules(code, sourceLang)}
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
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={handleTranslate}
              disabled={submitting || loadingAi || (mode === 'code' ? !code.trim() : !repoUrl.trim())}
              className={clsx(
                'h-14 px-10 rounded-2xl font-bold text-sm transition-all inline-flex items-center gap-3',
                submitting || loadingAi || (mode === 'code' ? !code.trim() : !repoUrl.trim())
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

            {viewMode !== 'translate' && (
              <button
                onClick={() => setViewMode('translate')}
                className="h-14 px-6 rounded-2xl font-bold text-sm transition-all inline-flex items-center gap-2 bg-code-800 text-secondary-400 hover:text-white border border-code-700"
              >
                <RotateCcw className="w-4 h-4" />
                Volver a Traducción
              </button>
            )}
          </div>
          {mode === 'code' && !submitting && (
            <p className="text-[11px] text-secondary-600 mt-3 flex items-center justify-center gap-1">
              Presiona <kbd className="px-1.5 py-0.5 bg-code-800 border border-code-700 rounded text-[10px] font-mono text-secondary-400">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-code-800 border border-code-700 rounded text-[10px] font-mono text-secondary-400">Enter</kbd> para traducir rápidamente
            </p>
          )}
        </div>

        <RecentTranslations recent={recent} loading={loadingRecent} />
      </div>
    </div>
  )
}
