import mongoose from 'mongoose'

const catalogRequestSchema = new mongoose.Schema(
  {
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['dorm', 'room'],
      required: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    adminNote: {
      type: String,
      default: '',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: Date,
    resultModel: {
      type: String,
      enum: ['Dorm', 'Room', ''],
      default: '',
    },
    resultId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'resultModel',
    },
  },
  {
    timestamps: true,
  },
)

export const CatalogRequest = mongoose.model('CatalogRequest', catalogRequestSchema)
