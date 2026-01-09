import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useMemo } from 'react'

import type { PackingResult, Unit } from '../lib/packing'

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

function plural(n: number, one: string, many: string) {
  return n === 1 ? one : many
}

export function Summary({
  result,
  unit,
  activeBoardIndex,
}: {
  result: PackingResult
  unit: Unit
  activeBoardIndex: number
}) {
  const { boardCount, placedCount, unplacedCount, activeUtilization } = useMemo(() => {
    const boards = result.boards
    const placed = boards.reduce((sum, b) => sum + b.placements.length, 0)
    const unplaced = result.unplaced.reduce((sum, p) => sum + Math.max(0, p.quantity), 0)
    const active = boards[activeBoardIndex]?.utilization ?? 0
    return {
      boardCount: boards.length,
      placedCount: placed,
      unplacedCount: unplaced,
      activeUtilization: active,
    }
  }, [activeBoardIndex, result.boards, result.unplaced])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="rounded-2xl border bg-surface/70 p-4 shadow-soft backdrop-blur-xl">
          <div className="text-sm font-medium text-muted">Planches</div>
          <div className="mt-2 text-2xl font-semibold">{boardCount}</div>
          <div className="mt-1 text-sm text-muted">
            {placedCount} {plural(placedCount, 'placement', 'placements')}
          </div>
        </div>

        <div className="rounded-2xl border bg-surface/70 p-4 shadow-soft backdrop-blur-xl">
          <div className="text-sm font-medium text-muted">Utilisation globale</div>
          <div className="mt-2 text-2xl font-semibold">{formatPercent(result.totalUtilization)}</div>
          <div className="mt-1 text-sm text-muted">Planche courante: {formatPercent(activeUtilization)}</div>
        </div>

        <div className="rounded-2xl border bg-surface/70 p-4 shadow-soft backdrop-blur-xl">
          <div className="text-sm font-medium text-muted">Surface utilisée</div>
          <div className="mt-2 text-2xl font-semibold">{formatAreaMm2(result.totalUsedAreaMm2)}</div>
          <div className="mt-1 text-sm text-muted">Unités: {unit}</div>
        </div>

        <div className="rounded-2xl border bg-surface/70 p-4 shadow-soft backdrop-blur-xl">
          <div className="text-sm font-medium text-muted">Chute</div>
          <div className="mt-2 text-2xl font-semibold">{formatAreaMm2(result.totalWasteAreaMm2)}</div>
          <div className="mt-1 text-sm text-muted">
            {unplacedCount > 0 ? `${unplacedCount} non placée(s)` : 'Tout placé'}
          </div>
        </div>
      </div>
    </div>
  )
}

export function StatusPanel({ result }: { result: PackingResult }) {
  const hasUnplaced = result.unplaced.length > 0

  return (
    <div className="rounded-2xl border bg-surface/70 p-4 shadow-soft backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-muted">Statut</div>
          <div className="mt-1 text-lg font-semibold">Pièces non placées</div>
          <div className="mt-1 text-sm text-muted">
            Explications pour les pièces impossibles (marge incluse, rotation, etc.)
          </div>
        </div>
        <div className="shrink-0">
          {hasUnplaced ? (
            <div className="inline-flex items-center gap-2 rounded-xl border border-danger/30 bg-bg/60 px-3 py-2 text-sm font-semibold text-danger">
              <AlertTriangle className="h-4 w-4" />
              Attention
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-xl border border-success/30 bg-bg/60 px-3 py-2 text-sm font-semibold text-success">
              <CheckCircle2 className="h-4 w-4" />
              OK
            </div>
          )}
        </div>
      </div>

      {hasUnplaced ? (
        <div className="mt-4 space-y-2">
          {result.unplaced.map((u) => (
            <div key={`${u.pieceId}-${u.reason}`} className="rounded-xl border bg-bg/60 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0 font-semibold">{u.label || u.pieceId}</div>
                <div className="text-sm text-muted">× {u.quantity}</div>
              </div>
              <div className="mt-1 text-sm text-muted">{u.message}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border bg-bg/60 p-4 text-sm text-muted">Toutes les pièces demandées ont été placées.</div>
      )}
    </div>
  )
}

