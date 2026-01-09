import { Download } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import clsx from 'clsx'

import type { BoardConfig, BoardPlan, Placement, Rect, Unit } from '../lib/packing'
import { formatLength } from '../lib/units'

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function hashHue(input: string) {
  let h = 0
  for (let i = 0; i < input.length; i += 1) h = (h * 31 + input.charCodeAt(i)) >>> 0
  return h % 360
}

function colorForPiece(pieceId: string) {
  const hue = hashHue(pieceId)
  return {
    fill: `hsl(${hue} 82% 60%)`,
    stroke: `hsl(${hue} 82% 48%)`,
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

  const rootStyle = getComputedStyle(document.documentElement)
  for (const key of ['--bg', '--surface', '--text', '--muted', '--border', '--accent', '--accent2'] as const) {
    const value = rootStyle.getPropertyValue(key).trim()
    if (value) clone.style.setProperty(key, value)
  }

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

  const bg = rootStyle.getPropertyValue('--bg').trim()
  const bgColor = bg ? `hsl(${bg})` : '#ffffff'
  ctx.fillStyle = bgColor
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
}: {
  board: BoardConfig
  plan: BoardPlan | null
  unit: Unit
  gridEnabled: boolean
}) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [hover, setHover] = useState<{
    placement: Placement
    clientX: number
    clientY: number
  } | null>(null)

  const boardW = Math.max(1, board.widthMm)
  const boardH = Math.max(1, board.heightMm)
  const usable = plan?.usableRect ?? {
    x: board.marginMm,
    y: board.marginMm,
    w: Math.max(0, board.widthMm - board.marginMm * 2),
    h: Math.max(0, board.heightMm - board.marginMm * 2),
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
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium text-muted">Planche</div>
          <div className="mt-1 truncate text-sm font-semibold">
            {mmToLabel(boardW, unit)} × {mmToLabel(boardH, unit)}
          </div>
        </div>
        <button
          type="button"
          className="inline-flex h-10 items-center gap-2 rounded-xl border bg-surface px-3 text-sm font-semibold shadow-soft transition duration-300 ease-out hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          onClick={() => {
            if (!svgRef.current) return
            exportSvgToPng(svgRef.current, `planche-${(plan?.boardIndex ?? 0) + 1}.png`)
          }}
        >
          <Download className="h-4 w-4" />
          Télécharger
        </button>
      </div>

      <div className="relative min-h-[420px] flex-1 overflow-hidden rounded-2xl border bg-bg/40 shadow-soft">
        <svg
          ref={svgRef}
          className="h-full w-full"
          viewBox={`0 0 ${boardW} ${boardH}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Prévisualisation de la planche"
          onPointerLeave={() => setHover(null)}
        >
          <rect x={0} y={0} width={boardW} height={boardH} fill="transparent" />

          <rect
            x={0}
            y={0}
            width={boardW}
            height={boardH}
            fill="transparent"
            stroke="hsl(var(--border))"
            strokeWidth={2}
            rx={24}
            ry={24}
          />

          <rect
            x={usable.x}
            y={usable.y}
            width={usable.w}
            height={usable.h}
            fill="transparent"
            stroke="hsl(var(--accent) / 0.55)"
            strokeDasharray="10 10"
            strokeWidth={2}
            rx={16}
            ry={16}
          />

          {gridEnabled ? (
            <g opacity={0.5}>
              {Array.from({ length: Math.floor(usable.w / gridStep) + 1 }).map((_, i) => {
                const x = usable.x + i * gridStep
                return (
                  <line
                    key={`gx-${i}`}
                    x1={x}
                    y1={usable.y}
                    x2={x}
                    y2={usable.y + usable.h}
                    stroke="hsl(var(--border) / 0.7)"
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
                    stroke="hsl(var(--border) / 0.7)"
                    strokeWidth={1}
                  />
                )
              })}
            </g>
          ) : null}

          <g opacity={0.3}>
            {wasteRects.map((r, idx) => (
              <rect
                key={`w-${idx}`}
                x={r.x}
                y={r.y}
                width={r.w}
                height={r.h}
                fill="hsl(var(--muted) / 0.35)"
                stroke="hsl(var(--border) / 0.55)"
                strokeWidth={1}
                rx={10}
                ry={10}
              />
            ))}
          </g>

          {placements.map((p) => {
            const c = colorForPiece(p.pieceId)
            const showText = p.w >= 140 && p.h >= 70
            const isHovered = hover?.placement.id === p.id

            return (
              <g key={p.id}>
                <rect
                  x={p.x}
                  y={p.y}
                  width={p.w}
                  height={p.h}
                  fill={c.fill}
                  fillOpacity={0.82}
                  stroke={c.stroke}
                  strokeWidth={isHovered ? 5 : 2}
                  rx={14}
                  ry={14}
                  tabIndex={0}
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
                {showText ? (
                  <>
                    <text
                      x={p.x + 12}
                      y={p.y + 26}
                      fontSize={26}
                      fontWeight={700}
                      fill="hsl(0 0% 100% / 0.92)"
                      style={{ pointerEvents: 'none' }}
                    >
                      {p.label}
                    </text>
                    <text
                      x={p.x + 12}
                      y={p.y + 54}
                      fontSize={22}
                      fontWeight={600}
                      fill="hsl(0 0% 100% / 0.86)"
                      style={{ pointerEvents: 'none' }}
                    >
                      {mmToLabel(p.w, unit)} × {mmToLabel(p.h, unit)}
                    </text>
                  </>
                ) : null}
              </g>
            )
          })}
        </svg>

        {hover ? (
          <div
            className={clsx(
              'pointer-events-none absolute z-10 rounded-xl border bg-surface/90 px-3 py-2 text-xs shadow-lift backdrop-blur-xl',
            )}
            style={{
              left: clamp(
                hover.clientX - 140,
                10,
                (typeof window !== 'undefined' ? window.innerWidth : 1200) - 290,
              ),
              top: clamp(
                hover.clientY - 80,
                10,
                (typeof window !== 'undefined' ? window.innerHeight : 800) - 90,
              ),
              width: 280,
            }}
            role="tooltip"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 font-semibold text-text">{hover.placement.label}</div>
              <div className="shrink-0 text-muted">{hover.placement.rotated ? 'rot.' : 'std.'}</div>
            </div>
            <div className="mt-1 text-muted">
              {mmToLabel(hover.placement.w, unit)} × {mmToLabel(hover.placement.h, unit)}
            </div>
            <div className="mt-1 text-muted">
              x {mmToLabel(hover.placement.x, unit)} · y {mmToLabel(hover.placement.y, unit)}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

