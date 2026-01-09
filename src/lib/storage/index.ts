export function safeJsonParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function readLocalStorageJson<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(key)
  if (!raw) return null
  return safeJsonParse<T>(raw)
}

export function writeLocalStorageJson(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
}

export function removeLocalStorage(key: string) {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(key)
}

function tryDecodeStateFromEncoded(encoded: string) {
  try {
    const json = decodeURIComponent(escape(atob(encoded)))
    return JSON.parse(json) as unknown
  } catch {
    return null
  }
}

export function tryReadStateFromUrlHash() {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const encoded = params.get('state')
  if (!encoded) return null
  const parsed = tryDecodeStateFromEncoded(encoded)
  if (!parsed || typeof parsed !== 'object') return null
  const anyParsed: any = parsed
  return anyParsed?.state ?? parsed
}

