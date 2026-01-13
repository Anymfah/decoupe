import { useEffect, useMemo, useRef, useCallback, useState } from 'react'
import clsx from 'clsx'

import type { BoardConfig, BoardPlan, Unit } from '../lib/packing'
import { BoardViewer } from './BoardViewer'

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
  const isScrollingRef = useRef(false)
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const [containerWidth, setContainerWidth] = useState(0)

  // Measure container width
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setContainerWidth(entry.contentRect.width)
      }
    })
    
    resizeObserver.observe(el)
    setContainerWidth(el.offsetWidth)
    
    return () => resizeObserver.disconnect()
  }, [])

  // Scroll to active index when it changes programmatically
  useEffect(() => {
    const el = containerRef.current
    if (!el || containerWidth === 0 || isScrollingRef.current) return
    
    const targetScroll = safeIndex * containerWidth
    if (Math.abs(el.scrollLeft - targetScroll) > 10) {
      el.scrollTo({ left: targetScroll, behavior: 'smooth' })
    }
  }, [safeIndex, containerWidth])

  const dots = useMemo(() => Array.from({ length: count }, (_, i) => i), [count])

  const onScroll = useCallback(() => {
    const el = containerRef.current
    if (!el || containerWidth === 0) return
    
    // Mark as scrolling
    isScrollingRef.current = true
    
    // Clear previous timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }
    
    // Calculate current index based on scroll position
    const scrollLeft = el.scrollLeft
    const idx = Math.round(scrollLeft / containerWidth)
    const next = Math.max(0, Math.min(count - 1, idx))
    
    if (next !== safeIndex) {
      onChangeActiveIndex(next)
    }
    
    // Reset scrolling flag after scroll ends
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false
    }, 150)
  }, [containerWidth, count, safeIndex, onChangeActiveIndex])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

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
      <div className="hidden md:flex flex-col">
        <div className="flex flex-wrap items-center gap-2">
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
      </div>

      <div className="hidden md:block mt-4">
        <BoardViewer
          board={board}
          plan={plans[safeIndex] ?? null}
          unit={unit}
          gridEnabled={gridEnabled}
          pieceColorById={pieceColorById}
        />
      </div>

      <div className="md:hidden flex flex-col h-full">
        <div
          ref={containerRef}
          onScroll={onScroll}
          className="flex-1 flex snap-x snap-mandatory overflow-x-auto pb-2 scrollbar-hide scroll-smooth touch-pan-x overscroll-x-contain"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {plans.map((p) => (
            <div 
              key={p.boardIndex} 
              className="snap-center snap-always h-full shrink-0"
              style={{ width: containerWidth > 0 ? `${containerWidth}px` : '100%' }}
            >
              <BoardViewer board={board} plan={p} unit={unit} gridEnabled={gridEnabled} pieceColorById={pieceColorById} />
            </div>
          ))}
        </div>
        
        <div className="flex flex-col items-center gap-2 pt-2">
          <div className="flex items-center justify-center gap-2">
            {dots.map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  const el = containerRef.current
                  if (el && containerWidth > 0) {
                    el.scrollTo({ left: i * containerWidth, behavior: 'smooth' })
                  }
                  onChangeActiveIndex(i)
                }}
                aria-label={`Aller à la planche ${i + 1}`}
                className={clsx(
                  'transition-all duration-300 rounded-full',
                  i === safeIndex 
                    ? 'w-6 h-2 bg-accent shadow-[0_0_8px_rgba(30,167,255,0.4)]' 
                    : 'w-2 h-2 bg-white/20 active:bg-white/40'
                )}
              />
            ))}
          </div>
          <div className="text-[10px] font-bold text-muted uppercase tracking-widest opacity-50">
            {safeIndex + 1} / {count}
          </div>
        </div>
      </div>
    </div>
  )
}
