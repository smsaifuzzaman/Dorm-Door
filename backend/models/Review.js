import mongoose from 'mongoose'

const reviewSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    dorm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dorm',
      required: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
    rating: {
      overall: { type: Number, min: 1, max: 5, required: true },
      cleanliness: { type: Number, min: 1, max: 5 },
      security: { type: Number, min: 1, max: 5 },
      internet: { type: Number, min: 1, max: 5 },
      maintenance: { type: Number, min: 1, max: 5 },
    },
    comment: {
      type: String,
      required: true,
    },
    anonymous: {
      type: Boolean,
      default: false,
    },
    photos: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['Published', 'Pending', 'Hidden'],
      default: 'Published',
    },
  },
  {
    timestamps: true,
  },
)

export const Review = mongoose.model('Review', reviewSchema)
