import type { PropsWithChildren } from 'react'
import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react'

import type { BoardConfig, CutPiece, RotationMode, StockPiece } from '../lib/packing'
import { readLocalStorageJson, tryReadStateFromUrlHash, writeLocalStorageJson } from '../lib/storage'

export type AppState = {
  board: BoardConfig
  globalRotationDefault: boolean
  cuts: CutPiece[]
  stock: StockPiece[]
  activeBoardIndex: number
  gridEnabled: boolean
}

export type AppAction =
  | { type: 'SET_BOARD'; patch: Partial<BoardConfig> }
  | { type: 'SET_GLOBAL_ROTATION_DEFAULT'; value: boolean }
  | { type: 'SET_ACTIVE_BOARD_INDEX'; value: number }
  | { type: 'SET_GRID_ENABLED'; value: boolean }
  | { type: 'ADD_CUT'; cut: CutPiece }
  | { type: 'UPDATE_CUT'; id: string; patch: Partial<Omit<CutPiece, 'id'>> }
  | { type: 'DUPLICATE_CUT'; id: string; newId: string }
  | { type: 'REMOVE_CUT'; id: string }
  | { type: 'ADD_STOCK'; stock: StockPiece }
  | { type: 'UPDATE_STOCK'; id: string; patch: Partial<Omit<StockPiece, 'id'>> }
  | { type: 'REMOVE_STOCK'; id: string }
  | { type: 'IMPORT_STATE'; state: AppState }
  | { type: 'RESET' }

const defaultBoard: BoardConfig = {
  widthMm: 2400,
  heightMm: 1200,
  unit: 'mm',
  kerfMm: 0,
  marginMm: 0,
}

function createId() {
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const bytes = new Uint8Array(8)
    crypto.getRandomValues(bytes)
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  }
  return `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`
}

function clampInt(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min
  return Math.max(min, Math.min(max, Math.round(value)))
}

function normalizeRotationMode(value: unknown): RotationMode {
  if (value === 'inherit' || value === 'allowed' || value === 'forbidden') return value
  return 'inherit'
}

function normalizeColorHex(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const v = value.trim()
  if (!/^#[0-9a-fA-F]{6}$/.test(v)) return undefined
  return v.toUpperCase()
}

function makeDefaultCuts(): CutPiece[] {
  const a = createId()
  const b = createId()
  return [
    {
      id: a,
      label: 'P1',
      widthMm: 600,
      heightMm: 400,
      quantity: 4,
      rotation: 'inherit',
      colorHex: undefined,
    },
    {
      id: b,
      label: 'P2',
      widthMm: 800,
      heightMm: 300,
      quantity: 2,
      rotation: 'inherit',
      colorHex: undefined,
    },
  ]
}

export const defaultAppState: AppState = {
  board: defaultBoard,
  globalRotationDefault: true,
  cuts: makeDefaultCuts(),
  stock: [],
  activeBoardIndex: 0,
  gridEnabled: true,
}

const appStateStorageKey = 'plan-parfait-app-state'

type StoredAppState = {
  v: 1
  state: AppState
}

function normalizeState(state: AppState): AppState {
  const board: BoardConfig = {
    widthMm: clampInt(state.board.widthMm, 1, 1_000_000),
    heightMm: clampInt(state.board.heightMm, 1, 1_000_000),
    unit: state.board.unit === 'cm' ? 'cm' : 'mm',
    kerfMm: clampInt(state.board.kerfMm, 0, 100),
    marginMm: clampInt(state.board.marginMm, 0, 5_000),
  }

  const cuts = state.cuts.map((c) => ({
    id: c.id,
    label: typeof c.label === 'string' ? c.label : '',
    widthMm: clampInt(c.widthMm, 0, 1_000_000),
    heightMm: clampInt(c.heightMm, 0, 1_000_000),
    quantity: clampInt(c.quantity, 0, 100_000),
    rotation: normalizeRotationMode(c.rotation),
    colorHex: normalizeColorHex((c as any).colorHex),
  }))

  const stock = (state.stock || []).map((s) => ({
    id: s.id,
    widthMm: clampInt(s.widthMm, 0, 1_000_000),
    heightMm: clampInt(s.heightMm, 0, 1_000_000),
    quantity: clampInt(s.quantity, 0, 100_000),
  }))

  return {
    ...state,
    board,
    cuts,
    stock,
    globalRotationDefault: Boolean(state.globalRotationDefault),
    activeBoardIndex: clampInt(state.activeBoardIndex, 0, 10_000),
    gridEnabled: Boolean(state.gridEnabled),
  }
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_BOARD': {
      return normalizeState({ ...state, board: { ...state.board, ...action.patch } })
    }
    case 'SET_GLOBAL_ROTATION_DEFAULT': {
      return { ...state, globalRotationDefault: action.value }
    }
    case 'SET_ACTIVE_BOARD_INDEX': {
      return { ...state, activeBoardIndex: Math.max(0, action.value) }
    }
    case 'SET_GRID_ENABLED': {
      return { ...state, gridEnabled: action.value }
    }
    case 'ADD_CUT': {
      return normalizeState({ ...state, cuts: [action.cut, ...state.cuts] })
    }
    case 'UPDATE_CUT': {
      const cuts = state.cuts.map((c) => (c.id === action.id ? { ...c, ...action.patch } : c))
      return normalizeState({ ...state, cuts })
    }
    case 'DUPLICATE_CUT': {
      const original = state.cuts.find((c) => c.id === action.id)
      if (!original) return state
      const copy: CutPiece = { ...original, id: action.newId }
      const cuts = [copy, ...state.cuts]
      return normalizeState({ ...state, cuts })
    }
    case 'REMOVE_CUT': {
      const cuts = state.cuts.filter((c) => c.id !== action.id)
      return { ...state, cuts }
    }
    case 'ADD_STOCK': {
      return normalizeState({ ...state, stock: [...state.stock, action.stock] })
    }
    case 'UPDATE_STOCK': {
      const stock = state.stock.map((s) => (s.id === action.id ? { ...s, ...action.patch } : s))
      return normalizeState({ ...state, stock })
    }
    case 'REMOVE_STOCK': {
      const stock = state.stock.filter((s) => s.id !== action.id)
      return { ...state, stock }
    }
    case 'IMPORT_STATE': {
      return normalizeState(action.state)
    }
    case 'RESET': {
      return defaultAppState
    }
    default:
      return state
  }
}

type AppStateContextValue = {
  state: AppState
  dispatch: (action: AppAction) => void
}

const AppStateContext = createContext<AppStateContextValue | null>(null)

export function AppStateProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(
    reducer,
    defaultAppState,
    (initial): AppState => {
      const shared = tryReadStateFromUrlHash()
      if (shared && typeof shared === 'object') return normalizeState(shared as AppState)
      const stored = readLocalStorageJson<StoredAppState>(appStateStorageKey)
      if (stored?.v === 1 && stored.state) return normalizeState(stored.state)
      return initial
    },
  )

  const saveTimerRef = useRef<number | null>(null)
  useEffect(() => {
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current)
    saveTimerRef.current = window.setTimeout(() => {
      writeLocalStorageJson(appStateStorageKey, { v: 1, state } satisfies StoredAppState)
    }, 450)
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
  }, [state])
  const value = useMemo(() => ({ state, dispatch }), [state])
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppState() {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider')
  return ctx.state
}

export function useAppDispatch() {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppDispatch must be used within AppStateProvider')
  return ctx.dispatch
}

export function createEmptyCut(overrides?: Partial<CutPiece>): CutPiece {
  return {
    id: createId(),
    label: '',
    widthMm: 100,
    heightMm: 100,
    quantity: 1,
    rotation: 'inherit',
    colorHex: undefined,
    ...overrides,
  }
}

export function createEmptyStock(overrides?: Partial<StockPiece>): StockPiece {
  return {
    id: createId(),
    widthMm: 100,
    heightMm: 100,
    quantity: 1,
    ...overrides,
  }
}

export function duplicateCutId() {
  return createId()
}
