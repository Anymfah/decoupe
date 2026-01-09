import { useMemo } from 'react'
import clsx from 'clsx'

import { useAppDispatch, useAppState } from '../hooks/useAppState'
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

export function BoardInput() {
  const { board, globalRotationDefault, gridEnabled } = useAppState()
  const dispatch = useAppDispatch()

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

  return (
    <div className="space-y-5">
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
            <div className="text-sm font-semibold">Zone découpable</div>
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

