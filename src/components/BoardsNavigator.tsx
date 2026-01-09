import { useEffect, useMemo, useRef } from 'react'
import clsx from 'clsx'

import type { BoardConfig, BoardPlan, Unit } from '../lib/packing'
import { BoardViewer } from './BoardViewer'

export function BoardsNavigator({
  board,
  unit,
  gridEnabled,
  plans,
  activeIndex,
  onChangeActiveIndex,
}: {
  board: BoardConfig
  unit: Unit
  gridEnabled: boolean
  plans: BoardPlan[]
  activeIndex: number
  onChangeActiveIndex: (index: number) => void
}) {
  const count = plans.length
  const safeIndex = Math.max(0, Math.min(count - 1, activeIndex))

  const containerRef = useRef<HTMLDivElement | null>(null)
  const lastIndexRef = useRef<number>(safeIndex)

  useEffect(() => {
    lastIndexRef.current = safeIndex
  }, [safeIndex])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const w = el.clientWidth
    if (!w) return
    const left = safeIndex * w
    el.scrollTo({ left, behavior: 'smooth' })
  }, [safeIndex])

  const dots = useMemo(() => Array.from({ length: count }, (_, i) => i), [count])

  const onScroll = () => {
    const el = containerRef.current
    if (!el) return
    const w = el.clientWidth
    if (!w) return
    const idx = Math.round(el.scrollLeft / w)
    const next = Math.max(0, Math.min(count - 1, idx))
    if (next !== lastIndexRef.current) {
      lastIndexRef.current = next
      onChangeActiveIndex(next)
    }
  }

  if (count <= 1) {
    return <BoardViewer board={board} plan={plans[0] ?? null} unit={unit} gridEnabled={gridEnabled} />
  }

  return (
    <div className="space-y-4">
      <div className="hidden items-center justify-between gap-4 md:flex">
        <div className="min-w-0">
          <div className="text-sm font-medium text-muted">Planches</div>
          <div className="mt-1 text-sm text-muted">{count} au total</div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {plans.map((p, i) => (
            <button
              key={p.boardIndex}
              type="button"
              onClick={() => onChangeActiveIndex(i)}
              aria-current={i === safeIndex}
              className={clsx(
                'inline-flex h-9 items-center gap-2 rounded-xl border bg-surface/70 px-3 text-xs font-semibold shadow-soft transition duration-300 ease-out hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                i === safeIndex && 'bg-surface shadow-lift',
              )}
            >
              Planche {i + 1}
              <span className="text-muted">{Math.round(p.utilization)}%</span>
            </button>
          ))}
        </div>
      </div>

      <div className="hidden md:block">
        <BoardViewer board={board} plan={plans[safeIndex] ?? null} unit={unit} gridEnabled={gridEnabled} />
      </div>

      <div className="md:hidden">
        <div
          ref={containerRef}
          onScroll={onScroll}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2"
          style={{ scrollbarWidth: 'none' }}
        >
          {plans.map((p) => (
            <div key={p.boardIndex} className="w-full flex-none snap-center">
              <BoardViewer board={board} plan={p} unit={unit} gridEnabled={gridEnabled} />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-2">
          {dots.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => onChangeActiveIndex(i)}
              aria-label={`Aller à la planche ${i + 1}`}
              className={clsx(
                'h-2.5 w-2.5 rounded-full border transition',
                i === safeIndex ? 'bg-accent border-accent' : 'bg-surface border-border',
              )}
            />
          ))}
        </div>
        <div className="mt-2 text-center text-xs text-muted">
          Planche {safeIndex + 1} / {count}
        </div>
      </div>
    </div>
  )
}

