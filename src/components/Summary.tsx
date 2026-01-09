import { AlertTriangle, CheckCircle2, Box, Percent, Maximize, Scissors } from 'lucide-react'
import { useMemo } from 'react'

import type { PackingResult, Unit } from '../lib/packing'
import { KpiPill, GlassCard, cn, Tooltip } from './ui'

function formatPercent(v: number) {
  if (!Number.isFinite(v)) return '0%'
  return `${Math.round(v)}%`
}

function formatAreaMm2(mm2: number) {
  if (!Number.isFinite(mm2)) return '0 m²'
  const m2 = mm2 / 1_000_000
  const rounded = Math.round(m2 * 1000) / 1000
  return `${rounded} m²`
}

export function Summary({
  result,
  activeBoardIndex,
}: {
  result: PackingResult
  activeBoardIndex: number
}) {
  const { boardCount, unplacedCount } = useMemo(() => {
    const boards = result.boards
    const unplaced = result.unplaced.reduce((sum, p) => sum + Math.max(0, p.quantity), 0)
    return {
      boardCount: boards.length,
      unplacedCount: unplaced,
    }
  }, [result.boards, result.unplaced])

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up">
      <KpiPill 
        label="Planches" 
        value={boardCount} 
        icon={Box} 
        color="accent" 
      />
      <Tooltip 
        content="Pourcentage de matière utilisée par vos pièces par rapport à la surface totale consommée."
        wrapperClassName="w-full"
      >
        <KpiPill 
          label="Efficacité" 
          value={formatPercent(result.totalUtilization)} 
          icon={Percent} 
          color={result.totalUtilization > 80 ? 'success' : result.totalUtilization > 50 ? 'accent' : 'warning'} 
          className="w-full h-full"
        />
      </Tooltip>
      <Tooltip 
        content="Surface totale cumulée de toutes les pièces placées."
        wrapperClassName="w-full"
      >
        <KpiPill 
          label="Surface utile" 
          value={formatAreaMm2(result.totalUsedAreaMm2)} 
          icon={Maximize} 
          className="w-full h-full"
        />
      </Tooltip>
      <Tooltip 
        content="Surface perdue (chutes inexploitables et traits de scie)."
        wrapperClassName="w-full"
      >
        <KpiPill 
          label="Chutes / Perte" 
          value={formatAreaMm2(result.totalWasteAreaMm2)} 
          icon={Scissors} 
          color={unplacedCount > 0 ? 'danger' : 'muted'}
          className="w-full h-full"
        />
      </Tooltip>
    </div>
  )
}

export function StatusPanel({ result }: { result: PackingResult }) {
  const hasUnplaced = result.unplaced.length > 0

  return (
    <GlassCard className={cn(
      "border-black/[0.03] dark:border-white/[0.03] mt-4",
      hasUnplaced ? "bg-danger/[0.02] border-danger/10" : "bg-success/[0.02] border-success/10"
    )}>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-4">
          <div className={hasUnplaced ? "text-danger" : "text-success"}>
            {hasUnplaced ? <AlertTriangle className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight">
              {hasUnplaced ? "Optimisation incomplète" : "Optimisation réussie"}
            </h3>
            <p className="text-sm text-muted">
              {hasUnplaced 
                ? `${result.unplaced.length} type(s) de pièces n'ont pas pu être placés.` 
                : "Toutes les pièces ont été placées sur les planches disponibles."}
            </p>
          </div>
        </div>
        
        {!hasUnplaced && (
          <div className="hidden md:block px-4 py-2 rounded-full bg-success/10 border border-success/20 text-success text-xs font-bold uppercase tracking-widest">
            Prêt pour la découpe
          </div>
        )}
      </div>

      {hasUnplaced && (
        <div className="px-5 pb-5 animate-scale-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {result.unplaced.map((u) => (
              <div key={`${u.pieceId}-${u.reason}`} className="p-3 rounded-apple-lg bg-danger/5 border border-danger/10 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-danger/90">{u.label || `ID: ${u.pieceId}`}</span>
                  <span className="text-[10px] font-bold bg-danger/20 text-danger px-1.5 py-0.5 rounded uppercase tracking-wider">
                    ×{u.quantity}
                  </span>
                </div>
                <p className="text-xs text-danger/70 leading-relaxed">{u.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  )
}
