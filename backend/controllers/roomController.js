import { Dorm } from '../models/Dorm.js'
import { Room } from '../models/Room.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/apiError.js'

function deriveStatus(seatCount, occupiedSeats, requestedStatus) {
  if (requestedStatus === 'Maintenance') {
    return 'Maintenance'
  }

  if (occupiedSeats >= seatCount) {
    return 'Full'
  }

  if (occupiedSeats > 0) {
    return 'Limited'
  }

  return 'Open'
}

export const listRooms = asyncHandler(async (req, res) => {
  const { dormId, status, type, maxPrice } = req.query
  const query = {}

  if (dormId) query.dorm = dormId
  if (status) query.status = status
  if (type) query.type = type
  if (maxPrice) query.priceMonthly = { $lte: Number(maxPrice) }

  const rooms = await Room.find(query)
    .populate('dorm', 'name block address')
    .sort({ createdAt: -1 })

  res.json({ success: true, rooms })
})

export const getRoomById = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id).populate('dorm', 'name block address')
  if (!room) {
    throw new ApiError(404, 'Room not found')
  }

  res.json({ success: true, room })
})

export const createRoom = asyncHandler(async (req, res) => {
  const { dorm: dormId, roomNumber, seatCount = 1, occupiedSeats = 0, status } = req.body

  const dorm = await Dorm.findById(dormId)
  if (!dorm) {
    throw new ApiError(404, 'Dorm not found')
  }

  const normalizedSeatCount = Math.max(1, Number(seatCount) || 1)
  const normalizedOccupiedSeats = Math.max(
    0,
    Math.min(Number(occupiedSeats) || 0, normalizedSeatCount),
  )
  const finalStatus = deriveStatus(normalizedSeatCount, normalizedOccupiedSeats, status)

  const room = await Room.create({
    ...req.body,
    seatCount: normalizedSeatCount,
    occupiedSeats: normalizedOccupiedSeats,
    status: finalStatus,
    roomNumber,
  })

  res.status(201).json({ success: true, message: 'Room created', room })
})

export const updateRoom = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id)
  if (!room) {
    throw new ApiError(404, 'Room not found')
  }

  const updates = { ...req.body }
  const nextSeatCount = updates.seatCount !== undefined ? Number(updates.seatCount) : room.seatCount
  const nextOccupied = updates.occupiedSeats !== undefined ? Number(updates.occupiedSeats) : room.occupiedSeats
  const requestedStatus = updates.status !== undefined ? updates.status : room.status

  updates.status = deriveStatus(nextSeatCount, nextOccupied, requestedStatus)
  updates.seatCount = nextSeatCount
  updates.occupiedSeats = Math.max(0, Math.min(nextOccupied, nextSeatCount))

  const updated = await Room.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  })

  res.json({ success: true, message: 'Room updated', room: updated })
})

export const deleteRoom = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id)
  if (!room) {
    throw new ApiError(404, 'Room not found')
  }

  await room.deleteOne()
  res.json({ success: true, message: 'Room deleted' })
})
