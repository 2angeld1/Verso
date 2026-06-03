'use client'

import { useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import type { Suggestion } from '@/components/translator/TechLeadPanel'
import type { ZombieEntry } from '@/components/translator/ZombiePanel'

const VERSO_API = 'http://localhost:8002'

export type AiViewMode = 'translate' | 'techlead' | 'business' | 'zombie' | 'agentrules'

export interface AiToolsState {
  viewMode: AiViewMode
  loadingAi: boolean
  suggestions: Suggestion[]
  businessRules: string
  zombies: ZombieEntry[]
  agentRules: string
  agentFormat: string
  agentFilename: string
}

export interface AiToolsActions {
  setViewMode: (mode: AiViewMode) => void
  setAgentFormat: (format: string) => void
  handleAuditar: (code: string, sourceLang: string) => Promise<void>
  handleExtraerReglas: (code: string, sourceLang: string) => Promise<void>
  handleDetectZombie: (code: string, sourceLang: string) => Promise<void>
  handleGenerateAgentRules: (code: string, sourceLang: string) => Promise<void>
}

export function useAiTools(): AiToolsState & AiToolsActions {
  const [viewMode, setViewMode] = useState<AiViewMode>('translate')
  const [loadingAi, setLoadingAi] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [businessRules, setBusinessRules] = useState('')
  const [zombies, setZombies] = useState<ZombieEntry[]>([])
  const [agentRules, setAgentRules] = useState('')
  const [agentFormat, setAgentFormat] = useState('agents')
  const [agentFilename, setAgentFilename] = useState('AGENTS.md')

  const handleAuditar = useCallback(async (code: string, sourceLang: string) => {
    if (!code) return
    setLoadingAi(true)
    try {
      const res = await fetch(`${VERSO_API}/analyze-smells`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: code, language: sourceLang || 'Unknown' }),
      })
      if (!res.ok) throw new Error('Falló el análisis')
      const data = await res.json()
      setSuggestions(data.suggestions || [])
      setViewMode('techlead')
    } catch (e) {
      toast.error('Error al auditar código')
      console.error(e)
    } finally {
      setLoadingAi(false)
    }
  }, [])

  const handleExtraerReglas = useCallback(async (code: string, sourceLang: string) => {
    if (!code) return
    setLoadingAi(true)
    try {
      const res = await fetch(`${VERSO_API}/extract-business-rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: code, language: sourceLang || 'Unknown' }),
      })
      if (!res.ok) throw new Error('Falló la extracción')
      const data = await res.json()
      setBusinessRules(data.markdown || '')
      setViewMode('business')
    } catch (e) {
      toast.error('Error al extraer reglas')
      console.error(e)
    } finally {
      setLoadingAi(false)
    }
  }, [])

  const handleDetectZombie = useCallback(async (code: string, sourceLang: string) => {
    if (!code) return
    setLoadingAi(true)
    try {
      const res = await fetch(`${VERSO_API}/detect-zombie-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: code, language: sourceLang || 'Unknown' }),
      })
      if (!res.ok) throw new Error('Falló la detección')
      const data = await res.json()
      setZombies(data.zombies || [])
      setViewMode('zombie')
    } catch (e) {
      toast.error('Error al detectar código zombi')
      console.error(e)
    } finally {
      setLoadingAi(false)
    }
  }, [])

  const handleGenerateAgentRules = useCallback(async (code: string, sourceLang: string) => {
    if (!code) return
    setLoadingAi(true)
    try {
      const res = await fetch(`${VERSO_API}/generate-agent-rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: code, language: sourceLang || 'Unknown', format: agentFormat }),
      })
      if (!res.ok) throw new Error('Falló la generación')
      const data = await res.json()
      setAgentRules(data.markdown || '')
      setAgentFilename(data.suggested_filename || 'AGENTS.md')
      setViewMode('agentrules')
    } catch (e) {
      toast.error('Error al generar reglas de agente')
      console.error(e)
    } finally {
      setLoadingAi(false)
    }
  }, [agentFormat])

  return {
    viewMode, loadingAi, suggestions, businessRules, zombies,
    agentRules, agentFormat, agentFilename,
    setViewMode, setAgentFormat,
    handleAuditar, handleExtraerReglas, handleDetectZombie, handleGenerateAgentRules,
  }
}
