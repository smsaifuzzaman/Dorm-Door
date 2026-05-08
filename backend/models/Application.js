import mongoose from 'mongoose'

const applicationSchema = new mongoose.Schema(
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
    },
    personalInfo: {
      fullName: String,
      email: String,
      phone: String,
      studentId: String,
      department: String,
      university: String,
      gender: String,
      address: String,
    },
    preferences: {
      preferredRoomType: String,
      blockPreference: String,
      moveInDate: Date,
      specialRequests: String,
    },
    emergencyContact: {
      name: String,
      relation: String,
      phone: String,
    },
    status: {
      type: String,
      enum: ['Pending', 'Under Review', 'Approved', 'Rejected', 'Re-upload Requested', 'Waitlisted', 'Cancelled'],
      default: 'Pending',
    },
    paymentStatus: {
      type: String,
      enum: ['Not Submitted', 'Pending', 'Approved', 'Paid', 'Rejected'],
      default: 'Not Submitted',
    },
    adminNote: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  },
)

export const Application = mongoose.model('Application', applicationSchema)
