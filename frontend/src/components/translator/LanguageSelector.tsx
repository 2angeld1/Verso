'use client'

import { ChevronDown, ArrowRight } from 'lucide-react'
import type { Language } from '@/data/translator'

interface Props {
  sourceLang: string
  targetLang: string
  languages: Language[]
  compatibleTargets: string[]
  onSourceChange: (lang: string) => void
  onTargetChange: (lang: string, versions: string[]) => void
}

export default function LanguageSelector({
  sourceLang, targetLang, languages, compatibleTargets,
  onSourceChange, onTargetChange,
}: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center mb-10">
      <div className="md:col-span-2">
        <label className="block text-sm font-semibold text-secondary-400 mb-2">Lenguaje Origen</label>
        <div className="relative">
          <select
            value={sourceLang}
            onChange={(e) => onSourceChange(e.target.value)}
            className="w-full h-14 bg-code-800 border border-code-700 rounded-2xl px-4 pr-10 text-sm font-medium text-white appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="__auto__">🔍 Auto-detectar</option>
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
              const lang = languages.find(l => l.name === e.target.value)
              onTargetChange(e.target.value, lang?.versions || [])
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
  )
}
