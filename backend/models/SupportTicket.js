import mongoose from 'mongoose'

const supportMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      default: '',
    },
    attachments: {
      type: [
        {
          fileName: String,
          mimeType: String,
          sizeBytes: Number,
          storageType: {
            type: String,
            enum: ['upload'],
            default: 'upload',
          },
        },
      ],
      default: [],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  },
)

const supportTicketSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['Open', 'Pending', 'Resolved'],
      default: 'Open',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    messages: {
      type: [supportMessageSchema],
      default: [],
    },
    resolvedAt: Date,
  },
  {
    timestamps: true,
  },
)

export const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema)
