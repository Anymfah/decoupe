import { useEffect, useMemo, useRef } from 'react'
import clsx from 'clsx'

import type { BoardConfig, BoardPlan, Unit } from '../lib/packing'
import { BoardViewer } from './BoardViewer'
import { Button } from './ui'

export function BoardsNavigator({
  board,
  unit,
  gridEnabled,
  pieceColorById,
  plans,
  activeIndex,
  onChangeActiveIndex,
}: {
  board: BoardConfig
  unit: Unit
  gridEnabled: boolean
  pieceColorById?: Record<string, string | undefined>
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
    // On utilise scrollWidth / count pour avoir la largeur réelle incluant les gaps éventuels
    const itemWidth = el.scrollWidth / count
    const left = safeIndex * itemWidth
    if (Math.abs(el.scrollLeft - left) > 5) {
      el.scrollTo({ left, behavior: 'smooth' })
    }
  }, [safeIndex, count])

  const dots = useMemo(() => Array.from({ length: count }, (_, i) => i), [count])

  const onScroll = () => {
    const el = containerRef.current
    if (!el) return
    const itemWidth = el.scrollWidth / count
    const idx = Math.round(el.scrollLeft / itemWidth)
    const next = Math.max(0, Math.min(count - 1, idx))
    if (next !== lastIndexRef.current) {
      lastIndexRef.current = next
      onChangeActiveIndex(next)
    }
  }

  if (count <= 1) {
    return (
      <BoardViewer
        board={board}
        plan={plans[0] ?? null}
        unit={unit}
        gridEnabled={gridEnabled}
        pieceColorById={pieceColorById}
      />
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="hidden md:flex flex-col h-full">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {plans.map((p, i) => (
            <button
              key={p.boardIndex}
              type="button"
              onClick={() => onChangeActiveIndex(i)}
              aria-current={i === safeIndex}
              className={clsx(
                'group flex items-center gap-3 px-3 py-2 rounded-apple-lg border transition-all duration-300',
                i === safeIndex 
                  ? 'bg-accent border-accent text-white shadow-premium-hover scale-[1.02]' 
                  : 'bg-white/5 border-white/10 text-muted hover:bg-white/10 hover:border-white/20'
              )}
            >
              <div className={clsx(
                "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border",
                i === safeIndex ? "bg-white/20 border-white/30" : "bg-white/10 border-white/10"
              )}>
                {i + 1}
              </div>
              <div className="flex flex-col items-start leading-none">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Planche</span>
                <span className="text-xs font-bold">{Math.round(p.utilization)}% utile</span>
              </div>
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0">
          <BoardViewer
            board={board}
            plan={plans[safeIndex] ?? null}
            unit={unit}
            gridEnabled={gridEnabled}
            pieceColorById={pieceColorById}
          />
        </div>
      </div>

      <div className="md:hidden flex flex-col h-full">
        <div
          ref={containerRef}
          onScroll={onScroll}
          className="flex-1 flex snap-x snap-mandatory gap-0 overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden scroll-smooth touch-pan-x overscroll-x-contain"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {plans.map((p) => (
            <div key={p.boardIndex} className="w-full flex-none snap-center h-full px-1">
              <BoardViewer board={board} plan={p} unit={unit} gridEnabled={gridEnabled} pieceColorById={pieceColorById} />
            </div>
          ))}
        </div>
        
        <div className="flex flex-col items-center gap-4 mt-2">
          <div className="flex items-center justify-center gap-3 p-2">
            {dots.map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => onChangeActiveIndex(i)}
                aria-label={`Aller à la planche ${i + 1}`}
                className={clsx(
                  'transition-all duration-500 ease-apple-out rounded-full',
                  i === safeIndex 
                    ? 'w-8 h-2.5 bg-accent shadow-[0_0_12px_rgba(30,167,255,0.4)]' 
                    : 'w-2.5 h-2.5 bg-black/20 dark:bg-white/20 hover:bg-black/40 dark:hover:bg-white/40'
                )}
              />
            ))}
          </div>
          <div className="text-[11px] font-bold text-muted uppercase tracking-[0.25em] opacity-60">
            Planche {safeIndex + 1} / {count}
          </div>
        </div>
      </div>
    </div>
  )
}
