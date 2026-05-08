const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
export const DORM_IMAGE_FALLBACK =
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80'

const fallbackImagesByTopic = [
  {
    keywords: ['room', 'bed', 'bedroom', 'interior', 'suite'],
    url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
  },
  {
    keywords: ['building', 'dorm', 'hostel', 'residence', 'apartment'],
    url: DORM_IMAGE_FALLBACK,
  },
]

const amenityIcons = {
  wifi: 'wifi',
  internet: 'wifi',
  ac: 'ac_unit',
  air: 'ac_unit',
  bath: 'bathtub',
  laundry: 'local_laundry_service',
  security: 'security',
  dining: 'restaurant',
  cafeteria: 'restaurant',
  study: 'menu_book',
  fitness: 'fitness_center',
}

export function priceToNumber(price) {
  const values = String(price || '')
    .match(/\d[\d,]*/g)
    ?.map((value) => Number(value.replace(/,/g, '')))
    .filter((value) => Number.isFinite(value))

  return values?.length ? Math.min(...values) : 0
}

function apiOrigin() {
  try {
    return new URL(API_BASE_URL).origin
  } catch {
    return API_BASE_URL.replace(/\/api\/?$/, '')
  }
}

function resolveImageUrl(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  if (/^(data:|blob:)/i.test(raw)) return raw
  if (/^https?:/i.test(raw)) {
    try {
      const parsed = new URL(raw)
      const hostname = parsed.hostname.toLowerCase()

      if (hostname === 'images.unsplash.com') {
        if (!parsed.searchParams.has('auto')) parsed.searchParams.set('auto', 'format')
        if (!parsed.searchParams.has('fit')) parsed.searchParams.set('fit', 'crop')
        if (!parsed.searchParams.has('w')) parsed.searchParams.set('w', '1200')
        if (!parsed.searchParams.has('q')) parsed.searchParams.set('q', '80')
        return parsed.toString()
      }

      if (hostname === 'unsplash.com' || hostname === 'www.unsplash.com') {
        const pathParts = parsed.pathname.split('/').filter(Boolean)
        const queryText =
          pathParts[0] === 's' && pathParts[1] === 'photos'
            ? pathParts.slice(2).join(' ')
            : parsed.searchParams.get('query') || parsed.pathname
        const normalizedQuery = decodeURIComponent(queryText).toLowerCase()
        const matchedFallback = fallbackImagesByTopic.find(({ keywords }) =>
          keywords.some((keyword) => normalizedQuery.includes(keyword)),
        )
        return matchedFallback?.url || DORM_IMAGE_FALLBACK
      }
    } catch {
      return raw
    }

    return raw
  }
  if (raw.startsWith('/uploads/')) return `${apiOrigin()}${raw}`
  return raw
}

function formatMoney(value) {
  return `BDT ${Number(value || 0).toLocaleString()}`
}

function firstRoom(dorm = {}) {
  return Array.isArray(dorm.rooms) && dorm.rooms.length ? dorm.rooms[0] : null
}

function dormPriceRange(dorm = {}) {
  if (dorm.priceRange) return dorm.priceRange

  const rooms = Array.isArray(dorm.rooms) ? dorm.rooms : []
  const prices = rooms.map((room) => Number(room.priceMonthly || 0)).filter((price) => price > 0)
  if (!prices.length) return 'BDT 0'

  const min = Math.min(...prices)
  const max = Math.max(...prices)
  return min === max ? formatMoney(min) : `${formatMoney(min)} - ${formatMoney(max)}`
}

function dormStatus(dorm = {}) {
  const availableSeats = Number(dorm.availableSeats || 0)
  const totalSeats = Number(dorm.totalSeats || 0)

  if (dorm.status === 'inactive') return 'Unavailable'
  if (availableSeats <= 0 && totalSeats > 0) return 'Full'
  if (availableSeats > 0 && totalSeats > 0 && availableSeats <= Math.ceil(totalSeats * 0.25)) return 'Limited Seats'
  return 'Available'
}

function amenityIcon(label) {
  const normalized = String(label || '').toLowerCase()
  const key = Object.keys(amenityIcons).find((item) => normalized.includes(item))
  return key ? amenityIcons[key] : 'check_circle'
}

function dormAmenities(dorm = {}) {
  return Array.isArray(dorm.facilities) ? dorm.facilities.filter(Boolean) : []
}

function studentRating(dorm = {}) {
  const source = dorm.studentRating || {}
  const average = Number(source.average || 0)
  const count = Number(source.count || 0)

  if (!Number.isFinite(average) || !Number.isFinite(count) || average <= 0 || count <= 0) {
    return null
  }

  return {
    average: Math.round(average * 10) / 10,
    count,
  }
}

export function toPublicDorm(dorm = {}) {
  const room = firstRoom(dorm)
  const images = Array.isArray(dorm.images)
    ? dorm.images.map(resolveImageUrl).filter(Boolean)
    : []
  const amenities = dormAmenities(dorm)
  const roomCount = Number(dorm.roomCount || dorm.rooms?.length || 0)
  const totalSeats = Number(dorm.totalSeats || dorm.totalCapacity || 0)

  return {
    id: dorm._id || dorm.id,
    name: dorm.name || 'Dorm',
    type: room?.type || 'Dormitory',
    price: dormPriceRange(dorm),
    status: dormStatus(dorm),
    location: dorm.address || dorm.location || dorm.block || 'Location not set',
    block: dorm.block || 'General',
    amenities,
    image: images[0],
    images,
    rent: dormPriceRange(dorm),
    amenityTags: amenities,
    gallery: images,
    description: dorm.description || '',
    rules: dorm.rules || '',
    studentRating: studentRating(dorm),
    specs: [
      { label: 'Type', value: room?.type || 'Mixed Rooms', icon: 'hotel' },
      { label: 'Rooms', value: `${roomCount} room${roomCount === 1 ? '' : 's'}`, icon: 'meeting_room' },
      { label: 'Seats', value: `${totalSeats} total`, icon: 'chair_alt' },
      { label: 'Available', value: `${Number(dorm.availableSeats || 0)} seats`, icon: 'event_available' },
      { label: 'Block', value: dorm.block || 'General', icon: 'apartment' },
      { label: 'Price', value: dormPriceRange(dorm), icon: 'payments' },
    ],
    detailedAmenities: amenities.map((label) => ({
      icon: amenityIcon(label),
      label,
    })),
    rooms: Array.isArray(dorm.rooms) ? dorm.rooms : [],
  }
}

export function toPublicDorms(dorms = []) {
  return dorms.filter((dorm) => dorm && dorm.status !== 'inactive').map(toPublicDorm)
}
