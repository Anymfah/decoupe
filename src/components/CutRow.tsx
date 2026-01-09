import { ChevronDown, ChevronUp, Copy, RotateCcw, Trash2, Palette, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react'
import { useMemo, useRef } from 'react'
import clsx from 'clsx'

import type { RotationMode } from '../lib/packing'
import { formatLength, toMm } from '../lib/units'
import { duplicateCutId, useAppDispatch, useAppState } from '../hooks/useAppState'
import { Input, IconButton, Stepper, Tooltip } from './ui'

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
        'flex h-9 w-full items-center rounded-apple-md bg-black/5 dark:bg-white/5 p-1 border border-black/5 dark:border-white/5',
        disabled && 'opacity-60',
      )}
      role="group"
      aria-label="Rotation"
    >
      {(['inherit', 'allowed', 'forbidden'] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          disabled={disabled}
          onClick={() => onChange(mode)}
          aria-pressed={value === mode}
          className={clsx(
            'h-full flex-1 rounded-apple-sm px-2 text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ease-apple-out',
            value === mode ? 'bg-accent text-white shadow-sm' : 'text-muted hover:text-text',
          )}
        >
          {mode === 'inherit' ? 'Auto' : mode === 'allowed' ? 'On' : 'Off'}
        </button>
      ))}
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
  return luminance > 0.55 ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.95)'
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
  const textColor = getContrastColor(displayColorHex)
  const headerLabel = cut.label.trim() || `P-${cut.id.slice(0, 4)}`

  return (
    <div className={clsx(
      'overflow-hidden rounded-apple-xl border transition-all duration-500 ease-apple-out',
      isExpanded ? 'border-accent/20 shadow-lg' : 'border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10 shadow-sm',
      disabled && 'opacity-60 grayscale-[0.2]'
    )}>
      <div
        className="flex w-full items-center gap-3 px-3 py-2 text-left cursor-pointer group relative overflow-hidden"
        style={{ background: displayColorHex, color: textColor }}
        onClick={onToggle}
      >
        {/* Very subtle gloss highlight */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/10 pointer-events-none" />
        
        <div className="relative z-10 flex items-center gap-2.5 w-full">
          <div className="w-7 h-7 rounded-full flex items-center justify-center bg-black/5 dark:bg-white/10 backdrop-blur-sm shrink-0 transition-transform group-hover:scale-110">
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>

          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-bold tracking-tight">{headerLabel}</div>
            <div className="text-[10px] font-bold opacity-70 flex items-center gap-1.5">
              <span>{formatLength(cut.widthMm, unit)} × {formatLength(cut.heightMm, unit)}</span>
              <span className="opacity-30">|</span>
              <span>× {cut.quantity}</span>
            </div>
          </div>

          <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="p-1.5 rounded-apple-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              onClick={() => colorInputRef.current?.click()}
              title="Couleur"
            >
              <Palette className="w-3.5 h-3.5" />
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
              className="p-1.5 rounded-apple-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              onClick={() => dispatch({ type: 'DUPLICATE_CUT', id: cut.id, newId: duplicateCutId() })}
              title="Dupliquer"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              className="p-1.5 rounded-apple-md hover:bg-red-500/10 hover:text-red-600 transition-colors"
              onClick={() => dispatch({ type: 'REMOVE_CUT', id: cut.id })}
              title="Supprimer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="bg-panel-strong/40 backdrop-blur-md p-4 space-y-4 animate-slide-up border-t border-black/5 dark:border-white/5">
          <Input
            label="Désignation"
            value={cut.label}
            onChange={(e) => dispatch({ type: 'UPDATE_CUT', id: cut.id, patch: { label: e.target.value } })}
            placeholder="Ex: Étagère"
            className="h-9"
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="relative group">
              <Input
                label={`Largeur (${unit})`}
                value={formatLength(cut.widthMm, unit)}
                onChange={(e) => onChangeNumber('widthMm')(e.target.value)}
                className="font-mono h-9 pr-16"
              />
              <div className="absolute bottom-1 right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => {
                    const next = Math.max(0, toMm(parseUserNumber(formatLength(cut.widthMm, unit)) - 1, unit));
                    dispatch({ type: 'UPDATE_CUT', id: cut.id, patch: { widthMm: next } });
                  }}
                  className="w-7 h-7 flex items-center justify-center rounded-apple-sm bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <button 
                  onClick={() => {
                    const next = toMm(parseUserNumber(formatLength(cut.widthMm, unit)) + 1, unit);
                    dispatch({ type: 'UPDATE_CUT', id: cut.id, patch: { widthMm: next } });
                  }}
                  className="w-7 h-7 flex items-center justify-center rounded-apple-sm bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div className="relative group">
              <Input
                label={`Hauteur (${unit})`}
                value={formatLength(cut.heightMm, unit)}
                onChange={(e) => onChangeNumber('heightMm')(e.target.value)}
                className="font-mono h-9 pr-16"
              />
              <div className="absolute bottom-1 right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => {
                    const next = Math.max(0, toMm(parseUserNumber(formatLength(cut.heightMm, unit)) - 1, unit));
                    dispatch({ type: 'UPDATE_CUT', id: cut.id, patch: { heightMm: next } });
                  }}
                  className="w-7 h-7 flex items-center justify-center rounded-apple-sm bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <button 
                  onClick={() => {
                    const next = toMm(parseUserNumber(formatLength(cut.heightMm, unit)) + 1, unit);
                    dispatch({ type: 'UPDATE_CUT', id: cut.id, patch: { heightMm: next } });
                  }}
                  className="w-7 h-7 flex items-center justify-center rounded-apple-sm bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-muted2 uppercase tracking-widest px-1">Quantité</label>
              <Stepper value={cut.quantity} onChange={onChangeQty} />
            </div>
            
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <label className="text-[10px] font-bold text-muted2 uppercase tracking-widest px-1">Rotation</label>
                <Tooltip content="Auto: suit le réglage global. On/Off: force ou interdit la rotation pour cette pièce.">
                  <HelpCircle className="w-3 h-3 text-muted/50" />
                </Tooltip>
              </div>
              <RotationSegment
                value={cut.rotation}
                onChange={(rotation) => dispatch({ type: 'UPDATE_CUT', id: cut.id, patch: { rotation } })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-black/[0.03] dark:border-white/[0.03]">
            <Tooltip 
              content="Indique si la rotation est active pour cette pièce d'après vos réglages."
              wrapperClassName="shrink-0"
            >
              <div className="text-[10px] font-bold text-muted2 uppercase tracking-[0.15em] flex items-center gap-2 cursor-help">
                <div className={clsx("w-1.5 h-1.5 rounded-full shadow-sm", rotationEffective ? "bg-success" : "bg-danger")} />
                Eff: {rotationEffective ? 'Autorisée' : 'Bloquée'}
              </div>
            </Tooltip>
            
            <button
              type="button"
              className="text-[10px] font-bold text-muted2 uppercase tracking-[0.15em] hover:text-accent transition-colors flex items-center gap-1.5"
              onClick={() => dispatch({ type: 'UPDATE_CUT', id: cut.id, patch: { colorHex: undefined } })}
            >
              <RotateCcw className="w-3 h-3" />
              Reset couleur
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
