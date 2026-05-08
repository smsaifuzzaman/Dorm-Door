const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function apiOrigin() {
  try {
    return new URL(API_BASE_URL).origin
  } catch {
    return API_BASE_URL.replace(/\/api\/?$/, '')
  }
}

function resolveAvatarUrl(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  if (/^(https?:|data:|blob:)/i.test(raw)) return raw
  if (raw.startsWith('/uploads/')) return `${apiOrigin()}${raw}`
  return raw
}

export function initialsFromName(name, fallback = 'U') {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return fallback
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export function displayAvatarFor(user, fallback = 'U') {
  return {
    initials: initialsFromName(user?.name, fallback),
    image: resolveAvatarUrl(user?.profileImage),
  }
}
