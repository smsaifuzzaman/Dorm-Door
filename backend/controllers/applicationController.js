import { Application } from '../models/Application.js'
import { Dorm } from '../models/Dorm.js'
import { Room } from '../models/Room.js'
import { Notification } from '../models/Notification.js'
import { promoteWaitlistedApplicantsForRoom } from '../services/waitlistPromotionService.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/apiError.js'

const APPLICATION_STATUSES = ['Pending', 'Under Review', 'Approved', 'Rejected', 'Re-upload Requested', 'Waitlisted']

async function notify(userId, title, message, type) {
  try {
    await Notification.create({ user: userId, title, message, type })
  } catch {
    // intentionally non-blocking
  }
}

function normalizeText(value) {
  return String(value || '').trim()
}

function normalizeApplicationPayload(body = {}) {
  const personalInfo = body.personalInfo || {}
  const emergencyContact = body.emergencyContact || {}
  const preferences = body.preferences || {}

  return {
    personalInfo: {
      fullName: normalizeText(personalInfo.fullName),
      email: normalizeText(personalInfo.email).toLowerCase(),
      phone: normalizeText(personalInfo.phone),
      studentId: normalizeText(personalInfo.studentId),
      department: normalizeText(personalInfo.department),
      university: normalizeText(personalInfo.university),
      gender: normalizeText(personalInfo.gender),
      address: normalizeText(personalInfo.address),
    },
    emergencyContact: {
      name: normalizeText(emergencyContact.name),
      relation: normalizeText(emergencyContact.relation),
      phone: normalizeText(emergencyContact.phone),
    },
    preferences: {
      preferredRoomType: normalizeText(preferences.preferredRoomType),
      blockPreference: normalizeText(preferences.blockPreference),
      moveInDate: preferences.moveInDate || undefined,
      specialRequests: normalizeText(preferences.specialRequests),
    },
  }
}

function validateApplicationPayload(payload) {
  const missing = []
  if (!payload.personalInfo.fullName) missing.push('personalInfo.fullName')
  if (!payload.personalInfo.email) missing.push('personalInfo.email')
  if (!payload.personalInfo.studentId) missing.push('personalInfo.studentId')
  if (!payload.emergencyContact.name) missing.push('emergencyContact.name')
  if (!payload.emergencyContact.phone) missing.push('emergencyContact.phone')

  if (missing.length) {
    throw new ApiError(400, `Missing required fields: ${missing.join(', ')}`)
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailPattern.test(payload.personalInfo.email)) {
    throw new ApiError(400, 'personalInfo.email must be a valid email address')
  }

  if (payload.preferences.moveInDate) {
    const moveInDate = new Date(payload.preferences.moveInDate)
    if (Number.isNaN(moveInDate.getTime())) {
      throw new ApiError(400, 'preferences.moveInDate must be a valid date')
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const normalizedMoveIn = new Date(moveInDate)
    normalizedMoveIn.setHours(0, 0, 0, 0)

    if (normalizedMoveIn < today) {
      throw new ApiError(400, 'preferences.moveInDate cannot be in the past')
    }

    payload.preferences.moveInDate = moveInDate
  }
}

function nextRoomStatus(room) {
  if (room.status === 'Maintenance' || room.status === 'Unavailable') return room.status
  if (room.occupiedSeats >= room.seatCount) return 'Full'
  if (room.occupiedSeats > 0) return 'Limited'
  return 'Open'
}

async function updateRoomOccupancy(roomId, delta) {
  if (!roomId || delta === 0) return null

  const room = await Room.findById(roomId)
  if (!room) {
    throw new ApiError(404, 'Assigned room not found')
  }

  room.occupiedSeats = Math.max(0, Math.min(room.seatCount, room.occupiedSeats + delta))
  room.status = nextRoomStatus(room)
  await room.save()
  return room
}

async function removeOtherDormApplicationsForStudent(application) {
  if (!application?.student || !application?._id) return

  await Application.deleteMany({
    student: application.student,
    _id: { $ne: application._id },
    status: { $ne: 'Approved' },
  })
}

async function validateAssignableRoom(roomId, dormId, shouldReserveSeat) {
  if (!roomId) return null

  const room = await Room.findById(roomId)
  if (!room) {
    throw new ApiError(404, 'Assigned room not found')
  }

  if (String(room.dorm) !== String(dormId)) {
    throw new ApiError(400, 'Assigned room does not belong to the application dorm')
  }

  if (room.status === 'Maintenance' || room.status === 'Unavailable') {
    throw new ApiError(400, 'Cannot assign unavailable room')
  }

  if (shouldReserveSeat && room.occupiedSeats >= room.seatCount) {
    throw new ApiError(400, 'Cannot approve application: room is full')
  }

  return room
}

export const createApplication = asyncHandler(async (req, res) => {
  const { dorm, room, personalInfo, preferences, emergencyContact } = req.body

  if (!dorm) {
    throw new ApiError(400, 'dorm is required')
  }

  const normalizedPayload = normalizeApplicationPayload({
    personalInfo,
    preferences,
    emergencyContact,
  })
  validateApplicationPayload(normalizedPayload)

  const dormExists = await Dorm.findById(dorm)
  if (!dormExists) {
    throw new ApiError(404, 'Dorm not found')
  }

  if (room) {
    const roomDoc = await Room.findById(room)
    if (!roomDoc) {
      throw new ApiError(404, 'Room not found')
    }

    if (String(roomDoc.dorm) !== String(dorm)) {
      throw new ApiError(400, 'Selected room does not belong to the selected dorm')
    }

    if (roomDoc.status === 'Maintenance' || roomDoc.status === 'Unavailable') {
      throw new ApiError(400, 'Selected room is not available')
    }

    if (roomDoc.occupiedSeats >= roomDoc.seatCount || roomDoc.status === 'Full') {
      throw new ApiError(400, 'Selected room is currently full')
    }
  }

  const application = await Application.create({
    student: req.user.id,
    dorm,
    room,
    personalInfo: normalizedPayload.personalInfo,
    preferences: normalizedPayload.preferences,
    emergencyContact: normalizedPayload.emergencyContact,
  })

  await notify(req.user.id, 'Application Submitted', 'Your room application was submitted successfully.', 'application')

  res.status(201).json({
    success: true,
    message: 'Application submitted',
    application,
  })
})

export const listApplications = asyncHandler(async (req, res) => {
  const { status } = req.query
  const query = {}

  if (req.user.role === 'student') {
    query.student = req.user.id
  }

  if (status) {
    query.status = status
  }

  const applications = await Application.find(query)
    .populate('student', 'name email studentId department')
    .populate('dorm', 'name block')
    .populate('room', 'roomNumber type priceMonthly')
    .sort({ createdAt: -1 })

  res.json({ success: true, applications })
})

export const getApplicationById = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id)
    .populate('student', 'name email studentId department')
    .populate('dorm', 'name block address')
    .populate('room', 'roomNumber type priceMonthly seatCount occupiedSeats status')

  if (!application) {
    throw new ApiError(404, 'Application not found')
  }

  if (req.user.role === 'student' && String(application.student._id) !== req.user.id) {
    throw new ApiError(403, 'Not allowed to access this application')
  }

  res.json({ success: true, application })
})

export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status, adminNote = '', room } = req.body

  if (!status) {
    throw new ApiError(400, 'status is required')
  }

  if (!APPLICATION_STATUSES.includes(status)) {
    throw new ApiError(400, `Invalid status. Allowed: ${APPLICATION_STATUSES.join(', ')}`)
  }

  const application = await Application.findById(req.params.id)
  if (!application) {
    throw new ApiError(404, 'Application not found')
  }

  const previousStatus = application.status
  let freedRoomId = ''
  const wasApproved = previousStatus === 'Approved'
  const isApproving = status === 'Approved'
  const nextRoomId = room === undefined ? application.room : room || undefined
  const roomChanged = String(application.room || '') !== String(nextRoomId || '')
  const approvalTransition = wasApproved !== isApproving

  if (isApproving && !nextRoomId) {
    throw new ApiError(400, 'Cannot approve application without an assigned room')
  }

  if (nextRoomId) {
    await validateAssignableRoom(
      nextRoomId,
      application.dorm,
      roomChanged || !application.room || (isApproving && !wasApproved),
    )
  }

  if (wasApproved && (approvalTransition || roomChanged)) {
    await updateRoomOccupancy(application.room, -1)
    freedRoomId = application.room
  }

  if (isApproving && (approvalTransition || roomChanged)) {
    await updateRoomOccupancy(nextRoomId, 1)
  }

  application.room = nextRoomId
  application.status = status
  application.adminNote = normalizeText(adminNote)
  await application.save()

  if (status === 'Approved') {
    await removeOtherDormApplicationsForStudent(application)
  }
  await application.populate([
    { path: 'student', select: 'name email studentId department' },
    { path: 'dorm', select: 'name block' },
    { path: 'room', select: 'roomNumber type priceMonthly seatCount occupiedSeats status' },
  ])

  if (previousStatus !== status) {
    await notify(
      application.student,
      'Application Updated',
      `Your application status changed from ${previousStatus} to ${status}.`,
      'application',
    )
  }

  const promotedApplications = freedRoomId
    ? await promoteWaitlistedApplicantsForRoom(freedRoomId, {
        excludeApplicationIds: [application._id],
      })
    : []

  res.json({
    success: true,
    message: promotedApplications.length
      ? `Application status updated. ${promotedApplications.length} waitlisted applicant promoted.`
      : 'Application status updated',
    application,
    promotedApplications,
  })
})
