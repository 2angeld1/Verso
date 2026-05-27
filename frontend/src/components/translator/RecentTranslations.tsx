'use client'

import { Clock, Code2 } from 'lucide-react'
import clsx from 'clsx'
import type { Translation } from '@/data/translator'

interface Props {
  recent: Translation[]
}

export default function RecentTranslations({ recent }: Props) {
  if (recent.length === 0) return null

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
              {t.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
