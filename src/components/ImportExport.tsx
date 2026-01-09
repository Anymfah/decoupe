import { Copy, Download, RotateCcw, Upload } from 'lucide-react'
import { useRef, useState } from 'react'

import { useAppDispatch, useAppState } from '../hooks/useAppState'

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
    downloadJson({ v: 1, state }, 'plan-parfait.json')
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
      setImportError('Impossible de lire ce fichier.')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const onReset = () => {
    setImportError(null)
    dispatch({ type: 'RESET' })
  }

  const onShare = async () => {
    setShareStatus(null)
    try {
      const url = encodeStateToUrl({ v: 1, state })
      await navigator.clipboard.writeText(url)
      setShareStatus('Lien copié.')
    } catch {
      setShareStatus('Impossible de copier automatiquement.')
    }
    window.setTimeout(() => setShareStatus(null), 1400)
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="inline-flex h-10 items-center gap-2 rounded-xl border bg-surface px-3 text-sm font-semibold shadow-soft transition duration-300 ease-out hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          onClick={onExport}
        >
          <Download className="h-4 w-4" />
          Export JSON
        </button>

        <button
          type="button"
          className="inline-flex h-10 items-center gap-2 rounded-xl border bg-surface px-3 text-sm font-semibold shadow-soft transition duration-300 ease-out hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          onClick={onImportClick}
        >
          <Upload className="h-4 w-4" />
          Import JSON
        </button>

        <button
          type="button"
          className="inline-flex h-10 items-center gap-2 rounded-xl border bg-surface px-3 text-sm font-semibold shadow-soft transition duration-300 ease-out hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          onClick={onShare}
        >
          <Copy className="h-4 w-4" />
          Partager
        </button>

        <button
          type="button"
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-danger/40 bg-surface px-3 text-sm font-semibold text-danger shadow-soft transition duration-300 ease-out hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
          onClick={onReset}
        >
          <RotateCcw className="h-4 w-4" />
          Réinitialiser
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
        />
      </div>

      <div className="min-w-0 text-sm text-muted">
        {importError ? <span className="font-semibold text-danger">{importError}</span> : null}
        {!importError && shareStatus ? <span className="font-semibold text-success">{shareStatus}</span> : null}
      </div>
    </div>
  )
}

