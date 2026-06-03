'use client'

import { Clock, Code2, History } from 'lucide-react'
import clsx from 'clsx'
import Skeleton, { SkeletonLine } from '@/components/ui/Skeleton'
import type { Translation } from '@/data/translator'

interface Props {
  recent: Translation[]
  loading: boolean
}

export default function RecentTranslations({ recent, loading }: Props) {
  if (loading) {
    return (
      <div className="mt-8">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5 text-secondary-500" />
          Traducciones recientes
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-code-800 border border-code-700 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="w-5 h-5" />
                <div className="space-y-2">
                  <SkeletonLine className="w-48" />
                  <SkeletonLine className="w-32" />
                </div>
              </div>
              <Skeleton className="w-16 h-5 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (recent.length === 0) {
    return (
      <div className="mt-8">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5 text-secondary-500" />
          Traducciones recientes
        </h3>
        <div className="bg-code-800/50 border border-code-700/50 rounded-2xl p-12 text-center">
          <History className="w-10 h-10 text-secondary-600 mx-auto mb-4" />
          <p className="text-sm text-secondary-500">Aún no has realizado ninguna traducción.</p>
          <p className="text-xs text-secondary-600 mt-1">Escribe código arriba y presiona "Traducir" para comenzar.</p>
        </div>
      </div>
    )
  }

  return (
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
              {t.status === 'pending' && 'Procesando'}
              {t.status === 'completed' && 'Completado'}
              {t.status === 'failed' && 'Falló'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
