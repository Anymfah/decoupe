import { ChevronDown, ChevronUp, Copy, Minus, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useMemo, useRef } from 'react'
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

function getContrastColor(hex: string) {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim())
  if (!m) return '#ffffff'
  const n = parseInt(m[1], 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.55 ? '#1d1d1f' : '#ffffff'
}

export function CutRow({
  id,
  isExpanded,
  onToggle,
}: {
  id: string
  isExpanded: boolean
  onToggle: () => void
}) {
  const { cuts, board, globalRotationDefault } = useAppState()
  const dispatch = useAppDispatch()
  const colorInputRef = useRef<HTMLInputElement>(null)

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

  const autoColor = useMemo(() => {
    const s = cut.id
    let h = 0
    for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0
    return `hsl(${h % 360} 82% 55%)`
  }, [cut.id])

  const autoColorHex = useMemo(() => {
    const s = cut.id
    let h = 0
    for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0
    const hue = h % 360
    const c = (1 - Math.abs(2 * 0.55 - 1)) * 0.82
    const x = c * (1 - Math.abs(((hue / 60) % 2) - 1))
    const m = 0.55 - c / 2
    let r = 0, g = 0, b = 0
    if (hue < 60) { r = c; g = x; b = 0 }
    else if (hue < 120) { r = x; g = c; b = 0 }
    else if (hue < 180) { r = 0; g = c; b = x }
    else if (hue < 240) { r = 0; g = x; b = c }
    else if (hue < 300) { r = x; g = 0; b = c }
    else { r = c; g = 0; b = x }
    const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0')
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`
  }, [cut.id])

  const displayColorHex = cut.colorHex ?? autoColorHex
  const displayColor = cut.colorHex ?? autoColor
  const textColor = getContrastColor(displayColorHex)
  const headerLabel = cut.label.trim() || `Découpe ${cut.id.slice(0, 4)}`

  return (
    <div className={clsx('overflow-hidden rounded-xl border shadow-soft', disabled && 'opacity-70')}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
        style={{ background: displayColor, color: textColor }}
        aria-expanded={isExpanded}
      >
        <span
          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg"
          style={{ background: 'rgba(255,255,255,0.2)' }}
          aria-hidden="true"
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold">{headerLabel}</div>
          <div className="mt-0.5 text-xs opacity-80">
            {formatLength(cut.widthMm, unit)} × {formatLength(cut.heightMm, unit)} {unit} · × {cut.quantity}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded-lg transition hover:brightness-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            style={{ background: 'rgba(255,255,255,0.2)' }}
            onClick={() => colorInputRef.current?.click()}
            aria-label="Choisir une couleur"
            title="Couleur"
          >
            <span
              className="h-4 w-4 rounded border border-white/40"
              style={{ background: displayColorHex }}
            />
          </button>
          <input
            ref={colorInputRef}
            type="color"
            className="sr-only"
            value={displayColorHex}
            onChange={(e) => dispatch({ type: 'UPDATE_CUT', id: cut.id, patch: { colorHex: e.target.value } })}
          />

          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded-lg transition hover:brightness-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            style={{ background: 'rgba(255,255,255,0.2)' }}
            onClick={() => dispatch({ type: 'UPDATE_CUT', id: cut.id, patch: { colorHex: undefined } })}
            aria-label="Couleur automatique"
            title="Auto"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded-lg transition hover:brightness-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            style={{ background: 'rgba(255,255,255,0.2)' }}
            onClick={() => dispatch({ type: 'DUPLICATE_CUT', id: cut.id, newId: duplicateCutId() })}
            aria-label="Dupliquer"
            title="Dupliquer"
          >
            <Copy className="h-4 w-4" />
          </button>

          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded-lg transition hover:brightness-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            style={{ background: 'rgba(0,0,0,0.15)' }}
            onClick={() => dispatch({ type: 'REMOVE_CUT', id: cut.id })}
            aria-label="Supprimer"
            title="Supprimer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </button>

      {isExpanded ? (
        <div className="space-y-3 bg-bg/60 p-4">
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
                Largeur ({unit})
              </label>
              <input
                id={`cut-w-${cut.id}`}
                inputMode="decimal"
                className={clsx(inputBase, 'font-mono')}
                value={formatLength(cut.widthMm, unit)}
                onChange={(e) => onChangeNumber('widthMm')(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted" htmlFor={`cut-h-${cut.id}`}>
                Hauteur ({unit})
              </label>
              <input
                id={`cut-h-${cut.id}`}
                inputMode="decimal"
                className={clsx(inputBase, 'font-mono')}
                value={formatLength(cut.heightMm, unit)}
                onChange={(e) => onChangeNumber('heightMm')(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-muted" htmlFor={`cut-qty-${cut.id}`}>
                Quantité
              </label>
              <div className="mt-1 inline-flex h-9 w-full items-center gap-1 rounded-xl border bg-bg/50 px-1 shadow-soft">
                <button
                  type="button"
                  className="grid h-7 w-7 place-items-center rounded-lg text-muted transition hover:bg-bg/60 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  onClick={() => onChangeQty(cut.quantity - 1)}
                  aria-label="Diminuer"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  id={`cut-qty-${cut.id}`}
                  inputMode="numeric"
                  className="h-7 w-full rounded-lg bg-transparent px-2 text-center text-sm font-mono text-text outline-none"
                  value={String(cut.quantity)}
                  onChange={(e) => onChangeQty(parseUserNumber(e.target.value))}
                />
                <button
                  type="button"
                  className="grid h-7 w-7 place-items-center rounded-lg text-muted transition hover:bg-bg/60 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  onClick={() => onChangeQty(cut.quantity + 1)}
                  aria-label="Augmenter"
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

          <div className="text-xs text-muted">
            Rotation effective: {rotationEffective ? 'autorisée' : 'interdite'}
          </div>
        </div>
      ) : null}
    </div>
  )
}
