export function initialsFromName(name, fallback = 'U') {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return fallback
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export function displayAvatarFor(user, fallback = 'U') {
  return {
    initials: initialsFromName(user?.name, fallback),
    image: String(user?.profileImage || '').trim(),
  }
}
