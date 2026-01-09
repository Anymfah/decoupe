import { ChevronDown, ChevronUp, Minus, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import clsx from 'clsx'

import { createEmptyStock, useAppDispatch, useAppState } from '../hooks/useAppState'
import type { StockPiece } from '../lib/packing'
import { formatLength, toMm } from '../lib/units'

type FieldError = {
  width?: string
  height?: string
  kerf?: string
  margin?: string
}

function parseUserNumber(raw: string) {
  const v = Number(raw.replace(',', '.'))
  return Number.isFinite(v) ? v : NaN
}

function validateBoard(widthMm: number, heightMm: number, kerfMm: number, marginMm: number): FieldError {
  const errors: FieldError = {}
  if (!(widthMm > 0)) errors.width = 'Largeur non valide.'
  if (!(heightMm > 0)) errors.height = 'Hauteur non valide.'
  if (kerfMm < 0) errors.kerf = 'Kerf non valide.'
  if (marginMm < 0) errors.margin = 'Marge non valide.'

  const usableW = widthMm - marginMm * 2
  const usableH = heightMm - marginMm * 2
  if (usableW <= 0 || usableH <= 0) errors.margin = 'Marge trop grande: zone découpable nulle.'
  return errors
}

const labelClass = 'text-sm font-medium text-text'
const hintClass = 'mt-1 text-xs text-muted'
const errorClass = 'mt-1 text-xs font-medium text-danger'
const inputClass =
  'h-10 w-full rounded-xl border bg-bg/60 px-3 text-sm shadow-soft outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30'

function StockRow({ stock, unit }: { stock: StockPiece; unit: 'mm' | 'cm' }) {
  const dispatch = useAppDispatch()

  const onChangeNumber =
    (field: 'widthMm' | 'heightMm') =>
    (raw: string) => {
      const n = parseUserNumber(raw)
      const mm = toMm(n, unit)
      dispatch({ type: 'UPDATE_STOCK', id: stock.id, patch: { [field]: Number.isFinite(mm) ? mm : 0 } })
    }

  const onChangeQty = (next: number) => {
    const v = Number.isFinite(next) ? next : 0
    dispatch({ type: 'UPDATE_STOCK', id: stock.id, patch: { quantity: Math.max(0, Math.round(v)) } })
  }

  const dimInputClass =
    'h-8 w-full rounded-lg border bg-bg/50 px-2 text-sm font-mono shadow-soft outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30'

  return (
    <div className="flex items-start gap-3 rounded-xl border bg-bg/40 p-3">
      <div className="grid flex-1 grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-muted">L ({unit})</label>
          <input
            inputMode="decimal"
            className={dimInputClass}
            value={formatLength(stock.widthMm, unit)}
            onChange={(e) => onChangeNumber('widthMm')(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-muted">H ({unit})</label>
          <input
            inputMode="decimal"
            className={dimInputClass}
            value={formatLength(stock.heightMm, unit)}
            onChange={(e) => onChangeNumber('heightMm')(e.target.value)}
          />
        </div>
      </div>

      <div className="w-24">
        <label className="text-xs text-muted">Qté</label>
        <div className="flex h-8 w-full items-center gap-1 rounded-lg border bg-bg/50 px-1 shadow-soft">
          <button
            type="button"
            className="grid h-6 w-6 place-items-center rounded text-muted hover:bg-bg/60 hover:text-text"
            onClick={() => onChangeQty(stock.quantity - 1)}
          >
            <Minus className="h-3 w-3" />
          </button>
          <input
            inputMode="numeric"
            className="h-full w-full bg-transparent text-center text-sm font-mono outline-none"
            value={String(stock.quantity)}
            onChange={(e) => onChangeQty(parseUserNumber(e.target.value))}
          />
          <button
            type="button"
            className="grid h-6 w-6 place-items-center rounded text-muted hover:bg-bg/60 hover:text-text"
            onClick={() => onChangeQty(stock.quantity + 1)}
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="mt-4">
        <button
          type="button"
          className="grid h-8 w-8 place-items-center rounded-lg text-danger transition hover:bg-danger/10"
          onClick={() => dispatch({ type: 'REMOVE_STOCK', id: stock.id })}
          title="Supprimer"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export function BoardInput() {
  const { board, stock, globalRotationDefault, gridEnabled } = useAppState()
  const dispatch = useAppDispatch()
  const [showStock, setShowStock] = useState(false)

  const { errors, usableWmm, usableHmm } = useMemo(() => {
    const errs = validateBoard(board.widthMm, board.heightMm, board.kerfMm, board.marginMm)
    return {
      errors: errs,
      usableWmm: Math.max(0, board.widthMm - board.marginMm * 2),
      usableHmm: Math.max(0, board.heightMm - board.marginMm * 2),
    }
  }, [board.heightMm, board.kerfMm, board.marginMm, board.widthMm])

  const unit = board.unit

  const onUnitChange = (next: 'mm' | 'cm') => {
    dispatch({ type: 'SET_BOARD', patch: { unit: next } })
  }

  const onBoardNumberChange = (field: 'widthMm' | 'heightMm' | 'kerfMm' | 'marginMm') => {
    return (raw: string) => {
      const n = parseUserNumber(raw)
      const mm = field === 'widthMm' || field === 'heightMm' ? toMm(n, unit) : n
      dispatch({ type: 'SET_BOARD', patch: { [field]: Number.isFinite(mm) ? mm : 0 } })
    }
  }

  const stockCount = stock.reduce((acc, s) => acc + s.quantity, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-muted">Étape 1</div>
          <div className="mt-1 text-lg font-semibold">Planche</div>
        </div>
        <div className="inline-flex rounded-xl border bg-bg/60 p-1 shadow-soft">
          <button
            type="button"
            onClick={() => onUnitChange('mm')}
            aria-pressed={unit === 'mm'}
            className={clsx(
              'h-8 rounded-lg px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
              unit === 'mm' ? 'bg-surface shadow-soft' : 'text-muted hover:text-text',
            )}
          >
            mm
          </button>
          <button
            type="button"
            onClick={() => onUnitChange('cm')}
            aria-pressed={unit === 'cm'}
            className={clsx(
              'h-8 rounded-lg px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
              unit === 'cm' ? 'bg-surface shadow-soft' : 'text-muted hover:text-text',
            )}
          >
            cm
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-text">Format standard (illimité)</label>
        </div>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="board-width">
              Largeur
            </label>
            <div className={hintClass}>Unité: {unit}</div>
            <input
              id="board-width"
              inputMode="decimal"
              className={clsx(inputClass, errors.width && 'border-danger focus:border-danger focus:ring-danger/20')}
              value={formatLength(board.widthMm, unit)}
              onChange={(e) => onBoardNumberChange('widthMm')(e.target.value)}
              aria-invalid={Boolean(errors.width)}
            />
            {errors.width ? <div className={errorClass}>{errors.width}</div> : null}
          </div>

          <div>
            <label className={labelClass} htmlFor="board-height">
              Hauteur
            </label>
            <div className={hintClass}>Unité: {unit}</div>
            <input
              id="board-height"
              inputMode="decimal"
              className={clsx(inputClass, errors.height && 'border-danger focus:border-danger focus:ring-danger/20')}
              value={formatLength(board.heightMm, unit)}
              onChange={(e) => onBoardNumberChange('heightMm')(e.target.value)}
              aria-invalid={Boolean(errors.height)}
            />
            {errors.height ? <div className={errorClass}>{errors.height}</div> : null}
          </div>
        </div>
      </div>

      {/* Stock Management Section */}
      <div className="rounded-xl border border-dashed border-border bg-bg/30 p-1">
        <button
          type="button"
          onClick={() => setShowStock(!showStock)}
          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition hover:bg-bg/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span className="flex items-center gap-2">
            {showStock ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            Utiliser des chutes / formats prioritaires
          </span>
          {stockCount > 0 && !showStock && (
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
              {stockCount} en stock
            </span>
          )}
        </button>

        {showStock && (
          <div className="p-3 pt-1 space-y-3">
            <p className="text-xs text-muted">
              Ces planches seront utilisées en priorité avant le format standard.
            </p>
            
            <div className="space-y-2">
              {stock.map((s) => (
                <StockRow key={s.id} stock={s} unit={unit} />
              ))}
            </div>

            <button
              type="button"
              onClick={() => dispatch({ type: 'ADD_STOCK', stock: createEmptyStock() })}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-bg/40 py-2 text-xs font-medium text-muted transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <Plus className="h-4 w-4" />
              Ajouter une planche au stock
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="board-kerf">
            Kerf (mm)
          </label>
          <div className={hintClass}>Perte de coupe entre pièces (mm)</div>
          <input
            id="board-kerf"
            inputMode="decimal"
            className={clsx(inputClass, errors.kerf && 'border-danger focus:border-danger focus:ring-danger/20')}
            value={String(Math.max(0, Math.round(board.kerfMm)))}
            onChange={(e) => onBoardNumberChange('kerfMm')(e.target.value)}
            aria-invalid={Boolean(errors.kerf)}
          />
          {errors.kerf ? <div className={errorClass}>{errors.kerf}</div> : null}
        </div>

        <div>
          <label className={labelClass} htmlFor="board-margin">
            Marge (mm)
          </label>
          <div className={hintClass}>Bord non découpable (mm)</div>
          <input
            id="board-margin"
            inputMode="decimal"
            className={clsx(inputClass, errors.margin && 'border-danger focus:border-danger focus:ring-danger/20')}
            value={String(Math.max(0, Math.round(board.marginMm)))}
            onChange={(e) => onBoardNumberChange('marginMm')(e.target.value)}
            aria-invalid={Boolean(errors.margin)}
          />
          {errors.margin ? <div className={errorClass}>{errors.margin}</div> : null}
        </div>
      </div>

      <div className="rounded-xl border bg-bg/60 p-4 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Zone découpable (standard)</div>
            <div className="mt-1 text-sm text-muted">
              {formatLength(usableWmm, unit)} × {formatLength(usableHmm, unit)} {unit}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[hsl(var(--accent))]"
                checked={globalRotationDefault}
                onChange={(e) => dispatch({ type: 'SET_GLOBAL_ROTATION_DEFAULT', value: e.target.checked })}
              />
              Rotation par défaut
            </label>

            <label className="inline-flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[hsl(var(--accent))]"
                checked={gridEnabled}
                onChange={(e) => dispatch({ type: 'SET_GRID_ENABLED', value: e.target.checked })}
              />
              Grille
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
