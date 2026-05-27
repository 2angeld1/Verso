'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'
import type { Language, Translation, RepoResult } from '@/data/translator'
import { PHP_CODE, JS_CODE } from '@/data/translator'

export interface WsStatus {
  step: number
  total_steps: number
  message: string
  phase: 'analyzing' | 'cache' | 'translating' | 'completed'
}

export interface TranslatorState {
  languages: Language[]
  sourceLang: string
  targetLang: string
  sourceVersion: string
  targetVersion: string
  loading: boolean
  submitting: boolean
  code: string
  repoUrl: string
  mode: 'code' | 'repo'
  translation: (Translation & { result?: string | RepoResult }) | null
  recent: Translation[]
  copied: boolean
  isAutoDetect: boolean
  currentSource: Language | null
  compatibleTargets: string[]
  currentTarget: Language | null
  repoResult: RepoResult | null
  wsStatus: WsStatus | null
}

export interface TranslatorActions {
  setSourceLang: (lang: string) => void
  setTargetLang: (lang: string) => void
  setSourceVersion: (v: string) => void
  setTargetVersion: (v: string) => void
  setCode: (code: string) => void
  setRepoUrl: (url: string) => void
  setMode: (mode: 'code' | 'repo') => void
  handleTranslate: () => Promise<void>
  handleDownload: () => void
  handleCopy: () => void
  handleKeyDown: (e: React.KeyboardEvent) => void
  handleSourceChange: (lang: string) => void
  handleTargetChange: (lang: string, versions: string[]) => void
}

const CAITLYN_WS_URL = typeof window !== 'undefined'
  ? `ws://${window.location.hostname}:8000/api/translator/ws/translate`
  : ''

export function useTranslator(): TranslatorState & TranslatorActions {
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
  const [wsStatus, setWsStatus] = useState<WsStatus | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const resolveRef = useRef<(() => void) | null>(null)

  const isAutoDetect = sourceLang === '__auto__'
  const currentSource = isAutoDetect ? null : languages.find((l) => l.name === sourceLang) ?? null
  const compatibleTargets = currentSource?.canTranslateTo || languages.map(l => l.name)
  const currentTarget = languages.find((l) => l.name === targetLang) ?? null
  const repoResult = translation?.result && typeof translation.result === 'object'
    ? translation.result as RepoResult
    : null

  // Connect WebSocket on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    const connect = () => {
      const ws = new WebSocket(CAITLYN_WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('🔌 WS Verso connected')
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)

          if (msg.type === 'status') {
            setWsStatus({
              step: msg.step,
              total_steps: msg.total_steps,
              message: msg.message,
              phase: msg.phase,
            })
          }

          if (msg.type === 'result') {
            setTranslation({
              id: crypto.randomUUID(),
              sourceLang: msg.source_lang,
              sourceVersion: msg.source_version,
              targetLang: msg.target_lang,
              targetVersion: msg.target_version,
              status: 'completed',
              filesTotal: msg.lines_input,
              filesDone: msg.lines_output,
              createdAt: new Date().toISOString(),
              result: msg.result,
              method: msg.method,
            })
            setRecent((prev) => [{
              id: crypto.randomUUID(),
              sourceLang: msg.source_lang,
              sourceVersion: msg.source_version,
              targetLang: msg.target_lang,
              targetVersion: msg.target_version,
              status: 'completed',
              filesTotal: msg.lines_input,
              filesDone: msg.lines_output,
              createdAt: new Date().toISOString(),
              method: msg.method,
            }, ...prev].slice(0, 20))
            setSubmitting(false)
            setWsStatus(null)
            toast.success('Traducción completada')
            resolveRef.current?.()
          }

          if (msg.type === 'error') {
            toast.error(msg.message || 'Error en traducción')
            setSubmitting(false)
            setWsStatus(null)
            resolveRef.current?.()
          }
        } catch (e) {
          console.error('WS parse error:', e)
        }
      }

      ws.onclose = () => {
        console.log('🔌 WS Verso disconnected, reconnecting in 3s...')
        setTimeout(connect, 3000)
      }

      ws.onerror = (err) => {
        console.error('WS error:', err)
      }
    }

    connect()

    return () => {
      wsRef.current?.close()
    }
  }, [])

  // Load languages
  useEffect(() => {
    fetch('/api/languages')
      .then(async (r) => {
        const text = await r.text()
        return text ? JSON.parse(text) : []
      })
      .then((data: Language[]) => {
        setLanguages(data || [])
        setLoading(false)
      })
      .catch(() => {
        setLanguages([])
        setLoading(false)
      })
  }, [])

  // Load recent translations
  useEffect(() => {
    fetch('/api/translate')
      .then(async (r) => {
        const text = await r.text()
        return text ? JSON.parse(text) : []
      })
      .then((data) => setRecent(data || []))
      .catch(() => setRecent([]))
  }, [])

  // Update code sample when language changes
  useEffect(() => {
    if (sourceLang === 'JavaScript' || sourceLang === 'TypeScript') {
      setCode(JS_CODE)
    } else if (sourceLang !== '__auto__') {
      setCode(PHP_CODE)
    }

    if (sourceLang !== '__auto__' && !compatibleTargets.includes(targetLang)) {
      setTargetLang(sourceLang)
      setTargetVersion(currentSource?.versions?.[0] || '')
    }
  }, [sourceLang])

  useEffect(() => {
    if (currentSource) {
      setSourceVersion(currentSource?.sourceVersions?.[0] || currentSource?.versions?.[0] || '')
    }
  }, [sourceLang])

  const handleTranslate = useCallback(async () => {
    // For repo mode, still use HTTP (WebSocket is for code snippets)
    if (mode === 'repo') {
      setSubmitting(true)
      setTranslation(null)
      setCopied(false)
      try {
        const body: any = {
          sourceLang: isAutoDetect ? '' : sourceLang,
          sourceVersion,
          targetLang,
          targetVersion,
          repoUrl,
        }
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const text = await res.text()
        const data = text ? JSON.parse(text) : {}
        if (!res.ok) {
          toast.error(data.error || 'Error al traducir')
          return
        }
        setTranslation(data)
        setRecent((prev) => [data, ...prev].slice(0, 20))
        toast.success('Traducción completada')
      } catch {
        toast.error('Error de conexión')
      } finally {
        setSubmitting(false)
      }
      return
    }

    // Code mode: use WebSocket for real-time status
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      toast.error('No hay conexión con el servidor. Reconectando...')
      return
    }

    setSubmitting(true)
    setTranslation(null)
    setCopied(false)
    setWsStatus({ step: 0, total_steps: 4, message: 'Conectando...', phase: 'analyzing' })

    return new Promise<void>((resolve) => {
      resolveRef.current = resolve
      ws.send(JSON.stringify({
        source: code,
        source_lang: isAutoDetect ? '' : sourceLang,
        target_lang: targetLang,
        source_version: sourceVersion,
        target_version: targetVersion,
      }))
    })
  }, [sourceLang, sourceVersion, targetLang, targetVersion, code, repoUrl, mode, isAutoDetect])

  const handleDownload = useCallback(() => {
    const text = translation?.result && typeof translation.result === 'string'
      ? translation.result
      : ''
    if (!text) return
    const ext = (targetLang === 'TypeScript' ? 'ts' : targetLang.toLowerCase())
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `translated.${ext}`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Archivo descargado')
  }, [translation, targetLang])

  const handleCopy = useCallback(() => {
    const text = translation?.result && typeof translation.result === 'string'
      ? translation.result
      : ''
    if (text) {
      navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success('Copiado al portapapeles')
    }
  }, [translation])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleTranslate()
    }
  }, [handleTranslate])

  const handleSourceChange = useCallback((lang: string) => {
    setSourceLang(lang)
  }, [])

  const handleTargetChange = useCallback((lang: string, versions: string[]) => {
    setTargetLang(lang)
    setTargetVersion(versions?.[0] || '')
  }, [])

  return {
    languages, sourceLang, targetLang, sourceVersion, targetVersion,
    loading, submitting, code, repoUrl, mode, translation, recent, copied,
    isAutoDetect, currentSource, compatibleTargets, currentTarget, repoResult,
    wsStatus,
    setSourceLang, setTargetLang, setSourceVersion, setTargetVersion,
    setCode, setRepoUrl, setMode,
    handleTranslate, handleDownload, handleCopy, handleKeyDown,
    handleSourceChange, handleTargetChange,
  }
}
