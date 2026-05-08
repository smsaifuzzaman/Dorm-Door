const SAFE_PROTOCOLS = new Set(['http:', 'https:'])
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function apiOrigin() {
  try {
    return new URL(API_BASE_URL).origin
  } catch {
    return API_BASE_URL.replace(/\/api\/?$/, '')
  }
}

export function resolveBackendAssetUrl(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  if (/^(data:|blob:|https?:)/i.test(raw)) return raw
  if (raw.startsWith('/uploads/')) return `${apiOrigin()}${raw}`
  return raw
}

export function toSafeExternalUrl(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''

  if (raw.startsWith('/uploads/')) {
    return resolveBackendAssetUrl(raw)
  }

  try {
    const parsed = new URL(raw)
    if (!SAFE_PROTOCOLS.has(parsed.protocol)) return ''
    if (!parsed.hostname) return ''
    if (parsed.username || parsed.password) return ''
    return parsed.toString()
  } catch {
    return ''
  }
}
