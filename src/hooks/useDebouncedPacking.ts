import { useEffect, useMemo, useRef, useState } from 'react'

import { packMaxRects } from '../lib/packing'
import type { BoardConfig, CutPiece, NormalizedPiece, PackingResult, StockPiece } from '../lib/packing'

export function useDebouncedPacking(args: {
  board: BoardConfig
  cuts: CutPiece[]
  stock?: StockPiece[]
  globalRotationDefault: boolean
  debounceMs?: number
  maxPlacements?: number
}) {
  const { board, cuts, stock = [], globalRotationDefault, debounceMs = 200, maxPlacements = 5000 } = args

  const normalizedPieces = useMemo<NormalizedPiece[]>(() => {
    return cuts.map((c) => {
      const canRotate =
        c.rotation === 'allowed' ? true : c.rotation === 'forbidden' ? false : globalRotationDefault

      return {
        id: c.id,
        label: c.label.trim() || c.id.slice(0, 6),
        widthMm: c.widthMm,
        heightMm: c.heightMm,
        canRotate,
        count: c.quantity,
      }
    })
  }, [cuts, globalRotationDefault])

  const [result, setResult] = useState<PackingResult>(() =>
    packMaxRects({
      board,
      stock,
      pieces: normalizedPieces,
      globalRotationAllowed: true,
      maxPlacements,
    }),
  )

  const [isPending, setIsPending] = useState(false)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    setIsPending(true)
    if (timerRef.current) window.clearTimeout(timerRef.current)

    timerRef.current = window.setTimeout(() => {
      const next = packMaxRects({
        board,
        stock,
        pieces: normalizedPieces,
        globalRotationAllowed: true,
        maxPlacements,
      })
      setResult(next)
      setIsPending(false)
    }, Math.max(50, debounceMs))

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [board, stock, debounceMs, maxPlacements, normalizedPieces])

  return { result, isPending }
}
