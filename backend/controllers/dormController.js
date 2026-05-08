import { CatalogRequest } from '../models/CatalogRequest.js'
import { Dorm } from '../models/Dorm.js'
import { Review } from '../models/Review.js'
import { Room } from '../models/Room.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/apiError.js'

const PUBLIC_DORM_STATUS_FILTER = { $nin: ['inactive', 'Inactive'] }

function isDormInactive(dorm) {
  return String(dorm?.status || '').toLowerCase() === 'inactive'
}

export const listDorms = asyncHandler(async (req, res) => {
  const { search = '' } = req.query
  const query = { status: PUBLIC_DORM_STATUS_FILTER }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { block: { $regex: search, $options: 'i' } },
      { address: { $regex: search, $options: 'i' } },
    ]
  }

  const dorms = await Dorm.find(query).sort({ createdAt: -1 }).lean()

  const dormIds = dorms.map((dorm) => dorm._id)
  const [rooms, reviewStats] = await Promise.all([
    Room.find({ dorm: { $in: dormIds } }).lean(),
    Review.aggregate([
      {
        $match: {
          dorm: { $in: dormIds },
          status: 'Published',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'student',
          foreignField: '_id',
          as: 'student',
        },
      },
      { $unwind: '$student' },
      { $match: { 'student.role': 'student' } },
      {
        $addFields: {
          calculatedOverall: {
            $cond: [
              {
                $and: [
                  { $gte: ['$rating.cleanliness', 1] },
                  { $lte: ['$rating.cleanliness', 5] },
                  { $gte: ['$rating.security', 1] },
                  { $lte: ['$rating.security', 5] },
                  { $gte: ['$rating.internet', 1] },
                  { $lte: ['$rating.internet', 5] },
                  { $gte: ['$rating.maintenance', 1] },
                  { $lte: ['$rating.maintenance', 5] },
                ],
              },
              { $avg: ['$rating.cleanliness', '$rating.security', '$rating.internet', '$rating.maintenance'] },
              '$rating.overall',
            ],
          },
        },
      },
      { $match: { calculatedOverall: { $gte: 1, $lte: 5 } } },
      {
        $group: {
          _id: '$dorm',
          average: { $avg: '$calculatedOverall' },
          count: { $sum: 1 },
        },
      },
    ]),
  ])

  const roomsByDorm = rooms.reduce((acc, room) => {
    const key = String(room.dorm)
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(room)
    return acc
  }, {})

  const ratingsByDorm = reviewStats.reduce((acc, item) => {
    acc[String(item._id)] = {
      average: Math.round(Number(item.average || 0) * 10) / 10,
      count: Number(item.count || 0),
    }
    return acc
  }, {})

  const enriched = dorms.map((dorm) => {
    const dormRooms = roomsByDorm[String(dorm._id)] || []
    const summary = dormRooms.reduce(
      (acc, room) => {
        acc.rooms += 1
        acc.seats += Number(room.seatCount || 0)
        acc.occupied += Number(room.occupiedSeats || 0)
        return acc
      },
      { rooms: 0, seats: 0, occupied: 0 },
    )

    return {
      ...dorm,
      rooms: dormRooms,
      roomCount: summary.rooms,
      totalSeats: summary.seats,
      occupiedSeats: summary.occupied,
      availableSeats: Math.max(summary.seats - summary.occupied, 0),
      studentRating: ratingsByDorm[String(dorm._id)] || null,
    }
  })

  res.json({ success: true, dorms: enriched })
})

export const getDormById = asyncHandler(async (req, res) => {
  const dorm = await Dorm.findById(req.params.id)
  if (!dorm || isDormInactive(dorm)) {
    throw new ApiError(404, 'Dorm not found')
  }

  const rooms = await Room.find({ dorm: dorm._id }).sort({ roomNumber: 1 })

  res.json({
    success: true,
    dorm,
    rooms,
  })
})

export const createDorm = asyncHandler(async (req, res) => {
  const payload = {
    ...req.body,
    status: req.body?.status || 'active',
  }

  if (!payload.name || !payload.address) {
    throw new ApiError(400, 'Dorm name and address are required')
  }

  const request = await CatalogRequest.create({
    requestedBy: req.user.id,
    type: 'dorm',
    payload,
  })

  res.status(201).json({
    success: true,
    message: 'Dorm request submitted for super admin approval',
    request,
  })
})

export const updateDorm = asyncHandler(async (req, res) => {
  const dorm = await Dorm.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })

  if (!dorm) {
    throw new ApiError(404, 'Dorm not found')
  }

  res.json({ success: true, message: 'Dorm updated', dorm })
})

export const deleteDorm = asyncHandler(async (req, res) => {
  const dorm = await Dorm.findById(req.params.id)
  if (!dorm) {
    throw new ApiError(404, 'Dorm not found')
  }

  const roomCount = await Room.countDocuments({ dorm: dorm._id })
  if (roomCount > 0) {
    throw new ApiError(400, 'Cannot delete dorm with existing rooms')
  }

  await dorm.deleteOne()
  res.json({ success: true, message: 'Dorm deleted' })
})
