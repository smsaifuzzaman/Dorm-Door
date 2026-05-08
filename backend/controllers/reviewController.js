import { Application } from '../models/Application.js'
import { Review } from '../models/Review.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/apiError.js'

const RATING_CATEGORIES = ['cleanliness', 'security', 'internet', 'maintenance']

function normalizeRatingValue(value) {
  const rating = Number(value)
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) return null
  return Math.round(rating * 10) / 10
}

function calculateOverallRating(rating = {}) {
  const values = RATING_CATEGORIES.map((key) => normalizeRatingValue(rating[key]))
  if (values.some((value) => value === null)) return null

  const total = values.reduce((sum, value) => sum + value, 0)
  return Math.round((total / values.length) * 10) / 10
}

function withCalculatedOverall(review) {
  const item = typeof review.toObject === 'function' ? review.toObject() : review
  const overall = calculateOverallRating(item.rating)

  if (overall !== null) {
    item.rating = {
      ...item.rating,
      overall,
    }
  }

  return item
}

export const listReviews = asyncHandler(async (req, res) => {
  const { dormId } = req.query
  const query = { status: 'Published' }
  if (dormId) {
    query.dorm = dormId
  }

  const reviews = await Review.find(query)
    .populate('student', 'name role')
    .populate('dorm', 'name block')
    .populate('room', 'roomNumber')
    .sort({ createdAt: -1 })
  const studentReviews = reviews.filter((review) => review.student?.role === 'student')

  res.json({ success: true, reviews: studentReviews.map(withCalculatedOverall) })
})

export const createReview = asyncHandler(async (req, res) => {
  const { dorm, room, rating = {}, comment } = req.body
  const overall = calculateOverallRating(rating)

  if (!dorm || !room || !comment || overall === null) {
    throw new ApiError(400, 'dorm, room, category ratings, and comment are required')
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
    rating: {
      cleanliness: normalizeRatingValue(rating.cleanliness),
      security: normalizeRatingValue(rating.security),
      internet: normalizeRatingValue(rating.internet),
      maintenance: normalizeRatingValue(rating.maintenance),
      overall,
    },
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

  res.json({ success: true, reviews: reviews.map(withCalculatedOverall) })
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
