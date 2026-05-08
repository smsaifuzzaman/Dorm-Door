import { Application } from '../models/Application.js'
import { Dorm } from '../models/Dorm.js'
import { Notification } from '../models/Notification.js'
import { Transaction } from '../models/Transaction.js'
import { User } from '../models/User.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/apiError.js'
import { saveUploadedFile } from '../utils/fileStorage.js'

function normalizeText(value) {
  return String(value || '').trim()
}

async function notify(userId, title, message) {
  try {
    await Notification.create({ user: userId, title, message, type: 'payment' })
  } catch {
    // intentionally non-blocking
  }
}

async function notifySuperAdmins(title, message) {
  try {
    const superAdmins = await User.find({
      role: 'superAdmin',
      accountStatus: { $ne: 'blocked' },
    }).select('_id')

    if (!superAdmins.length) return

    await Notification.insertMany(
      superAdmins.map((admin) => ({
        user: admin._id,
        title,
        message,
        type: 'payment',
      })),
    )
  } catch {
    // intentionally non-blocking
  }
}

async function getAdminDormIds(userId) {
  const [admin, managedDorms] = await Promise.all([
    User.findById(userId).select('assignedDorm').lean(),
    Dorm.find({ managedBy: userId }).select('_id').lean(),
  ])

  const dormIds = managedDorms.map((dorm) => dorm._id)
  if (admin?.assignedDorm) dormIds.push(admin.assignedDorm)
  return [...new Set(dormIds.map((id) => String(id)))]
}

export const listTransactions = asyncHandler(async (req, res) => {
  const query = {}
  if (req.user.role === 'student') {
    query.student = req.user.id
  }

  if (req.user.role === 'admin') {
    const dormIds = await getAdminDormIds(req.user.id)
    if (dormIds.length) {
      query.dorm = { $in: dormIds }
    } else {
      query._id = null
    }
    query.status = 'Approved'
  }

  const transactions = await Transaction.find(query)
    .populate('student', 'name email studentId phone paymentStatus')
    .populate('application', 'status paymentStatus personalInfo preferences createdAt')
    .populate('dorm', 'name block address')
    .populate('room', 'roomNumber type priceMonthly')
    .populate('approvedBy', 'name email')
    .populate('rejectedBy', 'name email')
    .sort({ createdAt: -1 })

  res.json({ success: true, transactions })
})

export const createTransaction = asyncHandler(async (req, res) => {
  const applicationId = normalizeText(req.body?.application)
  const amount = Number(req.body?.amount)
  const paymentMethod = normalizeText(req.body?.paymentMethod)
  const transactionId = normalizeText(req.body?.transactionId)

  if (!applicationId || !paymentMethod || !transactionId || Number.isNaN(amount) || amount <= 0) {
    throw new ApiError(400, 'application, amount, paymentMethod and transactionId are required')
  }

  const application = await Application.findById(applicationId)
  if (!application) {
    throw new ApiError(404, 'Application not found')
  }

  if (String(application.student) !== req.user.id) {
    throw new ApiError(403, 'You can only submit payment for your own application')
  }

  const existingForApplication = await Transaction.findOne({
    application: application._id,
    status: { $in: ['Pending', 'Approved'] },
  })

  if (existingForApplication) {
    throw new ApiError(409, `This application already has a ${existingForApplication.status.toLowerCase()} transaction`)
  }

  const duplicateTransaction = await Transaction.findOne({ transactionId })
  if (duplicateTransaction) {
    throw new ApiError(409, 'Transaction ID already exists')
  }

  const receiptUrl = req.file
    ? await saveUploadedFile(req.file, 'receipts', `receipt-${req.user.id}`)
    : ''

  const transaction = await Transaction.create({
    student: application.student,
    application: application._id,
    dorm: application.dorm,
    room: application.room,
    amount,
    paymentMethod,
    transactionId,
    receiptUrl,
    status: 'Pending',
  })

  application.paymentStatus = 'Pending'
  await application.save()
  await User.findByIdAndUpdate(application.student, { paymentStatus: 'Pending' })

  const [student, dorm] = await Promise.all([
    User.findById(application.student).select('name email').lean(),
    application.dorm ? Dorm.findById(application.dorm).select('name').lean() : null,
  ])

  await Promise.all([
    notify(application.student, 'Payment Submitted', 'Your payment is pending super admin review.'),
    notifySuperAdmins(
      'Payment Approval Needed',
      `${student?.name || 'A student'} submitted ${amount.toLocaleString()} for ${
        dorm?.name || 'a dorm'
      }. Transaction ID: ${transactionId}.`,
    ),
  ])

  const populated = await transaction.populate([
    { path: 'student', select: 'name email studentId phone paymentStatus' },
    { path: 'application', select: 'status paymentStatus personalInfo preferences createdAt' },
    { path: 'dorm', select: 'name block address' },
    { path: 'room', select: 'roomNumber type priceMonthly' },
  ])

  res.status(201).json({
    success: true,
    message: 'Transaction submitted and marked pending',
    transaction: populated,
  })
})
