'use client'

import clsx from 'clsx'

interface Props {
  sourceVersion: string
  targetVersion: string
  sourceVersions: string[] | undefined
  targetVersions: string[] | undefined
  isAutoDetect: boolean
  onSourceChange: (v: string) => void
  onTargetChange: (v: string) => void
}

export default function VersionSelector({
  sourceVersion, targetVersion, sourceVersions, targetVersions,
  isAutoDetect, onSourceChange, onTargetChange,
}: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
      {!isAutoDetect && (
        <div>
          <label className="block text-sm font-semibold text-secondary-400 mb-2">Versión Origen</label>
          <div className="flex flex-wrap gap-2">
            {sourceVersions?.map((v) => (
              <button
                key={v}
                onClick={() => onSourceChange(v)}
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
      )}
      <div className={isAutoDetect ? 'md:col-span-2' : ''}>
        <label className="block text-sm font-semibold text-secondary-400 mb-2">Versión Destino</label>
        <div className="flex flex-wrap gap-2">
          {targetVersions?.map((v) => (
            <button
              key={v}
              onClick={() => onTargetChange(v)}
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
    </div>
  )
}
