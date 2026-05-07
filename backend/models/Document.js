import mongoose from 'mongoose'

const documentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
    },
    category: {
      type: String,
      enum: [
        'Student ID',
        'Passport Photo',
        'Admission Certificate',
        'Health Document',
        'National ID',
        'Dorm License',
        'Ownership Document',
        'Trade License',
        'Other',
      ],
      default: 'Other',
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 240,
    },
    storageType: {
      type: String,
      enum: ['url', 'upload'],
      default: 'url',
    },
    fileUrl: {
      type: String,
      trim: true,
      maxlength: 2048,
      default: '',
      required() {
        return this.storageType === 'url'
      },
      validate: {
        validator(value) {
          if (this.storageType !== 'url') {
            return !value || String(value).trim() === ''
          }

          try {
            const parsed = new URL(String(value || ''))
            return ['http:', 'https:'].includes(parsed.protocol) && Boolean(parsed.hostname) && !parsed.username && !parsed.password
          } catch {
            return false
          }
        },
        message: 'fileUrl must be a valid http(s) URL when storageType is url',
      },
    },
    mimeType: {
      type: String,
      trim: true,
      maxlength: 120,
      default: '',
    },
    sizeBytes: {
      type: Number,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Pending', 'Verified', 'Rejected', 'Needs Update'],
      default: 'Pending',
    },
    reviewNote: {
      type: String,
      default: '',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  },
)

export const Document = mongoose.model('Document', documentSchema)
