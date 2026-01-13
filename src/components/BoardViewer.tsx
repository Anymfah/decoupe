import { Download } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import type { BoardConfig, BoardPlan, Placement, Rect, Unit } from '../lib/packing'
import { formatLength } from '../lib/units'

function TooltipPortal({
  clientX,
  clientY,
  placement,
  unit,
}: {
  clientX: number
  clientY: number
  placement: Placement
  unit: Unit
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ left: 0, top: 0 })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const pad = 12
    let left = clientX + 16
    let top = clientY - rect.height / 2

    if (left + rect.width + pad > window.innerWidth) {
      left = clientX - rect.width - 16
    }
    if (left < pad) left = pad

    if (top < pad) top = pad
    if (top + rect.height + pad > window.innerHeight) {
      top = window.innerHeight - rect.height - pad
    }

    setPos({ left, top })
  }, [clientX, clientY])

  return createPortal(
    <div
      ref={ref}
      className="pointer-events-none fixed z-50 rounded-apple-lg border border-white/20 bg-[#070A10]/95 px-4 py-3 text-xs shadow-glass-lg backdrop-blur-xl animate-scale-in"
      style={{ left: pos.left, top: pos.top, minWidth: 200, maxWidth: 300 }}
      role="tooltip"
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="min-w-0 font-bold text-white text-sm">{placement.label}</div>
        <div className="shrink-0 text-[10px] font-bold bg-white/10 text-muted px-1.5 py-0.5 rounded uppercase tracking-wider">
          {placement.rotated ? 'Rotation' : 'Normal'}
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between items-center text-muted">
          <span>Dimensions:</span>
          <span className="text-white font-mono">{formatLength(placement.w, unit)} × {formatLength(placement.h, unit)} {unit}</span>
        </div>
        <div className="flex justify-between items-center text-muted">
          <span>Position:</span>
          <span className="text-white font-mono">X: {formatLength(placement.x, unit)} · Y: {formatLength(placement.y, unit)}</span>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function hashHue(input: string) {
  let h = 0
  for (let i = 0; i < input.length; i += 1) h = (h * 31 + input.charCodeAt(i)) >>> 0
  return h % 360
}

function hexToRgb(hex: string) {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim())
  if (!m) return null
  const n = parseInt(m[1], 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

function rgbToHex(rgb: { r: number; g: number; b: number }) {
  const to = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
  return `#${to(rgb.r)}${to(rgb.g)}${to(rgb.b)}`.toUpperCase()
}

function darken(hex: string, factor: number) {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  return rgbToHex({ r: rgb.r * factor, g: rgb.g * factor, b: rgb.b * factor })
}

function colorForPiece(pieceId: string, overrideHex?: string) {
  if (overrideHex && /^#[0-9a-fA-F]{6}$/.test(overrideHex)) {
    return {
      fill: overrideHex,
      stroke: darken(overrideHex, 0.7),
    }
  }

  const hue = hashHue(pieceId)
  return {
    fill: `hsl(${hue}, 70%, 55%)`,
    stroke: `hsl(${hue}, 70%, 40%)`,
  }
}

function rectArea(r: Rect) {
  return Math.max(0, r.w) * Math.max(0, r.h)
}

function mmToLabel(mm: number, unit: Unit) {
  return `${formatLength(mm, unit)}${unit}`
}

async function exportSvgToPng(svg: SVGSVGElement, fileName: string) {
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

  // Set default styles for export
  clone.style.backgroundColor = '#070A10';
  
  const viewBox = clone.viewBox.baseVal
  const vbW = viewBox?.width || Number(clone.getAttribute('width')) || 1000
  const vbH = viewBox?.height || Number(clone.getAttribute('height')) || 1000

  const targetW = clamp(2400, 800, 4000)
  const scale = targetW / vbW
  const targetH = Math.round(vbH * scale)

  const serializer = new XMLSerializer()
  const svgText = serializer.serializeToString(clone)
  const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' })
  const svgUrl = URL.createObjectURL(svgBlob)

  const img = new Image()
  img.decoding = 'async'
  img.src = svgUrl

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('Image load failed'))
  })

  const canvas = document.createElement('canvas')
  canvas.width = targetW
  canvas.height = targetH
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.fillStyle = '#070A10'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  URL.revokeObjectURL(svgUrl)

  const pngUrl = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = pngUrl
  a.download = fileName
  a.click()
}

export function BoardViewer({
  board,
  plan,
  unit,
  gridEnabled,
  pieceColorById,
}: {
  board: BoardConfig
  plan: BoardPlan | null
  unit: Unit
  gridEnabled: boolean
  pieceColorById?: Record<string, string | undefined>
}) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [hover, setHover] = useState<{
    placement: Placement
    clientX: number
    clientY: number
  } | null>(null)

  const boardW = Math.max(1, plan?.widthMm ?? board.widthMm)
  const boardH = Math.max(1, plan?.heightMm ?? board.heightMm)
  const usable = plan?.usableRect ?? {
    x: board.marginMm,
    y: board.marginMm,
    w: Math.max(0, boardW - board.marginMm * 2),
    h: Math.max(0, boardH - board.marginMm * 2),
  }

  const gridStep = useMemo(() => {
    const maxSide = Math.max(boardW, boardH)
    if (maxSide >= 6000) return 250
    if (maxSide >= 3000) return 200
    if (maxSide >= 1600) return 100
    return 50
  }, [boardH, boardW])

  const wasteRects = useMemo(() => {
    const raw = plan?.wasteRects ?? []
    return raw
      .filter((r) => r.w > 0 && r.h > 0)
      .sort((a, b) => rectArea(b) - rectArea(a))
      .slice(0, 250)
  }, [plan?.wasteRects])

  const placements = plan?.placements ?? []

  return (
    <div className="relative flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between gap-2 px-1">
        <div className="min-w-0 flex-1">
          <div className="text-[9px] font-bold text-muted2 uppercase tracking-widest mb-0.5">Format de planche</div>
          <div className="text-sm font-bold tracking-tight text-white/90">
            {mmToLabel(boardW, unit)} <span className="text-muted/40 font-normal">×</span> {mmToLabel(boardH, unit)}
          </div>
        </div>
        <button
          onClick={() => {
            if (!svgRef.current) return
            exportSvgToPng(svgRef.current, `ezcut-be-planche-${(plan?.boardIndex ?? 0) + 1}.png`)
          }}
          className="shrink-0 flex items-center gap-1 px-2 py-1.5 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-muted hover:text-white"
        >
          <Download className="h-3.5 w-3.5" />
          <span className="text-[10px] font-bold uppercase tracking-wide">PNG</span>
        </button>
      </div>

      <div className="relative h-[500px] flex-1 overflow-hidden rounded-apple-lg border border-black/5 dark:border-white/5 bg-black/5 dark:bg-black/40 shadow-inner p-2">
        <svg
          ref={svgRef}
          className="h-full w-full drop-shadow-2xl"
          viewBox={`0 0 ${boardW} ${boardH}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Prévisualisation de la planche"
          onPointerLeave={() => setHover(null)}
        >
          {/* Main Board Area */}
          <rect x={0} y={0} width={boardW} height={boardH} fill="#0A0E14" rx={4} ry={4} />

          {/* Board border */}
          <rect
            x={0}
            y={0}
            width={boardW}
            height={boardH}
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={2}
            rx={4}
            ry={4}
          />

          {/* Usable Area (Margin) */}
          <rect
            x={usable.x}
            y={usable.y}
            width={usable.w}
            height={usable.h}
            fill="transparent"
            stroke="rgba(30, 167, 255, 0.3)"
            strokeDasharray="12 8"
            strokeWidth={2}
          />

          {/* Grid lines */}
          {gridEnabled && (
            <g opacity={0.2}>
              {Array.from({ length: Math.floor(usable.w / gridStep) + 1 }).map((_, i) => {
                const x = usable.x + i * gridStep
                return (
                  <line
                    key={`gx-${i}`}
                    x1={x}
                    y1={usable.y}
                    x2={x}
                    y2={usable.y + usable.h}
                    stroke="rgba(255, 255, 255, 0.2)"
                    strokeWidth={1}
                  />
                )
              })}
              {Array.from({ length: Math.floor(usable.h / gridStep) + 1 }).map((_, i) => {
                const y = usable.y + i * gridStep
                return (
                  <line
                    key={`gy-${i}`}
                    x1={usable.x}
                    y1={y}
                    x2={usable.x + usable.w}
                    y2={y}
                    stroke="rgba(255, 255, 255, 0.2)"
                    strokeWidth={1}
                  />
                )
              })}
            </g>
          )}

          {/* Waste / Chutes */}
          <g opacity={0.1}>
            {wasteRects.map((r, idx) => (
              <rect
                key={`w-${idx}`}
                x={r.x}
                y={r.y}
                width={r.w}
                height={r.h}
                fill="rgba(255, 255, 255, 0.2)"
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth={1}
              />
            ))}
          </g>

          {/* Placements */}
          {placements.map((p) => {
            const c = colorForPiece(p.pieceId, pieceColorById?.[p.pieceId])
            const isHovered = hover?.placement.id === p.id
            
            // Dynamic font sizing based on piece dimensions
            const labelFontSize = Math.min(Math.max(p.w / 8, 12), p.h / 2.5, 32)
            const dimFontSize = Math.min(labelFontSize * 0.7, 20)
            const showLabel = p.w > 40 && p.h > 25
            const showDims = p.w > 80 && p.h > 50

            return (
              <g key={p.id}>
                <rect
                  x={p.x}
                  y={p.y}
                  width={p.w}
                  height={p.h}
                  fill={c.fill}
                  fillOpacity={isHovered ? 1 : 0.85}
                  stroke={c.stroke}
                  strokeWidth={isHovered ? 5 : 1}
                  rx={2}
                  ry={2}
                  className="transition-all duration-200 cursor-help"
                  onPointerMove={(e) =>
                    setHover({
                      placement: p,
                      clientX: e.clientX,
                      clientY: e.clientY,
                    })
                  }
                  onFocus={(e) => {
                    const rect = (e.target as SVGRectElement).getBoundingClientRect()
                    setHover({
                      placement: p,
                      clientX: rect.left + rect.width / 2,
                      clientY: rect.top,
                    })
                  }}
                  onBlur={() => setHover(null)}
                />
                
                {/* Subtle highlight effect */}
                <rect
                  x={p.x + 1}
                  y={p.y + 1}
                  width={p.w - 2}
                  height={Math.min(p.h / 2, 20)}
                  fill="white"
                  fillOpacity={0.08}
                  style={{ pointerEvents: 'none' }}
                  rx={1}
                />

                {showLabel && (
                  <g style={{ pointerEvents: 'none' }}>
                    <text
                      x={p.x + p.w / 2}
                      y={p.y + (showDims ? p.h / 2 - labelFontSize/4 : p.h / 2)}
                      fontSize={labelFontSize}
                      fontWeight={800}
                      fill="white"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="select-none"
                      style={{ 
                        filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.3))',
                        maxWidth: '90%'
                      }}
                    >
                      {p.label.length * (labelFontSize * 0.6) > p.w * 0.9 
                        ? p.label.substring(0, Math.floor((p.w * 0.8) / (labelFontSize * 0.6))) + '...'
                        : p.label}
                    </text>
                    {showDims && (
                      <text
                        x={p.x + p.w / 2}
                        y={p.y + p.h / 2 + labelFontSize/1.5}
                        fontSize={dimFontSize}
                        fontWeight={600}
                        fill="rgba(255,255,255,0.85)"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="select-none"
                      >
                        {mmToLabel(p.w, unit)} × {mmToLabel(p.h, unit)}
                      </text>
                    )}
                  </g>
                )}
              </g>
            )
          })}
        </svg>

        {hover && (
          <TooltipPortal
            clientX={hover.clientX}
            clientY={hover.clientY}
            placement={hover.placement}
            unit={unit}
          />
        )}
      </div>
    </div>
  )
}
