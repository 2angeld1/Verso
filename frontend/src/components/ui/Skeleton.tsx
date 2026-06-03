'use client'

import clsx from 'clsx'

interface Props {
  className?: string
  width?: string
  height?: string
  rounded?: boolean
}

export default function Skeleton({ className, width, height, rounded }: Props) {
  return (
    <div
      className={clsx(
        'animate-pulse bg-code-700/60',
        rounded ? 'rounded-full' : 'rounded-xl',
        className,
      )}
      style={{ width, height }}
    />
  )
}

export function SkeletonLine({ className }: { className?: string }) {
  return <Skeleton className={clsx('h-4 w-full', className)} />
}

export function SkeletonCard() {
  return (
    <div className="bg-code-800 border border-code-700 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-4">
        <Skeleton className="w-5 h-5 rounded" />
        <div className="flex-1 space-y-2">
          <SkeletonLine className="w-2/3" />
          <SkeletonLine className="w-1/3" />
        </div>
      </div>
      <Skeleton className="w-16 h-5 rounded-full ml-auto" />
    </div>
  )
}

export function SkeletonTextarea() {
  return (
    <div className="space-y-2">
      <SkeletonLine className="w-24" />
      <Skeleton className="w-full h-80" />
    </div>
  )
}
