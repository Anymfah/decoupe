import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'

import { createEmptyCut, useAppDispatch, useAppState } from '../hooks/useAppState'
import { CutRow } from './CutRow'

export function CutsList() {
  const { cuts, board } = useAppState()
  const dispatch = useAppDispatch()

  const [visibleCount, setVisibleCount] = useState(50)

  const { totalTypes, totalPieces } = useMemo(() => {
    const pieces = cuts.reduce((sum, c) => sum + Math.max(0, c.quantity), 0)
    return { totalTypes: cuts.length, totalPieces: pieces }
  }, [cuts])

  const visibleCuts = cuts.slice(0, Math.max(0, visibleCount))
  const hasMore = visibleCuts.length < cuts.length

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-muted">Étape 2</div>
          <div className="mt-1 text-lg font-semibold">Découpes</div>
          <div className="mt-1 text-sm text-muted">
            {totalTypes} type{totalTypes > 1 ? 's' : ''} · {totalPieces} pièce{totalPieces > 1 ? 's' : ''} · unité{' '}
            {board.unit}
          </div>
        </div>
        <button
          type="button"
          className="inline-flex h-10 items-center gap-2 rounded-xl border bg-surface px-3 text-sm font-semibold shadow-soft transition duration-300 ease-out hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          onClick={() =>
            dispatch({
              type: 'ADD_CUT',
              cut: createEmptyCut({ label: `P${cuts.length + 1}` }),
            })
          }
        >
          <Plus className="h-4 w-4" />
          Ajouter
        </button>
      </div>

      {totalPieces > 5000 ? (
        <div className="rounded-xl border border-accent/30 bg-bg/60 p-3 text-sm text-muted">
          Quantité totale élevée: l’optimisation peut être limitée automatiquement pour rester fluide.
        </div>
      ) : null}

      <div className="space-y-3">
        {visibleCuts.map((c) => (
          <CutRow key={c.id} id={c.id} />
        ))}
      </div>

      {hasMore ? (
        <div className="flex items-center justify-center">
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center rounded-xl border bg-surface px-4 text-sm font-semibold shadow-soft transition duration-300 ease-out hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            onClick={() => setVisibleCount((n) => Math.min(cuts.length, n + 50))}
          >
            Afficher plus
          </button>
        </div>
      ) : null}
    </div>
  )
}

