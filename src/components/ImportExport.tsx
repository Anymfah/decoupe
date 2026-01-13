import { Share2, FileDown, FileUp, RefreshCw } from 'lucide-react'
import { useRef, useState } from 'react'

import { useAppDispatch, useAppState } from '../hooks/useAppState'
import { Button } from './ui'

function downloadJson(data: unknown, fileName: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}

function encodeStateToUrl(state: unknown) {
  const json = JSON.stringify(state)
  const encoded = btoa(unescape(encodeURIComponent(json)))
  const url = new URL(window.location.href)
  const params = new URLSearchParams(url.hash.replace(/^#/, ''))
  params.set('state', encoded)
  url.hash = params.toString()
  return url.toString()
}

export function ImportExport() {
  const state = useAppState()
  const dispatch = useAppDispatch()
  const fileRef = useRef<HTMLInputElement | null>(null)

  const [importError, setImportError] = useState<string | null>(null)
  const [shareStatus, setShareStatus] = useState<string | null>(null)

  const onExport = () => {
    downloadJson({ v: 1, state }, 'ezcut-be-config.json')
  }

  const onImportClick = () => {
    setImportError(null)
    fileRef.current?.click()
  }

  const onFileChange = async (file: File | null) => {
    if (!file) return
    setImportError(null)
    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as any
      const nextState = parsed?.state ?? parsed
      if (!nextState || typeof nextState !== 'object') {
        setImportError('Fichier invalide.')
        return
      }
      dispatch({ type: 'IMPORT_STATE', state: nextState })
    } catch {
      setImportError('Erreur de lecture.')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const onReset = () => {
    if (window.confirm('Voulez-vous vraiment réinitialiser toutes les données ?')) {
      setImportError(null)
      dispatch({ type: 'RESET' })
    }
  }

  const onShare = async () => {
    setShareStatus(null)
    try {
      const url = encodeStateToUrl({ v: 1, state })
      await navigator.clipboard.writeText(url)
      setShareStatus('Lien copié !')
    } catch {
      setShareStatus('Erreur de copie.')
    }
    window.setTimeout(() => setShareStatus(null), 2000)
  }

  return (
    <div className="space-y-4">
      {/* Action buttons grid - 2x2 on mobile */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={onExport}
          className="h-11 px-3 w-full touch-manipulation"
          title="Exporter en JSON"
        >
          <FileDown className="h-4 w-4 mr-2" />
          Export
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={onImportClick}
          className="h-11 px-3 w-full touch-manipulation"
          title="Importer un fichier JSON"
        >
          <FileUp className="h-4 w-4 mr-2" />
          Import
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={onShare}
          className="h-11 px-3 w-full touch-manipulation"
          title="Partager la configuration via URL"
        >
          <Share2 className="h-4 w-4 mr-2 text-accent" />
          Partager
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="h-11 px-3 w-full text-danger/70 hover:text-danger hover:bg-danger/10 touch-manipulation border border-danger/10"
          title="Réinitialiser le projet"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Reset
        </Button>

        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
        />
      </div>

      {/* Status message */}
      <div className="text-xs font-bold uppercase tracking-widest text-center min-h-[1.5em] flex items-center justify-center">
        {importError && <span className="text-danger animate-pulse">{importError}</span>}
        {!importError && shareStatus && <span className="text-accent animate-fade-in">{shareStatus}</span>}
        {!importError && !shareStatus && <span className="text-muted2 opacity-50">Sauvegardez ou partagez votre projet</span>}
      </div>
    </div>
  )
}
