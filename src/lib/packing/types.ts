export type Unit = 'mm' | 'cm'

export type RotationMode = 'inherit' | 'allowed' | 'forbidden'

export type Rect = {
  x: number
  y: number
  w: number
  h: number
}

export type BoardConfig = {
  widthMm: number
  heightMm: number
  unit: Unit
  kerfMm: number
  marginMm: number
}

export type CutPiece = {
  id: string
  label: string
  widthMm: number
  heightMm: number
  quantity: number
  rotation: RotationMode
}

export type NormalizedPiece = {
  id: string
  label: string
  widthMm: number
  heightMm: number
  canRotate: boolean
  count: number
}

export type Placement = {
  id: string
  pieceId: string
  label: string
  x: number
  y: number
  w: number
  h: number
  rotated: boolean
  boardIndex: number
}

export type BoardPlan = {
  placements: Placement[]
  wasteRects?: Rect[]
  utilization: number
  boardIndex: number
  usableRect: Rect
  usedAreaMm2: number
  wasteAreaMm2: number
}

export type UnplacedReason = 'tooLarge' | 'invalid' | 'limit'

export type UnplacedPiece = {
  pieceId: string
  label: string
  widthMm: number
  heightMm: number
  quantity: number
  reason: UnplacedReason
  message: string
}

export type PackingResult = {
  boards: BoardPlan[]
  unplaced: UnplacedPiece[]
  totalUtilization: number
  totalUsedAreaMm2: number
  totalWasteAreaMm2: number
}

