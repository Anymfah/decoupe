import { Plus, ListTodo, AlertCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { createEmptyCut, useAppDispatch, useAppState } from '../hooks/useAppState'
import { CutRow } from './CutRow'
import { Button, SectionTitle } from './ui'

export function CutsList() {
  const { cuts, board } = useAppState()
  const dispatch = useAppDispatch()

  const [visibleCount, setVisibleCount] = useState(50)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    // Si l'élément expansé n'existe plus (suppression), on reset
    if (expandedId && !cuts.some((c) => c.id === expandedId)) {
      setExpandedId(null)
    }
  }, [cuts, expandedId])

  const { totalTypes, totalPieces } = useMemo(() => {
    const pieces = cuts.reduce((sum, c) => sum + Math.max(0, c.quantity), 0)
    return { totalTypes: cuts.length, totalPieces: pieces }
  }, [cuts])

  const visibleCuts = cuts.slice(0, Math.max(0, visibleCount))
  const hasMore = visibleCuts.length < cuts.length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
            <ListTodo className="w-4 h-4" />
          </div>
          <SectionTitle className="mb-0">Découpes</SectionTitle>
        </div>
        
        <Button
          variant="primary"
          size="sm"
          type="button"
          onClick={() => {
            const nextCut = createEmptyCut({ label: `P${cuts.length + 1}` })
            dispatch({ type: 'ADD_CUT', cut: nextCut })
            setExpandedId(nextCut.id)
          }}
          className="shadow-sm"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Ajouter
        </Button>
      </div>

      <div className="flex items-center gap-4 px-1">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-muted2 uppercase tracking-widest">Modèles</span>
          <span className="text-sm font-semibold">{totalTypes}</span>
        </div>
        <div className="w-px h-6 bg-white/10" />
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-muted2 uppercase tracking-widest">Pièces</span>
          <span className="text-sm font-semibold">{totalPieces}</span>
        </div>
        <div className="w-px h-6 bg-white/10" />
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-muted2 uppercase tracking-widest">Unité</span>
          <span className="text-sm font-semibold text-accent">{board.unit}</span>
        </div>
      </div>

      {totalPieces > 2000 && (
        <div className="flex items-start gap-3 p-3 rounded-apple-lg bg-warning/10 border border-warning/20 animate-pulse">
          <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
          <p className="text-[11px] text-warning font-medium leading-relaxed">
            Quantité élevée: le moteur d'optimisation peut réduire la précision pour maintenir la fluidité.
          </p>
        </div>
      )}

      <div className="space-y-2 md:space-y-2.5 md:max-h-[600px] md:overflow-y-auto md:pr-1 md:custom-scrollbar">
        {visibleCuts.map((c) => (
          <CutRow
            key={c.id}
            id={c.id}
            isExpanded={expandedId === c.id}
            onToggle={() => setExpandedId((prev) => (prev === c.id ? null : c.id))}
          />
        ))}
        {cuts.length === 0 && (
          <button
            onClick={() => {
              const nextCut = createEmptyCut({ label: `P${cuts.length + 1}` })
              dispatch({ type: 'ADD_CUT', cut: nextCut })
              setExpandedId(nextCut.id)
            }}
            className="w-full text-center py-8 md:py-12 rounded-apple-xl bg-white/[0.02] border border-dashed border-white/10 hover:bg-white/[0.04] hover:border-white/20 transition-all group touch-manipulation active:scale-[0.98]"
          >
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <Plus className="w-5 h-5 md:w-6 md:h-6 text-muted group-hover:text-accent" />
            </div>
            <p className="text-sm text-muted group-hover:text-text transition-colors">Aucune découpe définie</p>
            <p className="text-[11px] text-muted/50 mt-1">Appuyez pour ajouter votre première pièce</p>
          </button>
        )}
      </div>

      {hasMore && (
        <Button
          variant="secondary"
          size="sm"
          className="w-full py-3"
          onClick={() => setVisibleCount((n) => Math.min(cuts.length, n + 50))}
        >
          Afficher les {cuts.length - visibleCount} suivantes
        </Button>
      )}
    </div>
  )
}
