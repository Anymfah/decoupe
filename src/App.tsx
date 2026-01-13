import { useEffect, useMemo, useState } from 'react'
import { clsx } from 'clsx'
import { LayoutGrid, Layers, Play, Info, Github, Plus, Box, Scissors, Eye, FileDown } from 'lucide-react'

import logoDark from './assets/logo-dark.png'
import logoLight from './assets/logo-light.png'
import { BoardInput } from './components/BoardInput'
import { BoardsNavigator } from './components/BoardsNavigator'
import { CutsList } from './components/CutsList'
import { ImportExport } from './components/ImportExport'
import { SupportModal } from './components/SupportModal'
import { StatusPanel, Summary } from './components/Summary'
import { ThemeToggle } from './components/ThemeToggle'
import { createEmptyCut, useAppDispatch, useAppState } from './hooks/useAppState'
import { useDebouncedPacking } from './hooks/useDebouncedPacking'
import { useTheme } from './hooks/useTheme'
import { formatLength } from './lib/units'
import { GlassCard, Button, Tooltip } from './components/ui'

type MobileTab = 'board' | 'cuts' | 'preview' | 'export'

export default function App() {
  const state = useAppState()
  const dispatch = useAppDispatch()
  const { theme } = useTheme()
  const [placementsOpen, setPlacementsOpen] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)
  const [mobileTab, setMobileTab] = useState<MobileTab>('cuts')

  const logo = theme === 'dark' ? logoDark : logoLight

  const { result, isPending } = useDebouncedPacking({
    board: state.board,
    cuts: state.cuts,
    stock: state.stock,
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

  const pieceColorById = useMemo(() => {
    const entries = state.cuts.map((c) => [c.id, c.colorHex] as const)
    return Object.fromEntries(entries) as Record<string, string | undefined>
  }, [state.cuts])

  const totalPieces = useMemo(() => {
    return state.cuts.reduce((sum, c) => sum + Math.max(0, c.quantity), 0)
  }, [state.cuts])

  // Quick add cut handler
  const handleQuickAddCut = () => {
    const nextCut = createEmptyCut({ label: `P${state.cuts.length + 1}` })
    dispatch({ type: 'ADD_CUT', cut: nextCut })
    setMobileTab('cuts')
  }

  // Mobile tab navigation items
  const tabs = [
    { id: 'board' as const, label: 'Planche', icon: Box },
    { id: 'cuts' as const, label: 'Découpes', icon: Scissors, badge: totalPieces > 0 ? totalPieces : undefined },
    { id: 'preview' as const, label: 'Aperçu', icon: Eye, badge: result.boards.length > 0 ? result.boards.length : undefined },
    { id: 'export' as const, label: 'Projet', icon: FileDown },
  ]

  // Mobile content based on active tab
  const renderMobileTabContent = () => {
    switch (mobileTab) {
      case 'board':
        return (
          <div className="animate-fade-in">
            <GlassCard className="p-4 border-black/[0.03] dark:border-white/[0.03]">
              <BoardInput />
            </GlassCard>
          </div>
        )
      
      case 'cuts':
        return (
          <div className="animate-fade-in">
            <GlassCard className="p-4 border-black/[0.03] dark:border-white/[0.03]">
              <CutsList />
            </GlassCard>
          </div>
        )
      
      case 'preview':
        return (
          <div className="space-y-4 animate-fade-in">
            <GlassCard className="p-4 min-h-[60vh] flex flex-col border-black/[0.03] dark:border-white/[0.03] bg-app-premium dark:bg-[#070A10]">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <div className="text-[10px] font-bold text-accent uppercase tracking-[0.2em] mb-0.5">Visualisation</div>
                  <h2 className="text-lg font-bold tracking-tight">Plan de découpe</h2>
                </div>
                
                <div className="flex items-center gap-1 p-0.5 bg-black/5 dark:bg-white/5 rounded-apple-lg border border-black/[0.05] dark:border-white/[0.05]">
                  <Button 
                    variant={!placementsOpen ? 'primary' : 'ghost'} 
                    size="sm"
                    className="h-7 text-[10px] px-2"
                    onClick={() => setPlacementsOpen(false)}
                  >
                    <LayoutGrid className="w-3 h-3 mr-1" />
                    Vue
                  </Button>
                  <Button 
                    variant={placementsOpen ? 'primary' : 'ghost'} 
                    size="sm"
                    className="h-7 text-[10px] px-2"
                    onClick={() => setPlacementsOpen(true)}
                  >
                    <Layers className="w-3 h-3 mr-1" />
                    Liste
                  </Button>
                </div>
              </div>

              {result.boards.length === 0 && !isPending ? (
                <div className="flex-1 bg-black/5 dark:bg-black/40 rounded-apple-lg border border-black/5 dark:border-white/5 overflow-hidden flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3 border border-white/10">
                    <Play className="w-5 h-5 text-accent opacity-40" />
                  </div>
                  <h3 className="text-sm font-bold mb-1">Prêt à optimiser ?</h3>
                  <p className="text-xs text-muted font-medium max-w-[200px] leading-relaxed">
                    Configurez votre planche et ajoutez des découpes.
                  </p>
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => setMobileTab('cuts')}
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Ajouter des pièces
                  </Button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col min-h-0">
                  {!placementsOpen ? (
                    <BoardsNavigator
                      board={state.board}
                      unit={state.board.unit}
                      gridEnabled={state.gridEnabled}
                      pieceColorById={pieceColorById}
                      plans={result.boards}
                      activeIndex={state.activeBoardIndex}
                      onChangeActiveIndex={(index) => dispatch({ type: 'SET_ACTIVE_BOARD_INDEX', value: index })}
                    />
                  ) : (
                    <div className="flex flex-col h-full animate-scale-in">
                      <div className="flex items-center justify-between mb-3 px-1">
                        <div className="text-[11px] font-bold uppercase tracking-widest text-muted">Pièces placées</div>
                        <div className="text-[9px] font-bold bg-accent/10 text-accent px-2 py-0.5 rounded-full uppercase tracking-widest">
                          Planche {state.activeBoardIndex + 1}
                        </div>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                        {placementsForActive.length === 0 ? (
                          <div className="p-6 text-center rounded-apple-lg bg-black/[0.02] dark:bg-white/[0.02] border border-dashed border-black/10 dark:border-white/10 text-muted text-xs font-medium">
                            Aucun placement sur cette planche.
                          </div>
                        ) : (
                          placementsForActive.map((p) => (
                            <div 
                              key={p.id} 
                              className="p-3 rounded-apple-md bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.03] dark:border-white/[0.03]"
                            >
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <div className="font-bold text-sm truncate">{p.label}</div>
                                <div className={clsx(
                                  "shrink-0 text-[8px] font-bold px-1.5 py-0.5 rounded-apple-sm uppercase tracking-widest",
                                  p.rotated ? "bg-warning/10 text-warning" : "bg-success/10 text-success"
                                )}>
                                  {p.rotated ? 'Rot.' : 'Std'}
                                </div>
                              </div>
                              <div className="flex items-center justify-between text-[10px] font-bold text-muted/60 uppercase tracking-widest">
                                <span>{formatLength(p.w, state.board.unit)} × {formatLength(p.h, state.board.unit)}</span>
                                <span className="font-mono opacity-60">({formatLength(p.x, state.board.unit)}, {formatLength(p.y, state.board.unit)})</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </GlassCard>

            <StatusPanel result={result} />
          </div>
        )
      
      case 'export':
        return (
          <div className="space-y-4 animate-fade-in">
            <GlassCard className="p-4 border-black/[0.03] dark:border-white/[0.03]">
              <div className="text-[10px] font-bold text-accent uppercase tracking-[0.2em] mb-3">Gestion de projet</div>
              <ImportExport />
            </GlassCard>
            
            <StatusPanel result={result} />
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="min-h-full bg-app-premium bg-noise text-text selection:bg-accent/30 transition-colors duration-300">
      <div className={clsx(
        "mx-auto flex w-full max-w-7xl flex-col gap-4 px-3 py-4 animate-fade-in",
        "md:gap-6 md:px-6 md:py-8",
        "pb-20 md:pb-4" // Extra padding for mobile bottom nav
      )}>
        {/* Header - Condensed for mobile */}
        <header className="flex items-center justify-between gap-2 mb-1 md:mb-2">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="relative group">
              <div className="absolute -inset-2 bg-accent/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <img 
                src={logo} 
                alt="ezcut.be" 
                className="h-8 md:h-[80px] w-auto relative transition-all" 
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            {/* Engine status */}
            <div className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.05] rounded-full">
              <div className={clsx("w-1.5 h-1.5 rounded-full shadow-sm", isPending ? "bg-warning animate-pulse" : "bg-success")} />
              <span className="text-[9px] md:text-[10px] font-bold text-muted uppercase tracking-[0.1em] md:tracking-[0.15em]">
                {isPending ? 'Calc...' : 'Prêt'}
              </span>
            </div>
            
            <ThemeToggle />
          </div>
        </header>

        {/* Mobile Summary - Compact horizontal scroll */}
        <div className="md:hidden flex items-stretch gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
          <div className="flex-1 min-w-[70px] p-2.5 bg-black/[0.03] dark:bg-white/[0.03] rounded-apple-lg border border-black/[0.05] dark:border-white/[0.05]">
            <div className="text-lg font-bold text-accent leading-none">{result.boards.length}</div>
            <div className="text-[9px] font-bold text-muted uppercase tracking-wider mt-0.5">Planches</div>
          </div>
          <div className="flex-1 min-w-[70px] p-2.5 bg-black/[0.03] dark:bg-white/[0.03] rounded-apple-lg border border-black/[0.05] dark:border-white/[0.05]">
            <div className={clsx(
              "text-lg font-bold leading-none",
              result.totalUtilization > 80 ? "text-success" : result.totalUtilization > 50 ? "text-accent" : "text-warning"
            )}>
              {Math.round(result.totalUtilization)}%
            </div>
            <div className="text-[9px] font-bold text-muted uppercase tracking-wider mt-0.5">Efficacité</div>
          </div>
          <div className="flex-1 min-w-[70px] p-2.5 bg-black/[0.03] dark:bg-white/[0.03] rounded-apple-lg border border-black/[0.05] dark:border-white/[0.05]">
            <div className="text-lg font-bold text-text leading-none">{totalPieces}</div>
            <div className="text-[9px] font-bold text-muted uppercase tracking-wider mt-0.5">Pièces</div>
          </div>
          {result.unplaced.length > 0 && (
            <div className="flex-1 min-w-[70px] p-2.5 bg-danger/5 rounded-apple-lg border border-danger/10">
              <div className="text-lg font-bold text-danger leading-none">{result.unplaced.length}</div>
              <div className="text-[9px] font-bold text-danger/70 uppercase tracking-wider mt-0.5">Erreur</div>
            </div>
          )}
        </div>

        {/* Mobile tab content */}
        <div className="md:hidden">
          {renderMobileTabContent()}
        </div>

        {/* Desktop layout */}
        <div className="hidden md:block">
          <Summary result={result} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr] mt-6">
            <aside className="space-y-6">
              <GlassCard className="p-5 border-black/[0.03] dark:border-white/[0.03]">
                <BoardInput />
              </GlassCard>
              
              <GlassCard className="p-5 border-black/[0.03] dark:border-white/[0.03]">
                <CutsList />
              </GlassCard>

              <GlassCard className="p-4 bg-accent/[0.02] border-accent/10">
                <ImportExport />
              </GlassCard>
            </aside>

            <main className="space-y-6 relative">
              <GlassCard className="p-5 lg:sticky lg:top-6 lg:self-start min-h-[600px] flex flex-col z-30 border-black/[0.03] dark:border-white/[0.03] bg-app-premium dark:bg-[#070A10]">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <div className="text-[10px] font-bold text-accent uppercase tracking-[0.2em] mb-1">Visualisation</div>
                    <h2 className="text-xl font-bold tracking-tight">Plan de découpe</h2>
                  </div>
                  
                  <div className="flex items-center gap-1 p-0.5 bg-black/5 dark:bg-white/5 rounded-apple-lg border border-black/[0.05] dark:border-white/[0.05]">
                    <Button 
                      variant={!placementsOpen ? 'primary' : 'ghost'} 
                      size="sm"
                      className="h-8 text-[11px]"
                      onClick={() => setPlacementsOpen(false)}
                    >
                      <LayoutGrid className="w-3.5 h-3.5 mr-1.5" />
                      Aperçu
                    </Button>
                    <Button 
                      variant={placementsOpen ? 'primary' : 'ghost'} 
                      size="sm"
                      className="h-8 text-[11px]"
                      onClick={() => setPlacementsOpen(true)}
                    >
                      <Layers className="w-3.5 h-3.5 mr-1.5" />
                      Placements
                    </Button>
                  </div>
                </div>

                <div className={clsx(
                  'flex-1 flex flex-col gap-6 min-h-0',
                  placementsOpen ? 'xl:grid xl:grid-cols-[1fr_320px]' : 'flex flex-col'
                )}>
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="mb-4">
                      <BoardsNavigator
                        board={state.board}
                        unit={state.board.unit}
                        gridEnabled={state.gridEnabled}
                        pieceColorById={pieceColorById}
                        plans={result.boards}
                        activeIndex={state.activeBoardIndex}
                        onChangeActiveIndex={(index) => dispatch({ type: 'SET_ACTIVE_BOARD_INDEX', value: index })}
                      />
                    </div>
                    
                    {result.boards.length === 0 && !isPending && (
                      <div className="relative bg-black/5 dark:bg-black/40 rounded-apple-lg border border-black/5 dark:border-white/5 overflow-hidden h-[500px] flex flex-col items-center justify-center p-8 text-center backdrop-blur-[1px]">
                        <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10 shadow-sm">
                          <Play className="w-6 h-6 text-accent opacity-40" />
                        </div>
                        <h3 className="text-base font-bold mb-1.5">Prêt à optimiser ?</h3>
                        <p className="text-xs text-muted font-medium max-w-[240px] leading-relaxed">
                          Ajoutez des dimensions de planche et des pièces à découper pour voir le résultat ici.
                        </p>
                      </div>
                    )}
                  </div>

                  {placementsOpen && (
                    <div className="flex flex-col h-full max-h-[600px] animate-scale-in">
                      <div className="flex items-center justify-between mb-4 px-1">
                        <div className="text-[11px] font-bold uppercase tracking-widest text-muted">Liste des pièces</div>
                        <div className="text-[9px] font-bold bg-accent/10 text-accent px-2 py-0.5 rounded-full uppercase tracking-widest">
                          Planche {state.activeBoardIndex + 1}
                        </div>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                        {placementsForActive.length === 0 ? (
                          <div className="p-8 text-center rounded-apple-lg bg-black/[0.02] dark:bg-white/[0.02] border border-dashed border-black/10 dark:border-white/10 text-muted text-xs font-medium">
                            Aucun placement sur cette planche.
                          </div>
                        ) : (
                          placementsForActive.map((p) => (
                            <div 
                              key={p.id} 
                              className="group p-3 rounded-apple-md bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.03] dark:border-white/[0.03] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] hover:border-accent/20 transition-all duration-300"
                            >
                              <div className="flex items-center justify-between gap-3 mb-1.5">
                                <div className="font-bold text-[13px] truncate tracking-tight">{p.label}</div>
                                <Tooltip 
                                  content={p.rotated ? "Cette pièce a été pivotée de 90°." : "Cette pièce est dans son orientation d'origine."}
                                  wrapperClassName="shrink-0"
                                >
                                  <div className={clsx(
                                    "shrink-0 text-[8px] font-bold px-1.5 py-0.5 rounded-apple-sm uppercase tracking-widest cursor-help",
                                    p.rotated ? "bg-warning/10 text-warning" : "bg-success/10 text-success"
                                  )}>
                                    {p.rotated ? 'Rotation' : 'Standard'}
                                  </div>
                                </Tooltip>
                              </div>
                              <div className="flex items-center justify-between text-[10px] font-bold text-muted/60 group-hover:text-muted transition-colors uppercase tracking-widest">
                                <span>{formatLength(p.w, state.board.unit)} × {formatLength(p.h, state.board.unit)}</span>
                                <span className="font-mono opacity-40">X:{formatLength(p.x, state.board.unit)} Y:{formatLength(p.y, state.board.unit)}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </GlassCard>
            </main>
          </div>

          <StatusPanel result={result} />
        </div>

        {/* Footer - only on desktop */}
        <footer className="hidden md:flex mt-8 pt-6 border-t border-black/[0.05] dark:border-white/[0.05] flex-col md:flex-row items-center justify-between gap-4 text-muted">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">
              <span>ezcut.be</span>
              <span className="w-1 h-1 rounded-full bg-current" />
              <span>v2.1 Premium</span>
            </div>
            <a 
              href="https://github.com/Anymfah" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 bg-black/5 dark:bg-white/5 rounded-full hover:text-accent transition-colors shadow-sm border border-black/5 dark:border-white/5"
              title="GitHub Profile"
            >
              <Github className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setSupportOpen(true)}
              className="text-[10px] uppercase tracking-widest font-bold hover:text-accent transition-colors flex items-center gap-1.5"
            >
              <Info className="w-3.5 h-3.5" />
              Support
            </button>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold">
              <span className="opacity-30">© 2026</span>
              <a 
                href="https://www.linkedin.com/in/ss-jamii/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-accent transition-colors"
              >
                Soheil Saheb-Jamii
              </a>
            </div>
          </div>
        </footer>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#070A10]/95 backdrop-blur-xl border-t border-white/[0.06] safe-area-bottom">
        <div className="flex items-stretch justify-around h-16 px-2">
          {tabs.map((tab) => {
            const isActive = mobileTab === tab.id
            const Icon = tab.icon
            
            return (
              <button
                key={tab.id}
                onClick={() => setMobileTab(tab.id)}
                className={clsx(
                  "flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-all duration-300 touch-manipulation",
                  isActive ? "text-accent" : "text-muted/60 active:text-muted"
                )}
              >
                {isActive && (
                  <div className="absolute -top-px left-1/2 -translate-x-1/2 w-12 h-0.5 bg-accent rounded-full" />
                )}
                
                <div className="relative">
                  <Icon className={clsx("w-5 h-5 transition-transform duration-300", isActive && "scale-110")} />
                  
                  {tab.badge !== undefined && (
                    <span className={clsx(
                      "absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 flex items-center justify-center",
                      "text-[9px] font-bold rounded-full",
                      isActive ? "bg-accent text-white" : "bg-white/10 text-muted"
                    )}>
                      {tab.badge > 99 ? '99+' : tab.badge}
                    </span>
                  )}
                </div>
                
                <span className={clsx(
                  "text-[10px] font-semibold tracking-wide transition-all",
                  isActive ? "opacity-100" : "opacity-60"
                )}>
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* FAB for quick add on mobile preview tab */}
      {mobileTab === 'preview' && result.boards.length > 0 && (
        <button
          onClick={handleQuickAddCut}
          className="md:hidden fixed right-4 bottom-[88px] z-40 w-11 h-11 bg-accent text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform touch-manipulation"
        >
          <Plus className="w-5 h-5" />
        </button>
      )}

      <SupportModal isOpen={supportOpen} onClose={() => setSupportOpen(false)} />
    </div>
  )
}
