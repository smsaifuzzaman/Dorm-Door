import { Application } from '../models/Application.js'
import { Review } from '../models/Review.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/apiError.js'

export const listReviews = asyncHandler(async (req, res) => {
  const { dormId } = req.query
  const query = { status: 'Published' }
  if (dormId) {
    query.dorm = dormId
  }

  const reviews = await Review.find(query)
    .populate('student', 'name')
    .populate('dorm', 'name block')
    .populate('room', 'roomNumber')
    .sort({ createdAt: -1 })

  res.json({ success: true, reviews })
})

export const createReview = asyncHandler(async (req, res) => {
  const { dorm, room, rating, comment } = req.body
  if (!dorm || !room || !comment || !rating?.overall) {
    throw new ApiError(400, 'dorm, room, overall rating, and comment are required')
  }

  const approvedApplication = await Application.findOne({
    student: req.user.id,
    status: 'Approved',
    dorm,
    room,
  })

  if (!approvedApplication) {
    throw new ApiError(403, 'You must be assigned to a dorm before submitting a review.')
  }

  const review = await Review.create({
    ...req.body,
    dorm,
    room,
    student: req.user.id,
  })

  const populated = await review.populate(['student', 'dorm', 'room'])

  res.status(201).json({
    success: true,
    message: 'Review submitted',
    review: populated,
  })
})

export const listMyReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ student: req.user.id })
    .populate('student', 'name')
    .populate('dorm', 'name block')
    .populate('room', 'roomNumber type')
    .sort({ createdAt: -1 })

  res.json({ success: true, reviews })
})

export const updateReviewStatus = asyncHandler(async (req, res) => {
  const { status } = req.body
  const review = await Review.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true },
  ).populate(['student', 'dorm', 'room'])

  if (!review) {
    throw new ApiError(404, 'Review not found')
  }

  res.json({ success: true, message: 'Review status updated', review })
})
