'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, ArrowRight, Search, X } from 'lucide-react'
import clsx from 'clsx'
import type { Language } from '@/data/translator'

interface Props {
  sourceLang: string
  targetLang: string
  languages: Language[]
  compatibleTargets: string[]
  onSourceChange: (lang: string) => void
  onTargetChange: (lang: string, versions: string[]) => void
}

function LanguageDropdown({
  value, options, placeholder, onChange, disabled, optionLabel,
}: {
  value: string
  options: string[]
  placeholder: string
  onChange: (v: string) => void
  disabled?: boolean
  optionLabel?: (opt: string) => string
}) {
  const getLabel = (opt: string) => optionLabel ? optionLabel(opt) : opt
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const filtered = query
    ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
    : options

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        className={clsx(
          'w-full h-14 bg-code-800 border border-code-700 rounded-2xl px-4 text-sm font-medium text-white flex items-center justify-between transition-colors',
          !disabled && 'hover:border-code-600',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        <span className={clsx(value ? 'text-white' : 'text-secondary-600')}>
          {value ? getLabel(value) : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-secondary-500 shrink-0 ml-2" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-code-800 border border-code-700 rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-code-700">
            <Search className="w-3.5 h-3.5 text-secondary-500 shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar lenguaje..."
              className="flex-1 bg-transparent text-xs text-white placeholder:text-secondary-600 outline-none"
            />
            {query && (
              <button onClick={() => setQuery('')}>
                <X className="w-3 h-3 text-secondary-500 hover:text-white" />
              </button>
            )}
          </div>
          <div className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-xs text-secondary-600 text-center">Sin resultados</p>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    onChange(opt)
                    setOpen(false)
                    setQuery('')
                  }}
                  className={clsx(
                    'w-full text-left px-4 py-2.5 text-sm transition-colors',
                    opt === value
                      ? 'bg-primary-600/20 text-primary-300'
                      : 'text-secondary-300 hover:bg-code-700 hover:text-white',
                  )}
                >
                  {getLabel(opt)}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function LanguageSelector({
  sourceLang, targetLang, languages, compatibleTargets,
  onSourceChange, onTargetChange,
}: Props) {
  const sourceOptions = ['__auto__', ...languages.map((l) => l.name)]
  const sourceLabel = (opt: string) => opt === '__auto__' ? '🔍 Auto-detectar' : opt
  const targetOptions = languages
    .filter((l) => compatibleTargets.includes(l.name))
    .map((l) => l.name)

  if (languages.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center mb-10">
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-secondary-400 mb-2">Lenguaje Origen</label>
          <div className="h-14 bg-code-800 border border-code-700 rounded-2xl flex items-center px-4">
            <p className="text-sm text-secondary-600">Cargando lenguajes...</p>
          </div>
        </div>
        <div className="flex justify-center pt-6">
          <div className="w-12 h-12 bg-primary-600/10 rounded-2xl flex items-center justify-center">
            <ArrowRight className="w-6 h-6 text-primary-400" />
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-secondary-400 mb-2">Lenguaje Destino</label>
          <div className="h-14 bg-code-800 border border-code-700 rounded-2xl flex items-center px-4">
            <p className="text-sm text-secondary-600">Cargando lenguajes...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center mb-10">
      <div className="md:col-span-2">
        <label className="block text-sm font-semibold text-secondary-400 mb-2">Lenguaje Origen</label>
        <LanguageDropdown
          value={sourceLang}
          options={sourceOptions}
          placeholder="Seleccionar lenguaje"
          optionLabel={sourceLabel}
          onChange={(v) => onSourceChange(v)}
        />
      </div>

      <div className="flex justify-center pt-6">
        <div className="w-12 h-12 bg-primary-600/10 rounded-2xl flex items-center justify-center">
          <ArrowRight className="w-6 h-6 text-primary-400" />
        </div>
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-semibold text-secondary-400 mb-2">Lenguaje Destino</label>
        <LanguageDropdown
          value={targetLang}
          options={targetOptions}
          placeholder="Seleccionar lenguaje"
          onChange={(v) => {
            const lang = languages.find((l) => l.name === v)
            onTargetChange(v, lang?.versions || [])
          }}
        />
      </div>
    </div>
  )
}
