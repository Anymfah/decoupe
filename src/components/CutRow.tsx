import { Copy, Minus, Plus, Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import clsx from 'clsx'

import type { RotationMode } from '../lib/packing'
import { formatLength, toMm } from '../lib/units'
import { duplicateCutId, useAppDispatch, useAppState } from '../hooks/useAppState'

function parseUserNumber(raw: string) {
  const v = Number(raw.replace(',', '.'))
  return Number.isFinite(v) ? v : NaN
}

function RotationSegment({
  value,
  onChange,
  disabled,
}: {
  value: RotationMode
  onChange: (v: RotationMode) => void
  disabled?: boolean
}) {
  return (
    <div
      className={clsx(
        'flex h-9 w-full items-center rounded-xl border bg-bg/60 p-1 shadow-soft',
        disabled && 'opacity-60',
      )}
      role="group"
      aria-label="Rotation"
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('inherit')}
        aria-pressed={value === 'inherit'}
        className={clsx(
          'h-7 flex-1 rounded-lg px-2 text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          value === 'inherit' ? 'bg-surface shadow-soft' : 'text-muted hover:text-text',
        )}
      >
        Auto
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('allowed')}
        aria-pressed={value === 'allowed'}
        className={clsx(
          'h-7 flex-1 rounded-lg px-2 text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          value === 'allowed' ? 'bg-surface shadow-soft' : 'text-muted hover:text-text',
        )}
      >
        On
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('forbidden')}
        aria-pressed={value === 'forbidden'}
        className={clsx(
          'h-7 flex-1 rounded-lg px-2 text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          value === 'forbidden' ? 'bg-surface shadow-soft' : 'text-muted hover:text-text',
        )}
      >
        Off
      </button>
    </div>
  )
}

export function CutRow({ id }: { id: string }) {
  const { cuts, board, globalRotationDefault } = useAppState()
  const dispatch = useAppDispatch()

  const cut = useMemo(() => cuts.find((c) => c.id === id), [cuts, id])
  if (!cut) return null

  const unit = board.unit
  const rotationEffective =
    cut.rotation === 'allowed' ? true : cut.rotation === 'forbidden' ? false : globalRotationDefault

  const onChangeNumber =
    (field: 'widthMm' | 'heightMm') =>
    (raw: string) => {
      const n = parseUserNumber(raw)
      const mm = toMm(n, unit)
      dispatch({ type: 'UPDATE_CUT', id: cut.id, patch: { [field]: Number.isFinite(mm) ? mm : 0 } })
    }

  const onChangeQty = (next: number) => {
    const v = Number.isFinite(next) ? next : 0
    dispatch({ type: 'UPDATE_CUT', id: cut.id, patch: { quantity: Math.max(0, Math.round(v)) } })
  }

  const disabled = cut.quantity <= 0

  const inputBase =
    'mt-1 h-9 w-full rounded-xl border bg-bg/50 px-3 text-sm text-text shadow-soft outline-none transition placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/30'

  return (
    <div className={clsx('rounded-xl border bg-bg/60 p-3 shadow-soft', disabled && 'opacity-70')}>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            className="inline-flex h-9 items-center gap-2 rounded-xl border bg-surface/70 px-3 text-xs font-semibold shadow-soft transition hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            onClick={() => dispatch({ type: 'DUPLICATE_CUT', id: cut.id, newId: duplicateCutId() })}
          >
            <Copy className="h-4 w-4" />
            Dupliquer
          </button>
          <button
            type="button"
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-danger/40 bg-surface/70 px-3 text-xs font-semibold text-danger shadow-soft transition hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
            onClick={() => dispatch({ type: 'REMOVE_CUT', id: cut.id })}
          >
            <Trash2 className="h-4 w-4" />
            Supprimer
          </button>
        </div>

        <div className="min-w-0">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted" htmlFor={`cut-label-${cut.id}`}>
                Nom (optionnel)
              </label>
              <input
                id={`cut-label-${cut.id}`}
                className={inputBase}
                value={cut.label}
                onChange={(e) => dispatch({ type: 'UPDATE_CUT', id: cut.id, patch: { label: e.target.value } })}
                placeholder="Ex: étagère"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted" htmlFor={`cut-w-${cut.id}`}>
                  L
                </label>
                <input
                  id={`cut-w-${cut.id}`}
                  inputMode="decimal"
                  className={clsx(inputBase, 'font-mono')}
                  value={formatLength(cut.widthMm, unit)}
                  onChange={(e) => onChangeNumber('widthMm')(e.target.value)}
                  aria-label="Largeur"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted" htmlFor={`cut-h-${cut.id}`}>
                  H
                </label>
                <input
                  id={`cut-h-${cut.id}`}
                  inputMode="decimal"
                  className={clsx(inputBase, 'font-mono')}
                  value={formatLength(cut.heightMm, unit)}
                  onChange={(e) => onChangeNumber('heightMm')(e.target.value)}
                  aria-label="Hauteur"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-muted" htmlFor={`cut-qty-${cut.id}`}>
                  Qté
                </label>
                <div className="mt-1 inline-flex h-9 w-full items-center gap-1 rounded-xl border bg-bg/50 px-1 shadow-soft">
                  <button
                    type="button"
                    className="grid h-7 w-7 place-items-center rounded-lg text-muted transition hover:bg-bg/60 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    onClick={() => onChangeQty(cut.quantity - 1)}
                    aria-label="Diminuer la quantité"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    id={`cut-qty-${cut.id}`}
                    inputMode="numeric"
                    className="h-7 w-full rounded-lg bg-transparent px-2 text-center text-sm font-mono text-text outline-none"
                    value={String(cut.quantity)}
                    onChange={(e) => onChangeQty(parseUserNumber(e.target.value))}
                    aria-label="Quantité"
                  />
                  <button
                    type="button"
                    className="grid h-7 w-7 place-items-center rounded-lg text-muted transition hover:bg-bg/60 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    onClick={() => onChangeQty(cut.quantity + 1)}
                    aria-label="Augmenter la quantité"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-muted">Rotation</div>
                <div className="mt-1">
                  <RotationSegment
                    value={cut.rotation}
                    onChange={(rotation) => dispatch({ type: 'UPDATE_CUT', id: cut.id, patch: { rotation } })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 text-xs text-muted">
            Rotation effective: {rotationEffective ? 'autorisée' : 'interdite'}
          </div>
        </div>
      </div>
    </div>
  )
}

