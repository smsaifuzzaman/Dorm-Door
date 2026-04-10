import { Application } from '../models/Application.js'
import { Dorm } from '../models/Dorm.js'
import { Room } from '../models/Room.js'
import { Notification } from '../models/Notification.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/apiError.js'

async function notify(userId, title, message, type) {
  try {
    await Notification.create({ user: userId, title, message, type })
  } catch {
    // intentionally non-blocking
  }
}

export const createApplication = asyncHandler(async (req, res) => {
  const { dorm, room, personalInfo, preferences, emergencyContact } = req.body

  if (!dorm) {
    throw new ApiError(400, 'dorm is required')
  }

  const dormExists = await Dorm.findById(dorm)
  if (!dormExists) {
    throw new ApiError(404, 'Dorm not found')
  }

  let roomDoc = null
  if (room) {
    roomDoc = await Room.findById(room)
    if (!roomDoc) {
      throw new ApiError(404, 'Room not found')
    }

    if (String(roomDoc.dorm) !== String(dorm)) {
      throw new ApiError(400, 'Selected room does not belong to the selected dorm')
    }
  }

  const application = await Application.create({
    student: req.user.id,
    dorm,
    room,
    personalInfo,
    preferences,
    emergencyContact,
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

function nextRoomStatus(room) {
  if (room.status === 'Maintenance') return 'Maintenance'
  if (room.occupiedSeats >= room.seatCount) return 'Full'
  if (room.occupiedSeats > 0) return 'Limited'
  return 'Open'
}

export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status, adminNote = '' } = req.body

  if (!status) {
    throw new ApiError(400, 'status is required')
  }

  const allowed = ['Pending', 'Under Review', 'Approved', 'Rejected', 'Re-upload Requested']
  if (!allowed.includes(status)) {
    throw new ApiError(400, `Invalid status. Allowed: ${allowed.join(', ')}`)
  }

  const application = await Application.findById(req.params.id)
  if (!application) {
    throw new ApiError(404, 'Application not found')
  }

  if (status === 'Approved' && application.room) {
    const room = await Room.findById(application.room)

    if (!room) {
      throw new ApiError(404, 'Assigned room not found')
    }

    if (room.status === 'Maintenance') {
      throw new ApiError(400, 'Cannot approve application for room in maintenance')
    }

    if (room.occupiedSeats >= room.seatCount) {
      throw new ApiError(400, 'Cannot approve application: room is full')
    }

    room.occupiedSeats += 1
    room.status = nextRoomStatus(room)
    await room.save()
  }

  application.status = status
  application.adminNote = adminNote
  await application.save()

  await notify(
    application.student,
    'Application Updated',
    `Your application status changed to ${status}.`,
    'application',
  )

  res.json({
    success: true,
    message: 'Application status updated',
    application,
  })
})
