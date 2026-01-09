import { useEffect, useMemo } from 'react'

import { BoardInput } from './components/BoardInput'
import { BoardsNavigator } from './components/BoardsNavigator'
import { CutsList } from './components/CutsList'
import { ImportExport } from './components/ImportExport'
import { Summary } from './components/Summary'
import { ThemeToggle } from './components/ThemeToggle'
import { useAppDispatch, useAppState } from './hooks/useAppState'
import { useDebouncedPacking } from './hooks/useDebouncedPacking'
import { formatLength } from './lib/units'

export default function App() {
  const state = useAppState()
  const dispatch = useAppDispatch()

  const { result, isPending } = useDebouncedPacking({
    board: state.board,
    cuts: state.cuts,
    globalRotationDefault: state.globalRotationDefault,
    debounceMs: 200,
  })

  useEffect(() => {
    const max = Math.max(0, result.boards.length - 1)
    if (state.activeBoardIndex > max) {
      dispatch({ type: 'SET_ACTIVE_BOARD_INDEX', value: max })
    }
  }, [dispatch, result.boards.length, state.activeBoardIndex])

  const activePlan = result.boards[state.activeBoardIndex] ?? null

  const placementsForActive = useMemo(() => {
    const placements = activePlan?.placements ?? []
    return [...placements].sort((a, b) => (a.y !== b.y ? a.y - b.y : a.x - b.x))
  }, [activePlan?.placements])

  return (
    <div className="min-h-full bg-app">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
        <header className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-medium text-muted">Plan Parfait</div>
            <h1 className="truncate text-2xl font-semibold tracking-tight md:text-3xl">
              Optimisation de découpes
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>

        <Summary result={result} unit={state.board.unit} activeBoardIndex={state.activeBoardIndex} />

        <div className="rounded-2xl border bg-surface/70 p-4 shadow-soft backdrop-blur-xl md:p-5">
          <ImportExport />
        </div>

        <main className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
          <section className="space-y-6">
            <div className="rounded-2xl border bg-surface/70 p-4 shadow-soft backdrop-blur-xl md:p-5">
              <BoardInput />
            </div>
            <div className="rounded-2xl border bg-surface/70 p-4 shadow-soft backdrop-blur-xl md:p-5">
              <CutsList />
            </div>
          </section>

          <section className="rounded-2xl border bg-surface/70 p-4 shadow-soft backdrop-blur-xl md:p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-muted">Résultats</div>
                <div className="mt-1 text-lg font-semibold">Prévisualisation</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="rounded-xl border bg-bg/60 px-3 py-2 text-xs font-semibold text-muted">
                  {isPending ? 'Optimisation…' : 'À jour'}
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
              <div className="min-h-[520px]">
                <BoardsNavigator
                  board={state.board}
                  unit={state.board.unit}
                  gridEnabled={state.gridEnabled}
                  plans={result.boards}
                  activeIndex={state.activeBoardIndex}
                  onChangeActiveIndex={(index) => dispatch({ type: 'SET_ACTIVE_BOARD_INDEX', value: index })}
                />
                {result.boards.length === 0 ? (
                  <div className="mt-4 rounded-xl border bg-bg/60 p-4 text-sm text-muted">
                    Ajuste la planche et les découpes pour obtenir un placement.
                  </div>
                ) : null}
              </div>

              <aside className="rounded-2xl border bg-bg/40 p-4 shadow-soft">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">Placements</div>
                    <div className="mt-1 text-xs text-muted">
                      Planche {state.activeBoardIndex + 1} · {activePlan ? Math.round(activePlan.utilization) : 0}%
                    </div>
                  </div>
                </div>

                <div className="mt-4 max-h-[560px] space-y-2 overflow-auto pr-1">
                  {placementsForActive.length === 0 ? (
                    <div className="rounded-xl border bg-bg/60 p-3 text-sm text-muted">Aucun placement.</div>
                  ) : (
                    placementsForActive.map((p) => (
                      <div key={p.id} className="rounded-xl border bg-bg/60 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0 font-semibold">{p.label}</div>
                          <div className="shrink-0 text-xs text-muted">{p.rotated ? 'rot.' : 'std.'}</div>
                        </div>
                        <div className="mt-1 text-xs text-muted">
                          {formatLength(p.w, state.board.unit)} × {formatLength(p.h, state.board.unit)} {state.board.unit}
                        </div>
                        <div className="mt-1 text-xs text-muted">
                          x {formatLength(p.x, state.board.unit)} · y {formatLength(p.y, state.board.unit)} {state.board.unit}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </aside>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
