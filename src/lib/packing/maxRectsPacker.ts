import type { BoardConfig, BoardPlan, NormalizedPiece, PackingResult, Placement, Rect, StockPiece, UnplacedPiece } from './types'

type InternalBoard = {
  boardIndex: number
  boardRect: Rect
  usableRect: Rect
  freeRects: Rect[]
  placements: Placement[]
  usedAreaMm2: number
  isStock?: boolean
}

type PlacementCandidate = {
  x: number
  y: number
  w: number
  h: number
  rotated: boolean
  rectIndex: number
  score1: number
  score2: number
}

function createId() {
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const bytes = new Uint8Array(16)
    crypto.getRandomValues(bytes)
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  }
  return `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`
}

function area(r: Rect) {
  return Math.max(0, r.w) * Math.max(0, r.h)
}

function intersects(a: Rect, b: Rect) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

function contains(outer: Rect, inner: Rect) {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.w <= outer.x + outer.w &&
    inner.y + inner.h <= outer.y + outer.h
  )
}

function clampNonNegative(r: Rect): Rect | null {
  const w = Math.max(0, r.w)
  const h = Math.max(0, r.h)
  if (w === 0 || h === 0) return null
  return { x: r.x, y: r.y, w, h }
}

function expandUsedRect(placed: Rect, container: Rect, kerfMm: number): Rect {
  const remainingRight = container.x + container.w - (placed.x + placed.w)
  const remainingBottom = container.y + container.h - (placed.y + placed.h)
  const extraW = kerfMm > 0 ? Math.min(kerfMm, Math.max(0, remainingRight)) : 0
  const extraH = kerfMm > 0 ? Math.min(kerfMm, Math.max(0, remainingBottom)) : 0
  return { x: placed.x, y: placed.y, w: placed.w + extraW, h: placed.h + extraH }
}

function findBestCandidate(freeRects: Rect[], w: number, h: number, allowRotate: boolean): PlacementCandidate | null {
  let best: PlacementCandidate | null = null

  for (let i = 0; i < freeRects.length; i += 1) {
    const r = freeRects[i]

    const tryFit = (tw: number, th: number, rotated: boolean) => {
      if (tw > r.w || th > r.h) return
      const leftoverW = r.w - tw
      const leftoverH = r.h - th
      const score1 = Math.min(leftoverW, leftoverH)
      const score2 = Math.max(leftoverW, leftoverH)

      const cand: PlacementCandidate = {
        x: r.x,
        y: r.y,
        w: tw,
        h: th,
        rotated,
        rectIndex: i,
        score1,
        score2,
      }

      if (!best) {
        best = cand
        return
      }

      if (cand.score1 < best.score1 || (cand.score1 === best.score1 && cand.score2 < best.score2)) {
        best = cand
      }
    }

    tryFit(w, h, false)
    if (allowRotate && w !== h) tryFit(h, w, true)
  }

  return best
}

function splitFreeRects(freeRects: Rect[], usedRect: Rect): Rect[] {
  const next: Rect[] = []

  for (const r of freeRects) {
    if (!intersects(r, usedRect)) {
      next.push(r)
      continue
    }

    const right = r.x + r.w
    const bottom = r.y + r.h
    const usedRight = usedRect.x + usedRect.w
    const usedBottom = usedRect.y + usedRect.h

    const leftPart = clampNonNegative({ x: r.x, y: r.y, w: usedRect.x - r.x, h: r.h })
    if (leftPart) next.push(leftPart)

    const rightPart = clampNonNegative({ x: usedRight, y: r.y, w: right - usedRight, h: r.h })
    if (rightPart) next.push(rightPart)

    const topPart = clampNonNegative({ x: r.x, y: r.y, w: r.w, h: usedRect.y - r.y })
    if (topPart) next.push(topPart)

    const bottomPart = clampNonNegative({ x: r.x, y: usedBottom, w: r.w, h: bottom - usedBottom })
    if (bottomPart) next.push(bottomPart)
  }

  return pruneContained(next)
}

function pruneContained(rects: Rect[]): Rect[] {
  const filtered = rects
    .map(clampNonNegative)
    .filter((r): r is Rect => Boolean(r))
    .sort((a, b) => area(b) - area(a))

  const kept: Rect[] = []
  for (const r of filtered) {
    let containedByExisting = false
    for (const k of kept) {
      if (contains(k, r)) {
        containedByExisting = true
        break
      }
    }
    if (!containedByExisting) kept.push(r)
  }
  return kept
}

function subtractRect(base: Rect, cut: Rect): Rect[] {
  if (!intersects(base, cut)) return [base]

  const ix1 = Math.max(base.x, cut.x)
  const iy1 = Math.max(base.y, cut.y)
  const ix2 = Math.min(base.x + base.w, cut.x + cut.w)
  const iy2 = Math.min(base.y + base.h, cut.y + cut.h)

  const pieces: Rect[] = [
    { x: base.x, y: base.y, w: ix1 - base.x, h: base.h },
    { x: ix2, y: base.y, w: base.x + base.w - ix2, h: base.h },
    { x: ix1, y: base.y, w: ix2 - ix1, h: iy1 - base.y },
    { x: ix1, y: iy2, w: ix2 - ix1, h: base.y + base.h - iy2 },
  ]

  return pieces.map(clampNonNegative).filter((r): r is Rect => Boolean(r))
}

function normalizeWasteRects(freeRects: Rect[], limit: number): Rect[] {
  const sorted = freeRects
    .map(clampNonNegative)
    .filter((r): r is Rect => Boolean(r))
    .sort((a, b) => area(b) - area(a))

  const result: Rect[] = []
  for (const r of sorted) {
    let parts: Rect[] = [r]
    for (const placed of result) {
      parts = parts.flatMap((p) => subtractRect(p, placed))
      if (parts.length === 0) break
    }

    for (const p of parts) {
      result.push(p)
      if (result.length >= limit) return result
    }
  }

  return result
}

function computeUtilization(usedAreaMm2: number, boardAreaMm2: number) {
  if (boardAreaMm2 <= 0) return 0
  return Math.max(0, Math.min(100, (usedAreaMm2 / boardAreaMm2) * 100))
}

export function packMaxRects(args: {
  board: BoardConfig
  stock: StockPiece[]
  pieces: NormalizedPiece[]
  globalRotationAllowed: boolean
  maxPlacements?: number
  maxWasteRectsPerBoard?: number
}): PackingResult {
  const { board, stock, pieces, globalRotationAllowed, maxPlacements = 5000, maxWasteRectsPerBoard = 250 } = args

  if (board.widthMm <= 0 || board.heightMm <= 0) {
    // ... error handling
    const unplaced: UnplacedPiece[] = pieces.map((p) => ({
      pieceId: p.id,
      label: p.label,
      widthMm: p.widthMm,
      heightMm: p.heightMm,
      quantity: p.count,
      reason: 'invalid',
      message: 'Planche invalide (dimensions non positives).',
    }))

    return {
      boards: [],
      unplaced,
      totalUtilization: 0,
      totalUsedAreaMm2: 0,
      totalWasteAreaMm2: 0,
    }
  }

  const defaultMarginMm = Math.max(0, board.marginMm)
  const defaultKerfMm = Math.max(0, board.kerfMm)

  // Validate infinite board
  const infiniteUsableW = Math.max(0, board.widthMm - defaultMarginMm * 2)
  const infiniteUsableH = Math.max(0, board.heightMm - defaultMarginMm * 2)

  if (infiniteUsableW <= 0 || infiniteUsableH <= 0) {
    const unplaced: UnplacedPiece[] = pieces.map((p) => ({
      pieceId: p.id,
      label: p.label,
      widthMm: p.widthMm,
      heightMm: p.heightMm,
      quantity: p.count,
      reason: 'invalid',
      message: 'Zone découpable nulle (marge trop grande).',
    }))

    return {
      boards: [],
      unplaced,
      totalUtilization: 0,
      totalUsedAreaMm2: 0,
      totalWasteAreaMm2: 0,
    }
  }

  // Pre-expand stock into a queue of board dimensions
  const stockQueue: { w: number; h: number }[] = []
  for (const s of stock) {
    if (s.widthMm > 0 && s.heightMm > 0) {
        for (let i = 0; i < s.quantity; i++) {
            stockQueue.push({ w: s.widthMm, h: s.heightMm })
        }
    }
  }

  // Filter valid pieces
  const unplaced: UnplacedPiece[] = []
  const validPieces: NormalizedPiece[] = []

  for (const p of pieces) {
    if (p.count <= 0 || p.widthMm <= 0 || p.heightMm <= 0) {
      unplaced.push({
        pieceId: p.id,
        label: p.label,
        widthMm: p.widthMm,
        heightMm: p.heightMm,
        quantity: Math.max(0, p.count),
        reason: 'invalid',
        message: 'Dimensions ou quantité invalides.',
      })
      continue
    }

    // Check against MAX dimension (either largest stock or default board)
    // We should be careful: if a piece fits in default but not in stock, or vice versa.
    // We can't strictly reject it here unless it fits in NO available board type.
    // For simplicity, we check against the largest POSSIBLE board (default + all stocks).
    let maxW = infiniteUsableW
    let maxH = infiniteUsableH
    for(const s of stock) {
        const sw = Math.max(0, s.widthMm - defaultMarginMm * 2)
        const sh = Math.max(0, s.heightMm - defaultMarginMm * 2)
        if (sw > 0 && sh > 0) {
            maxW = Math.max(maxW, sw)
            maxH = Math.max(maxH, sh)
        }
    }

    const allowRotate = globalRotationAllowed && p.canRotate
    // Weak check: does it fit in the largest theoretical box?
    const fitsSomething =
      (p.widthMm <= maxW && p.heightMm <= maxH) ||
      (allowRotate && p.heightMm <= maxW && p.widthMm <= maxH)

    if (!fitsSomething) {
      unplaced.push({
        pieceId: p.id,
        label: p.label,
        widthMm: p.widthMm,
        heightMm: p.heightMm,
        quantity: p.count,
        reason: 'tooLarge',
        message: 'Plus grande que toutes les planches disponibles.',
      })
      continue
    }

    validPieces.push({ ...p })
  }

  // Limit total pieces
  const totalRequestedPlacements = validPieces.reduce((sum, p) => sum + p.count, 0)
  if (totalRequestedPlacements > maxPlacements) {
    const ratio = maxPlacements / totalRequestedPlacements
    for (const p of validPieces) {
      const keep = Math.max(1, Math.floor(p.count * ratio))
      if (keep < p.count) {
        unplaced.push({
          pieceId: p.id,
          label: p.label,
          widthMm: p.widthMm,
          heightMm: p.heightMm,
          quantity: p.count - keep,
          reason: 'limit',
          message: `Quantité trop élevée pour un calcul fluide (limite: ${maxPlacements} placements).`,
        })
        p.count = keep
      }
    }
  }

  // Sort pieces (heuristic)
  validPieces.sort((a, b) => {
    const areaA = a.widthMm * a.heightMm
    const areaB = b.widthMm * b.heightMm
    if (areaB !== areaA) return areaB - areaA
    const maxA = Math.max(a.widthMm, a.heightMm)
    const maxB = Math.max(b.widthMm, b.heightMm)
    return maxB - maxA
  })

  const boards: InternalBoard[] = []

  const createBoard = (): InternalBoard => {
    const index = boards.length
    
    // Determine dimensions from stock queue or default
    let w = board.widthMm
    let h = board.heightMm
    let isStock = false

    if (stockQueue.length > 0) {
        const next = stockQueue.shift()!
        w = next.w
        h = next.h
        isStock = true
    }

    const boardRect: Rect = { x: 0, y: 0, w, h }
    const usableRect: Rect = {
        x: defaultMarginMm,
        y: defaultMarginMm,
        w: Math.max(0, w - defaultMarginMm * 2),
        h: Math.max(0, h - defaultMarginMm * 2),
    }

    const b: InternalBoard = {
      boardIndex: index,
      boardRect,
      usableRect,
      freeRects: [usableRect],
      placements: [],
      usedAreaMm2: 0,
      isStock,
    }
    boards.push(b)
    return b
  }

  const placeOnBoard = (b: InternalBoard, piece: NormalizedPiece): boolean => {
    const allowRotate = globalRotationAllowed && piece.canRotate
    const cand = findBestCandidate(b.freeRects, piece.widthMm, piece.heightMm, allowRotate)
    if (!cand) return false

    const container = b.freeRects[cand.rectIndex]
    const placedRect: Rect = { x: cand.x, y: cand.y, w: cand.w, h: cand.h }
    const usedRect = expandUsedRect(placedRect, container, defaultKerfMm)

    const placement: Placement = {
      id: createId(),
      pieceId: piece.id,
      label: piece.label,
      x: placedRect.x,
      y: placedRect.y,
      w: placedRect.w,
      h: placedRect.h,
      rotated: cand.rotated,
      boardIndex: b.boardIndex,
    }

    b.placements.push(placement)
    b.usedAreaMm2 += placedRect.w * placedRect.h
    b.freeRects = splitFreeRects(b.freeRects, usedRect)
    return true
  }

  for (const piece of validPieces) {
    for (let i = 0; i < piece.count; i += 1) {
      let placed = false
      // Try existing boards
      for (const b of boards) {
        if (placeOnBoard(b, piece)) {
          placed = true
          break
        }
      }

      // Try creating new boards until placed or we give up (sanity check)
      if (!placed) {
        // We might need to try multiple new boards if using stock queue
        // e.g. piece doesn't fit in Stock A (small), but fits in Stock B (large)
        // This is tricky: if we burn Stock A for a piece that doesn't fit, do we discard Stock A?
        // NO. The current "createBoard" consumes the stock.
        
        // Correct greedy approach with stock:
        // We iterate creating boards from stock. If the piece doesn't fit in the current new board,
        // we KEEP that board open for smaller pieces, but we need to create ANOTHER board for this big piece.
        // This suggests we might need to look ahead in stockQueue or open multiple boards.
        
        // SIMPLE APPROACH:
        // Just create boards one by one. If it fits, great. If not, try next.
        // Issue: If we create Board 1 (Small Stock), piece doesn't fit. Board 1 is now "active" but empty/useless for this piece.
        // Then we create Board 2 (Large Stock). Piece fits.
        // Board 1 sits there empty?
        
        // REFINED LOGIC:
        // When `!placed`, we enter a loop:
        //   Create `b = createBoard()`.
        //   Try place.
        //   If success -> break loop.
        //   If fail -> `b` remains in `boards` (maybe empty), loop continues to create next board.
        //   CAUTION: This could exhaust all stock for 1 giant piece that only fits in default board.
        //   We should probably cleanup empty boards if we skip them? 
        //   Actually, MaxRects usually fills 'Best Fit'.
        
        // Let's stick to the standard greedy "First Fit" on boards strategy for now.
        // This means we might open multiple stock boards to find one that fits.
        // Later pieces can backfill the skipped boards.
        
        let attempts = 0
        const maxAttempts = stockQueue.length + 1 // +1 for default infinite
        
        while(!placed && attempts < maxAttempts) {
             const b = createBoard()
             if (placeOnBoard(b, piece)) {
                 placed = true
             } else {
                 // Piece didn't fit in this new board.
                 // This board is now part of 'boards' list and can be used by subsequent smaller pieces.
                 // We proceed to create the next board in queue.
                 // If we ran out of stock queue, the next createBoard() will return default board, which should fit (unless piece is huge).
                 
                 // If we are at default board and it still doesn't fit, it's truly unplaceable (checked at start).
                 if (!b.isStock) {
                     // reached default board and failed. Stop.
                     break
                 }
             }
             attempts++
        }
      }

      if (!placed) {
        unplaced.push({
          pieceId: piece.id,
          label: piece.label,
          widthMm: piece.widthMm,
          heightMm: piece.heightMm,
          quantity: piece.count - i,
          reason: 'tooLarge',
          message: 'Impossible à placer (trop grand pour les planches restantes).',
        })
        break
      }
    }
  }

  // Remove completely empty boards?
  // If we opened a Stock board but put nothing in it because nothing fit, it shouldn't be in the result.
  // Unless the user explicitly wants to see "I tried this board but it failed".
  // Better to filter empty ones to keep result clean.
  const nonEmptyBoards = boards.filter(b => b.placements.length > 0)

  // Re-index boards after filtering
  nonEmptyBoards.forEach((b, idx) => b.boardIndex = idx)
  // Also need to update placement.boardIndex? Yes.
  // Actually `placeOnBoard` sets `boardIndex`. If we filter, indices shift.
  // We need to fix placement indices.
  for(let i=0; i<nonEmptyBoards.length; i++) {
      const b = nonEmptyBoards[i]
      b.boardIndex = i
      for(const p of b.placements) {
          p.boardIndex = i
      }
  }

  const resultBoards: BoardPlan[] = nonEmptyBoards.map((b) => {
    const wasteRects = normalizeWasteRects(b.freeRects, maxWasteRectsPerBoard)
    const usedAreaMm2 = b.usedAreaMm2
    const boardAreaMm2 = area(b.boardRect)
    const wasteAreaMm2 = Math.max(0, boardAreaMm2 - usedAreaMm2)

    return {
      boardIndex: b.boardIndex,
      placements: b.placements,
      wasteRects,
      utilization: computeUtilization(usedAreaMm2, boardAreaMm2),
      usableRect: b.usableRect,
      usedAreaMm2,
      wasteAreaMm2,
      widthMm: b.boardRect.w,
      heightMm: b.boardRect.h,
    }
  })

  const totalUsedAreaMm2 = resultBoards.reduce((sum, b) => sum + b.usedAreaMm2, 0)
  const totalWasteAreaMm2 = resultBoards.reduce((sum, b) => sum + b.wasteAreaMm2, 0)
  const totalBoardAreaMm2 = resultBoards.reduce((sum, b) => sum + area({x:0,y:0,w:b.widthMm,h:b.heightMm}), 0)
  const totalUtilization = computeUtilization(totalUsedAreaMm2, totalBoardAreaMm2)

  return {
    boards: resultBoards,
    unplaced,
    totalUtilization,
    totalUsedAreaMm2,
    totalWasteAreaMm2,
  }
}
