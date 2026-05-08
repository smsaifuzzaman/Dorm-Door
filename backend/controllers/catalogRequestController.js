import { CatalogRequest } from '../models/CatalogRequest.js'
import { Dorm } from '../models/Dorm.js'
import { Notification } from '../models/Notification.js'
import { Room } from '../models/Room.js'
import { promoteWaitlistedApplicantsForRoom } from '../services/waitlistPromotionService.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/apiError.js'

function normalizeText(value) {
  return String(value || '').trim()
}

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeText(item)).filter(Boolean)
  }

  return normalizeText(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function normalizeDormPayload(payload = {}, requestedBy) {
  return {
    name: normalizeText(payload.name),
    block: normalizeText(payload.block) || 'General',
    address: normalizeText(payload.address),
    description: normalizeText(payload.description),
    rules: normalizeText(payload.rules),
    priceRange: normalizeText(payload.priceRange),
    facilities: normalizeList(payload.facilities),
    images: normalizeList(payload.images),
    totalFloors: Math.max(1, Number(payload.totalFloors || 1)),
    totalCapacity: Math.max(0, Number(payload.totalCapacity || 0)),
    status: normalizeText(payload.status).toLowerCase() === 'inactive' ? 'inactive' : 'active',
    managedBy: requestedBy,
  }
}

function deriveRoomStatus(seatCount, occupiedSeats, requestedStatus) {
  if (requestedStatus === 'Maintenance' || requestedStatus === 'Unavailable') return requestedStatus
  if (occupiedSeats >= seatCount) return 'Full'
  if (occupiedSeats > 0) return 'Limited'
  return 'Open'
}

function normalizeRoomPayload(payload = {}) {
  const seatCount = Math.max(1, Number(payload.seatCount || 1))
  const occupiedSeats = Math.max(0, Math.min(Number(payload.occupiedSeats || 0), seatCount))

  return {
    dorm: normalizeText(payload.dorm),
    roomNumber: normalizeText(payload.roomNumber),
    floor: normalizeText(payload.floor) || 'Ground Floor',
    type: normalizeText(payload.type) || 'Single Room',
    seatCount,
    occupiedSeats,
    priceMonthly: Math.max(0, Number(payload.priceMonthly || payload.price || 0)),
    amenities: normalizeList(payload.amenities),
    images: normalizeList(payload.images),
    status: deriveRoomStatus(seatCount, occupiedSeats, normalizeText(payload.status)),
  }
}

async function notify(userId, title, message, type = 'application') {
  try {
    await Notification.create({ user: userId, title, message, type })
  } catch {
    // intentionally non-blocking
  }
}

function validateRequestPayload(type, payload) {
  if (type === 'dorm') {
    if (!payload.name || !payload.address) {
      throw new ApiError(400, 'Dorm name and address are required')
    }
    return
  }

  if (type === 'room') {
    if (!payload.dorm || !payload.roomNumber) {
      throw new ApiError(400, 'Dorm and room number are required')
    }
    if (payload.priceMonthly <= 0) {
      throw new ApiError(400, 'Monthly price is required')
    }
    return
  }

  throw new ApiError(400, 'Request type must be dorm or room')
}

export const listCatalogRequests = asyncHandler(async (req, res) => {
  const query = {}
  if (req.user.role === 'admin') {
    query.requestedBy = req.user.id
  }

  const requests = await CatalogRequest.find(query)
    .populate('requestedBy', 'name email phone')
    .populate('reviewedBy', 'name email')
    .sort({ createdAt: -1 })

  res.json({ success: true, requests })
})

export const createCatalogRequest = asyncHandler(async (req, res) => {
  const type = normalizeText(req.body?.type).toLowerCase()
  const payload = type === 'dorm'
    ? normalizeDormPayload(req.body?.payload, req.user.id)
    : normalizeRoomPayload(req.body?.payload)

  validateRequestPayload(type, payload)

  if (type === 'room') {
    const dorm = await Dorm.findOne({ _id: payload.dorm, status: 'active' })
    if (!dorm) {
      throw new ApiError(404, 'Dorm not found')
    }
  }

  const request = await CatalogRequest.create({
    requestedBy: req.user.id,
    type,
    payload,
  })

  res.status(201).json({
    success: true,
    message: 'Catalog request submitted for super admin approval',
    request,
  })
})

export const approveCatalogRequest = asyncHandler(async (req, res) => {
  const request = await CatalogRequest.findById(req.params.id)
  if (!request) {
    throw new ApiError(404, 'Catalog request not found')
  }

  if (request.status !== 'Pending') {
    throw new ApiError(400, 'Only pending requests can be approved')
  }

  let created
  let promotedApplications = []
  if (request.type === 'dorm') {
    created = await Dorm.create(normalizeDormPayload(request.payload, request.requestedBy))
    request.resultModel = 'Dorm'
  } else {
    const payload = normalizeRoomPayload(request.payload)
    const dorm = await Dorm.findOne({ _id: payload.dorm, status: 'active' })
    if (!dorm) {
      throw new ApiError(404, 'Dorm not found')
    }
    created = await Room.create(payload)
    promotedApplications = await promoteWaitlistedApplicantsForRoom(created._id)
    request.resultModel = 'Room'
  }

  request.status = 'Approved'
  request.adminNote = normalizeText(req.body?.adminNote)
  request.reviewedBy = req.user.id
  request.reviewedAt = new Date()
  request.resultId = created._id
  await request.save()

  await notify(
    request.requestedBy,
    'Catalog Request Approved',
    `Your ${request.type} request was approved and added to Dorm Door.`,
  )

  const populated = await request.populate(['requestedBy', 'reviewedBy'])
  res.json({
    success: true,
    message: promotedApplications.length
      ? `Catalog request approved. ${promotedApplications.length} waitlisted applicant promoted.`
      : 'Catalog request approved',
    request: populated,
    record: created,
    promotedApplications,
  })
})

export const rejectCatalogRequest = asyncHandler(async (req, res) => {
  const request = await CatalogRequest.findById(req.params.id)
  if (!request) {
    throw new ApiError(404, 'Catalog request not found')
  }

  if (request.status !== 'Pending') {
    throw new ApiError(400, 'Only pending requests can be rejected')
  }

  request.status = 'Rejected'
  request.adminNote = normalizeText(req.body?.adminNote)
  request.reviewedBy = req.user.id
  request.reviewedAt = new Date()
  await request.save()

  await notify(
    request.requestedBy,
    'Catalog Request Rejected',
    request.adminNote || `Your ${request.type} request was rejected by super admin.`,
  )

  const populated = await request.populate(['requestedBy', 'reviewedBy'])
  res.json({ success: true, message: 'Catalog request rejected', request: populated })
})
