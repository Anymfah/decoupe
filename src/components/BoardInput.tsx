import { ChevronDown, ChevronUp, Plus, Trash2, Settings2, Box, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import clsx from 'clsx'

import { createEmptyStock, useAppDispatch, useAppState } from '../hooks/useAppState'
import type { StockPiece } from '../lib/packing'
import { formatLength, toMm } from '../lib/units'
import { Input, Button, IconButton, SectionTitle, Stepper, Toggle, Tooltip } from './ui'

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
  if (usableW <= 0 || usableH <= 0) errors.margin = 'Marge trop grande.'
  return errors
}

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

  return (
    <div className="flex items-end gap-3 p-3 rounded-apple-lg bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.05] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-all group">
      <div className="flex-1 grid grid-cols-2 gap-2">
        <Input
          label={`L (${unit})`}
          value={formatLength(stock.widthMm, unit)}
          onChange={(e) => onChangeNumber('widthMm')(e.target.value)}
          className="h-9 py-1 font-mono text-center px-1"
        />
        <Input
          label={`H (${unit})`}
          value={formatLength(stock.heightMm, unit)}
          onChange={(e) => onChangeNumber('heightMm')(e.target.value)}
          className="h-9 py-1 font-mono text-center px-1"
        />
      </div>

      <div className="shrink-0 flex flex-col gap-1">
        <label className="text-[10px] font-bold text-muted2 uppercase tracking-widest px-1">Qté</label>
        <Stepper value={stock.quantity} onChange={onChangeQty} />
      </div>

      <div className="mb-[2px] opacity-0 group-hover:opacity-100 transition-opacity">
        <IconButton
          icon={Trash2}
          variant="danger"
          size="sm"
          onClick={() => dispatch({ type: 'REMOVE_STOCK', id: stock.id })}
          className="w-8 h-8 p-0"
        />
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
            <Box className="w-4 h-4" />
          </div>
          <SectionTitle className="mb-0 text-base">Planche de base</SectionTitle>
        </div>
        
        <div className="flex p-0.5 bg-black/5 dark:bg-white/5 border border-black/[0.05] dark:border-white/[0.05] rounded-apple-lg">
          <button
            onClick={() => onUnitChange('mm')}
            className={clsx(
              "px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-all rounded-apple-md",
              unit === 'mm' ? "bg-accent text-white shadow-sm" : "text-muted hover:text-text"
            )}
          >
            mm
          </button>
          <button
            onClick={() => onUnitChange('cm')}
            className={clsx(
              "px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-all rounded-apple-md",
              unit === 'cm' ? "bg-accent text-white shadow-sm" : "text-muted hover:text-text"
            )}
          >
            cm
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="relative group">
          <Input
            label="Largeur"
            tooltip="Dimension horizontale du panneau brut."
            placeholder={`en ${unit}`}
            value={formatLength(board.widthMm, unit)}
            onChange={(e) => onBoardNumberChange('widthMm')(e.target.value)}
            error={errors.width}
            className="font-mono text-base pr-16"
          />
          <div className="absolute bottom-1 right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => {
                const next = Math.max(0, toMm(parseUserNumber(formatLength(board.widthMm, unit)) - 1, unit));
                dispatch({ type: 'SET_BOARD', patch: { widthMm: next } });
              }}
              className="w-7 h-7 flex items-center justify-center rounded-apple-sm bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <button 
              onClick={() => {
                const next = toMm(parseUserNumber(formatLength(board.widthMm, unit)) + 1, unit);
                dispatch({ type: 'SET_BOARD', patch: { widthMm: next } });
              }}
              className="w-7 h-7 flex items-center justify-center rounded-apple-sm bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
        <div className="relative group">
          <Input
            label="Hauteur"
            tooltip="Dimension verticale du panneau brut."
            placeholder={`en ${unit}`}
            value={formatLength(board.heightMm, unit)}
            onChange={(e) => onBoardNumberChange('heightMm')(e.target.value)}
            error={errors.height}
            className="font-mono text-base pr-16"
          />
          <div className="absolute bottom-1 right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => {
                const next = Math.max(0, toMm(parseUserNumber(formatLength(board.heightMm, unit)) - 1, unit));
                dispatch({ type: 'SET_BOARD', patch: { heightMm: next } });
              }}
              className="w-7 h-7 flex items-center justify-center rounded-apple-sm bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <button 
              onClick={() => {
                const next = toMm(parseUserNumber(formatLength(board.heightMm, unit)) + 1, unit);
                dispatch({ type: 'SET_BOARD', patch: { heightMm: next } });
              }}
              className="w-7 h-7 flex items-center justify-center rounded-apple-sm bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-0.5 rounded-apple-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.05]">
        <button
          type="button"
          onClick={() => setShowStock(!showStock)}
          className="flex w-full items-center justify-between p-3 text-left transition-all hover:bg-black/[0.03] dark:hover:bg-white/[0.03] rounded-apple-lg"
        >
          <div className="flex items-center gap-3">
            <div className={clsx(
              "w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm",
              stockCount > 0 ? "bg-accent/20 text-accent" : "bg-black/5 dark:bg-white/10 text-muted"
            )}>
              <Settings2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[13px] font-bold">Chutes & Stock</div>
              <div className="text-[11px] text-muted font-medium">Formats prioritaires</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {stockCount > 0 && (
              <span className="text-[10px] font-bold bg-accent/20 text-accent px-2 py-0.5 rounded-full uppercase tracking-widest">
                {stockCount}
              </span>
            )}
            {showStock ? <ChevronUp className="h-4 w-4 text-muted2" /> : <ChevronDown className="h-4 w-4 text-muted2" />}
          </div>
        </button>

        {showStock && (
          <div className="p-3 pt-0 space-y-3 animate-slide-up">
            <div className="h-px bg-black/[0.05] dark:bg-white/[0.05] mx-1 mb-3" />
            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
              {stock.map((s) => (
                <StockRow key={s.id} stock={s} unit={unit} />
              ))}
              {stock.length === 0 && (
                <div className="text-center py-8 text-muted text-[11px] font-medium border border-dashed border-black/10 dark:border-white/10 rounded-apple-lg bg-black/[0.01] dark:bg-white/[0.01]">
                  Aucune chute enregistrée.
                </div>
              )}
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => dispatch({ type: 'ADD_STOCK', stock: createEmptyStock() })}
              className="w-full border-dashed bg-transparent hover:bg-black/5 dark:hover:bg-white/5 border-black/10 dark:border-white/10 py-3"
            >
              <Plus className="h-3.5 w-3.5 mr-2" />
              Ajouter une chute
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 pt-2">
        <div className="relative group">
          <Input
            label="Lame / Kerf (mm)"
            tooltip="Épaisseur du trait de coupe de votre scie (matière perdue à chaque coupe)."
            value={String(Math.max(0, Math.round(board.kerfMm)))}
            onChange={(e) => onBoardNumberChange('kerfMm')(e.target.value)}
            error={errors.kerf}
            className="font-mono h-9 pr-16"
          />
          <div className="absolute bottom-1 right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => {
                const next = Math.max(0, board.kerfMm - 1);
                dispatch({ type: 'SET_BOARD', patch: { kerfMm: next } });
              }}
              className="w-7 h-7 flex items-center justify-center rounded-apple-sm bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <button 
              onClick={() => {
                const next = board.kerfMm + 1;
                dispatch({ type: 'SET_BOARD', patch: { kerfMm: next } });
              }}
              className="w-7 h-7 flex items-center justify-center rounded-apple-sm bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
        <div className="relative group">
          <Input
            label="Marge (mm)"
            tooltip="Zone de sécurité sur le pourtour de la planche."
            value={String(Math.max(0, Math.round(board.marginMm)))}
            onChange={(e) => onBoardNumberChange('marginMm')(e.target.value)}
            error={errors.margin}
            className="font-mono h-9 pr-16"
          />
          <div className="absolute bottom-1 right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => {
                const next = Math.max(0, board.marginMm - 1);
                dispatch({ type: 'SET_BOARD', patch: { marginMm: next } });
              }}
              className="w-7 h-7 flex items-center justify-center rounded-apple-sm bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <button 
              onClick={() => {
                const next = board.marginMm + 1;
                dispatch({ type: 'SET_BOARD', patch: { marginMm: next } });
              }}
              className="w-7 h-7 flex items-center justify-center rounded-apple-sm bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-apple-lg bg-accent/[0.03] border border-accent/10 flex items-center justify-between shadow-sm">
        <div>
          <div className="text-[10px] font-bold text-accent uppercase tracking-[0.2em] mb-1">Zone utile</div>
          <div className="text-lg font-mono font-bold tracking-tight">
            {formatLength(usableWmm, unit)} <span className="text-accent/30 text-xs">×</span> {formatLength(usableHmm, unit)} <span className="text-[11px] font-sans font-bold text-muted/60 uppercase tracking-widest">{unit}</span>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <Tooltip content="Active/Désactive la rotation globale pour toutes les pièces réglées sur 'Auto'.">
            <Toggle 
              checked={globalRotationDefault} 
              onChange={(v) => dispatch({ type: 'SET_GLOBAL_ROTATION_DEFAULT', value: v })}
              label="Rotation"
            />
          </Tooltip>
          <Tooltip content="Affiche une grille de 10cm sur les planches pour faciliter la lecture.">
            <Toggle 
              checked={gridEnabled} 
              onChange={(v) => dispatch({ type: 'SET_GRID_ENABLED', value: v })}
              label="Grille"
            />
          </Tooltip>
        </div>
      </div>
    </div>
  )
}
