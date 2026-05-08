import { Application } from '../models/Application.js'
import { Document } from '../models/Document.js'
import { Dorm } from '../models/Dorm.js'
import { Notification } from '../models/Notification.js'
import { Review } from '../models/Review.js'
import { Room } from '../models/Room.js'
import { SupportTicket } from '../models/SupportTicket.js'
import { Transaction } from '../models/Transaction.js'
import { User } from '../models/User.js'
import { cancelOtherActiveApplicationsForStudent } from '../services/applicationLifecycleService.js'
import { promoteWaitlistedApplicantsForRoom } from '../services/waitlistPromotionService.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/apiError.js'

function normalizeText(value) {
  return String(value || '').trim()
}

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeText(item)).filter(Boolean)
  }

  return normalizeText(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function normalizeAccountStatus(value) {
  return normalizeText(value).toLowerCase() === 'blocked' ? 'blocked' : 'active'
}

function normalizeDormStatus(value) {
  return normalizeText(value).toLowerCase() === 'inactive' ? 'inactive' : 'active'
}

function normalizeRoomStatus(value) {
  const status = normalizeText(value)
  const aliases = {
    Available: 'Open',
    Booked: 'Full',
    Unavailable: 'Unavailable',
    Maintenance: 'Maintenance',
    Open: 'Open',
    Limited: 'Limited',
    Full: 'Full',
  }

  return aliases[status] || 'Open'
}

function withoutPassword(user) {
  const safeUser = user?.toObject ? user.toObject() : { ...(user || {}) }
  delete safeUser.password
  return safeUser
}

function deriveRoomStatus(seatCount, occupiedSeats, requestedStatus) {
  if (requestedStatus === 'Maintenance' || requestedStatus === 'Unavailable') {
    return requestedStatus
  }

  if (requestedStatus === 'Full') {
    return 'Full'
  }

  if (occupiedSeats >= seatCount) return 'Full'
  if (occupiedSeats > 0) return 'Limited'
  return 'Open'
}

async function reserveRoomSeat(roomId) {
  const room = await Room.findOneAndUpdate(
    {
      _id: roomId,
      status: { $nin: ['Maintenance', 'Unavailable'] },
      $expr: { $lt: ['$occupiedSeats', '$seatCount'] },
    },
    { $inc: { occupiedSeats: 1 } },
    { new: true },
  )

  if (!room) {
    throw new ApiError(400, 'Cannot approve application: room is full or unavailable')
  }

  room.status = deriveRoomStatus(room.seatCount, room.occupiedSeats, room.status)
  await room.save()
  return room
}

async function releaseRoomSeat(roomId) {
  const room = await Room.findByIdAndUpdate(
    roomId,
    { $inc: { occupiedSeats: -1 } },
    { new: true },
  )

  if (!room) return null
  room.occupiedSeats = Math.max(0, Math.min(room.seatCount, room.occupiedSeats))
  room.status = deriveRoomStatus(room.seatCount, room.occupiedSeats, room.status)
  await room.save()
  return room
}

function roomUpdatePayload(body = {}) {
  const seatCount = Math.max(1, Number(body.seatCount || 1))
  const availableSeats =
    body.availableSeats === undefined ? undefined : Math.max(0, Number(body.availableSeats || 0))
  const occupiedSeats =
    availableSeats === undefined
      ? Math.max(0, Math.min(Number(body.occupiedSeats || 0), seatCount))
      : Math.max(0, Math.min(seatCount - availableSeats, seatCount))
  const requestedStatus = normalizeRoomStatus(body.status)

  return {
    dorm: body.dorm,
    roomNumber: normalizeText(body.roomNumber),
    floor: normalizeText(body.floor) || 'Ground Floor',
    type: normalizeText(body.type) || 'Single Room',
    seatCount,
    occupiedSeats,
    priceMonthly: Math.max(0, Number(body.price || body.priceMonthly || 0)),
    amenities: normalizeList(body.amenities),
    status: deriveRoomStatus(seatCount, occupiedSeats, requestedStatus),
  }
}

function dormPayload(body = {}) {
  return {
    name: normalizeText(body.name || body.dormName),
    block: normalizeText(body.block) || 'General',
    address: normalizeText(body.address || body.location),
    description: normalizeText(body.description),
    facilities: normalizeList(body.facilities),
    rules: normalizeText(body.rules),
    priceRange: normalizeText(body.priceRange),
    status: normalizeDormStatus(body.status),
    managedBy: normalizeText(body.managedBy || body.assignedAdmin) || undefined,
  }
}

async function notify(userId, title, message, type = 'system') {
  try {
    await Notification.create({ user: userId, title, message, type })
  } catch {
    // intentionally non-blocking
  }
}

async function getDormAdminIds(dormId) {
  if (!dormId) return []

  const [dorm, assignedAdmins] = await Promise.all([
    Dorm.findById(dormId).select('managedBy').lean(),
    User.find({
      role: 'admin',
      accountStatus: { $ne: 'blocked' },
      assignedDorm: dormId,
    })
      .select('_id')
      .lean(),
  ])

  const adminIds = assignedAdmins.map((admin) => String(admin._id))
  if (dorm?.managedBy) adminIds.push(String(dorm.managedBy))

  return [...new Set(adminIds)]
}

async function notifyDormAdmins(dormId, title, message, type = 'payment') {
  const adminIds = await getDormAdminIds(dormId)
  await Promise.all(adminIds.map((adminId) => notify(adminId, title, message, type)))
}

async function buildDashboardStats() {
  const [
    totalDorms,
    totalDormAdmins,
    totalStudents,
    totalApplications,
    pendingApplications,
    approvedApplications,
    rejectedApplications,
    totalRooms,
    availableRooms,
    bookedRooms,
    pendingTransactions,
    approvedTransactions,
    pendingDocuments,
    totalComplaints,
    solvedComplaints,
  ] = await Promise.all([
    Dorm.countDocuments(),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ role: 'student' }),
    Application.countDocuments(),
    Application.countDocuments({ status: { $in: ['Pending', 'Under Review'] } }),
    Application.countDocuments({ status: 'Approved' }),
    Application.countDocuments({ status: 'Rejected' }),
    Room.countDocuments(),
    Room.countDocuments({ status: { $in: ['Open', 'Limited'] } }),
    Room.countDocuments({ status: 'Full' }),
    Transaction.countDocuments({ status: 'Pending' }),
    Transaction.countDocuments({ status: 'Approved' }),
    Document.countDocuments({ status: { $in: ['Pending', 'Needs Update'] } }),
    SupportTicket.countDocuments(),
    SupportTicket.countDocuments({ status: 'Resolved' }),
  ])

  return {
    totalDorms,
    totalDormAdmins,
    totalStudents,
    totalApplications,
    pendingApplications,
    approvedApplications,
    rejectedApplications,
    totalRooms,
    availableRooms,
    bookedRooms,
    pendingTransactions,
    approvedTransactions,
    pendingDocuments,
    totalComplaints,
    solvedComplaints,
  }
}

async function populateTransaction(transaction) {
  return transaction.populate([
    { path: 'student', select: 'name email studentId phone paymentStatus' },
    { path: 'application', select: 'status paymentStatus personalInfo preferences createdAt' },
    { path: 'dorm', select: 'name block address' },
    { path: 'room', select: 'roomNumber type priceMonthly' },
    { path: 'approvedBy', select: 'name email' },
    { path: 'rejectedBy', select: 'name email' },
  ])
}

async function syncAssignedDorm(adminId, dormId) {
  if (!adminId || !dormId) return

  await User.findByIdAndUpdate(adminId, { assignedDorm: dormId })
  await Dorm.findByIdAndUpdate(dormId, { managedBy: adminId })
}

export const getDashboardStats = asyncHandler(async (req, res) => {
  const stats = await buildDashboardStats()
  res.json({ success: true, stats })
})

export const getAllDorms = asyncHandler(async (req, res) => {
  const dorms = await Dorm.find()
    .populate('managedBy', 'name email phone accountStatus')
    .sort({ createdAt: -1 })
    .lean()

  const rooms = await Room.find({ dorm: { $in: dorms.map((dorm) => dorm._id) } }).lean()
  const roomsByDorm = rooms.reduce((acc, room) => {
    const key = String(room.dorm)
    if (!acc[key]) acc[key] = []
    acc[key].push(room)
    return acc
  }, {})

  const enriched = dorms.map((dorm) => {
    const dormRooms = roomsByDorm[String(dorm._id)] || []
    const prices = dormRooms.map((room) => Number(room.priceMonthly || 0)).filter((price) => price > 0)
    const computedRange = prices.length
      ? `BDT ${Math.min(...prices).toLocaleString()} - ${Math.max(...prices).toLocaleString()}`
      : ''

    return {
      ...dorm,
      location: dorm.address,
      assignedAdmin: dorm.managedBy,
      priceRange: dorm.priceRange || computedRange,
      roomCount: dormRooms.length,
    }
  })

  res.json({ success: true, dorms: enriched })
})

export const createDorm = asyncHandler(async (req, res) => {
  const payload = dormPayload(req.body)

  if (!payload.name || !payload.address) {
    throw new ApiError(400, 'Dorm name and location are required')
  }

  const dorm = await Dorm.create(payload)
  await syncAssignedDorm(payload.managedBy, dorm._id)

  res.status(201).json({ success: true, message: 'Dorm created', dorm })
})

export const updateDorm = asyncHandler(async (req, res) => {
  const payload = dormPayload(req.body)
  const dorm = await Dorm.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true,
  }).populate('managedBy', 'name email phone accountStatus')

  if (!dorm) {
    throw new ApiError(404, 'Dorm not found')
  }

  await syncAssignedDorm(payload.managedBy, dorm._id)
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

  await User.updateMany({ assignedDorm: dorm._id }, { $unset: { assignedDorm: '' } })
  await dorm.deleteOne()

  res.json({ success: true, message: 'Dorm deleted' })
})

export const updateDormStatus = asyncHandler(async (req, res) => {
  const status = normalizeDormStatus(req.body?.status)
  const dorm = await Dorm.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true })

  if (!dorm) {
    throw new ApiError(404, 'Dorm not found')
  }

  res.json({ success: true, message: 'Dorm status updated', dorm })
})

export const getAllDormAdmins = asyncHandler(async (req, res) => {
  const admins = await User.find({ role: 'admin' })
    .populate('assignedDorm', 'name block address')
    .sort({ createdAt: -1 })
    .lean()

  const managedDorms = await Dorm.find({ managedBy: { $in: admins.map((admin) => admin._id) } })
    .select('name block address managedBy')
    .lean()

  const dormByAdmin = managedDorms.reduce((acc, dorm) => {
    acc[String(dorm.managedBy)] = dorm
    return acc
  }, {})

  res.json({
    success: true,
    dormAdmins: admins.map((admin) => ({
      ...admin,
      assignedDorm: admin.assignedDorm || dormByAdmin[String(admin._id)] || null,
      status: admin.accountStatus === 'blocked' ? 'Blocked' : 'Active',
    })),
  })
})

export const createDormAdmin = asyncHandler(async (req, res) => {
  const name = normalizeText(req.body?.name)
  const email = normalizeText(req.body?.email).toLowerCase()
  const phone = normalizeText(req.body?.phone)
  const address = normalizeText(req.body?.address)
  const password = normalizeText(req.body?.password) || 'Admin123!'
  const assignedDorm = normalizeText(req.body?.assignedDorm)

  if (!name || !email) {
    throw new ApiError(400, 'Name and email are required')
  }

  const existing = await User.findOne({ email })
  if (existing) {
    throw new ApiError(409, 'Email already exists')
  }

  const admin = await User.create({
    name,
    email,
    password,
    phone,
    address,
    role: 'admin',
    accountStatus: normalizeAccountStatus(req.body?.accountStatus),
    assignedDorm: assignedDorm || undefined,
  })

  await syncAssignedDorm(admin._id, assignedDorm)

  res.status(201).json({ success: true, message: 'Dorm admin created', dormAdmin: withoutPassword(admin) })
})

export const updateDormAdmin = asyncHandler(async (req, res) => {
  const admin = await User.findOne({ _id: req.params.id, role: 'admin' }).select('+password')
  if (!admin) {
    throw new ApiError(404, 'Dorm admin not found')
  }

  const fields = ['name', 'email', 'phone', 'address']
  fields.forEach((field) => {
    if (req.body[field] !== undefined) {
      admin[field] = field === 'email' ? normalizeText(req.body[field]).toLowerCase() : normalizeText(req.body[field])
    }
  })

  if (req.body.accountStatus !== undefined || req.body.status !== undefined) {
    admin.accountStatus = normalizeAccountStatus(req.body.accountStatus || req.body.status)
  }

  if (req.body.assignedDorm !== undefined) {
    admin.assignedDorm = normalizeText(req.body.assignedDorm) || undefined
  }

  if (req.body.password) {
    admin.password = req.body.password
  }

  await admin.save()
  await syncAssignedDorm(admin._id, admin.assignedDorm)

  res.json({ success: true, message: 'Dorm admin updated', dormAdmin: withoutPassword(admin) })
})

export const updateDormAdminStatus = asyncHandler(async (req, res) => {
  const accountStatus = normalizeAccountStatus(req.body?.accountStatus || req.body?.status)
  const admin = await User.findOneAndUpdate(
    { _id: req.params.id, role: 'admin' },
    { accountStatus },
    { new: true, runValidators: true },
  )

  if (!admin) {
    throw new ApiError(404, 'Dorm admin not found')
  }

  res.json({ success: true, message: 'Dorm admin status updated', dormAdmin: admin })
})

export const deleteDormAdmin = asyncHandler(async (req, res) => {
  const admin = await User.findOne({ _id: req.params.id, role: 'admin' })
  if (!admin) {
    throw new ApiError(404, 'Dorm admin not found')
  }

  await Dorm.updateMany({ managedBy: admin._id }, { $unset: { managedBy: '' } })
  await admin.deleteOne()

  res.json({ success: true, message: 'Dorm admin deleted' })
})

export const getAllStudents = asyncHandler(async (req, res) => {
  const search = normalizeText(req.query?.search)
  const query = { role: 'student' }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { studentId: { $regex: search, $options: 'i' } },
    ]
  }

  const students = await User.find(query).sort({ createdAt: -1 }).lean()
  const studentIds = students.map((student) => student._id)
  const [applications, documents, transactions] = await Promise.all([
    Application.find({ student: { $in: studentIds } }).sort({ createdAt: -1 }).lean(),
    Document.find({ student: { $in: studentIds } }).sort({ createdAt: -1 }).lean(),
    Transaction.find({ student: { $in: studentIds } }).sort({ createdAt: -1 }).lean(),
  ])

  const latestByStudent = (items) =>
    items.reduce((acc, item) => {
      const key = String(item.student)
      if (!acc[key]) acc[key] = item
      return acc
    }, {})

  const applicationByStudent = latestByStudent(applications)
  const transactionByStudent = latestByStudent(transactions)
  const documentsByStudent = documents.reduce((acc, doc) => {
    const key = String(doc.student)
    if (!acc[key]) acc[key] = []
    acc[key].push(doc)
    return acc
  }, {})

  const enriched = students.map((student) => {
    const docs = documentsByStudent[String(student._id)] || []
    let documentStatus = 'Not Submitted'
    if (docs.some((doc) => doc.status === 'Pending' || doc.status === 'Needs Update')) documentStatus = 'Pending'
    else if (docs.some((doc) => doc.status === 'Rejected')) documentStatus = 'Rejected'
    else if (docs.length && docs.every((doc) => doc.status === 'Verified')) documentStatus = 'Verified'

    return {
      ...student,
      referenceId: student.studentId || String(student._id).slice(-8).toUpperCase(),
      applicationStatus: applicationByStudent[String(student._id)]?.status || 'No Application',
      paymentStatus:
        transactionByStudent[String(student._id)]?.status ||
        applicationByStudent[String(student._id)]?.paymentStatus ||
        student.paymentStatus ||
        'Not Submitted',
      documentStatus,
      accountStatus: student.accountStatus || 'active',
    }
  })

  res.json({ success: true, students: enriched })
})

export const updateStudentStatus = asyncHandler(async (req, res) => {
  const accountStatus = normalizeAccountStatus(req.body?.accountStatus || req.body?.status)
  const student = await User.findOneAndUpdate(
    { _id: req.params.id, role: 'student' },
    { accountStatus },
    { new: true, runValidators: true },
  )

  if (!student) {
    throw new ApiError(404, 'Student not found')
  }

  res.json({ success: true, message: 'Student status updated', student })
})

export const getAllApplications = asyncHandler(async (req, res) => {
  const { status } = req.query
  const search = normalizeText(req.query?.search).toLowerCase()
  const query = {}
  if (status && status !== 'All') query.status = status

  const applications = await Application.find(query)
    .populate('student', 'name email studentId phone')
    .populate('dorm', 'name block address')
    .populate('room', 'roomNumber type priceMonthly seatCount occupiedSeats status')
    .sort({ createdAt: -1 })
    .lean()

  const filtered = search
    ? applications.filter((application) => {
        const reference = String(application._id).toLowerCase()
        const studentName = String(application.student?.name || '').toLowerCase()
        const studentId = String(application.student?.studentId || '').toLowerCase()
        const dormName = String(application.dorm?.name || '').toLowerCase()
        return (
          reference.includes(search) ||
          studentName.includes(search) ||
          studentId.includes(search) ||
          dormName.includes(search)
        )
      })
    : applications

  res.json({ success: true, applications: filtered })
})

export const updateApplicationDecision = asyncHandler(async (req, res) => {
  const { status, adminNote = '' } = req.body
  const allowedStatuses = ['Pending', 'Under Review', 'Approved', 'Rejected', 'Waitlisted', 'Re-upload Requested', 'Cancelled']

  if (!allowedStatuses.includes(status)) {
    throw new ApiError(400, `Invalid status. Allowed: ${allowedStatuses.join(', ')}`)
  }

  const application = await Application.findById(req.params.id)
  if (!application) {
    throw new ApiError(404, 'Application not found')
  }

  const previousStatus = application.status
  let freedRoomId = ''

  if (status === 'Approved' && !application.room) {
    throw new ApiError(400, 'Cannot approve application without an assigned room')
  }

  if (previousStatus !== 'Approved' && status === 'Approved' && application.room) {
    await reserveRoomSeat(application.room)
  }

  if (previousStatus === 'Approved' && status !== 'Approved' && application.room) {
    const room = await releaseRoomSeat(application.room)
    if (room) freedRoomId = room._id
  }

  application.status = status
  application.adminNote = normalizeText(adminNote)
  await application.save()

  if (status === 'Approved') {
    await cancelOtherActiveApplicationsForStudent(application)
  }

  await notify(application.student, 'Application Updated', `Your application status is now ${status}.`, 'application')

  await application.populate([
    { path: 'student', select: 'name email studentId phone' },
    { path: 'dorm', select: 'name block address' },
    { path: 'room', select: 'roomNumber type priceMonthly seatCount occupiedSeats status' },
  ])

  const promotedApplications = freedRoomId
    ? await promoteWaitlistedApplicantsForRoom(freedRoomId, {
        excludeApplicationIds: [application._id],
      })
    : []

  res.json({
    success: true,
    message: promotedApplications.length
      ? `Application updated. ${promotedApplications.length} waitlisted applicant promoted.`
      : 'Application updated',
    application,
    promotedApplications,
  })
})

export const getAllRooms = asyncHandler(async (req, res) => {
  const rooms = await Room.find()
    .populate('dorm', 'name block address')
    .sort({ createdAt: -1 })

  res.json({ success: true, rooms })
})

export const createRoom = asyncHandler(async (req, res) => {
  const payload = roomUpdatePayload(req.body)

  if (!payload.dorm || !payload.roomNumber) {
    throw new ApiError(400, 'Dorm and room number are required')
  }

  const dorm = await Dorm.findById(payload.dorm)
  if (!dorm) {
    throw new ApiError(404, 'Dorm not found')
  }

  const room = await Room.create(payload)
  await room.populate('dorm', 'name block address')
  const promotedApplications = await promoteWaitlistedApplicantsForRoom(room._id)

  res.status(201).json({
    success: true,
    message: promotedApplications.length
      ? `Room created. ${promotedApplications.length} waitlisted applicant promoted.`
      : 'Room created',
    room,
    promotedApplications,
  })
})

export const updateRoom = asyncHandler(async (req, res) => {
  const currentRoom = await Room.findById(req.params.id)
  if (!currentRoom) {
    throw new ApiError(404, 'Room not found')
  }

  const payload = roomUpdatePayload({
    ...currentRoom.toObject(),
    ...req.body,
  })

  const room = await Room.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true,
  }).populate('dorm', 'name block address')
  const promotedApplications = await promoteWaitlistedApplicantsForRoom(room._id)

  res.json({
    success: true,
    message: promotedApplications.length
      ? `Room updated. ${promotedApplications.length} waitlisted applicant promoted.`
      : 'Room updated',
    room,
    promotedApplications,
  })
})

export const deleteRoom = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id)
  if (!room) {
    throw new ApiError(404, 'Room not found')
  }

  await room.deleteOne()
  res.json({ success: true, message: 'Room deleted' })
})

export const getAllTransactions = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find()
    .populate('student', 'name email studentId phone paymentStatus')
    .populate('application', 'status paymentStatus personalInfo preferences createdAt')
    .populate('dorm', 'name block address')
    .populate('room', 'roomNumber type priceMonthly')
    .populate('approvedBy', 'name email')
    .populate('rejectedBy', 'name email')
    .sort({ createdAt: -1 })

  res.json({ success: true, transactions })
})

export const getSingleTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findById(req.params.id)
  if (!transaction) {
    throw new ApiError(404, 'Transaction not found')
  }

  const populated = await populateTransaction(transaction)
  res.json({ success: true, transaction: populated })
})

export const approveTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findById(req.params.id)
  if (!transaction) {
    throw new ApiError(404, 'Transaction not found')
  }

  transaction.status = 'Approved'
  transaction.approvedBy = req.user.id
  transaction.approvedAt = new Date()
  transaction.rejectedBy = undefined
  transaction.rejectedAt = undefined
  transaction.rejectionReason = ''
  await transaction.save()

  await Promise.all([
    Application.findByIdAndUpdate(transaction.application, { paymentStatus: 'Approved' }),
    User.findByIdAndUpdate(transaction.student, { paymentStatus: 'Approved' }),
  ])

  const [student, dorm] = await Promise.all([
    User.findById(transaction.student).select('name email').lean(),
    transaction.dorm ? Dorm.findById(transaction.dorm).select('name').lean() : null,
  ])

  await Promise.all([
    notify(transaction.student, 'Payment Approved', 'Your submitted payment has been approved.', 'payment'),
    notifyDormAdmins(
      transaction.dorm,
      'Student Payment Approved',
      `${student?.name || 'A student'} payment for ${
        dorm?.name || 'your dorm'
      } was approved by super admin. Transaction ID: ${transaction.transactionId}.`,
      'payment',
    ),
  ])

  const populated = await populateTransaction(transaction)
  res.json({ success: true, message: 'Transaction approved successfully', transaction: populated })
})

export const rejectTransaction = asyncHandler(async (req, res) => {
  const rejectionReason = normalizeText(req.body?.rejectionReason)
  if (!rejectionReason) {
    throw new ApiError(400, 'Rejection reason is required')
  }

  const transaction = await Transaction.findById(req.params.id)
  if (!transaction) {
    throw new ApiError(404, 'Transaction not found')
  }

  transaction.status = 'Rejected'
  transaction.rejectedBy = req.user.id
  transaction.rejectedAt = new Date()
  transaction.approvedBy = undefined
  transaction.approvedAt = undefined
  transaction.rejectionReason = rejectionReason
  await transaction.save()

  await Promise.all([
    Application.findByIdAndUpdate(transaction.application, { paymentStatus: 'Rejected' }),
    User.findByIdAndUpdate(transaction.student, { paymentStatus: 'Rejected' }),
  ])

  await notify(transaction.student, 'Payment Rejected', `Your submitted payment was rejected: ${rejectionReason}`, 'payment')

  const populated = await populateTransaction(transaction)
  res.json({ success: true, message: 'Transaction rejected successfully', transaction: populated })
})

export const getAllDocuments = asyncHandler(async (req, res) => {
  const documents = await Document.find()
    .populate('student', 'name email studentId phone')
    .populate('application', 'status paymentStatus')
    .populate('reviewedBy', 'name email')
    .sort({ createdAt: -1 })

  res.json({ success: true, documents })
})

export const verifyDocument = asyncHandler(async (req, res) => {
  const document = await Document.findByIdAndUpdate(
    req.params.id,
    { status: 'Verified', reviewNote: normalizeText(req.body?.reviewNote), reviewedBy: req.user.id },
    { new: true, runValidators: true },
  ).populate('student', 'name email studentId phone')

  if (!document) {
    throw new ApiError(404, 'Document not found')
  }

  await notify(document.student?._id || document.student, 'Document Verified', `${document.category} has been verified.`, 'document')
  res.json({ success: true, message: 'Document verified', document })
})

export const rejectDocument = asyncHandler(async (req, res) => {
  const rejectionReason = normalizeText(req.body?.rejectionReason || req.body?.reviewNote)
  if (!rejectionReason) {
    throw new ApiError(400, 'Rejection reason is required')
  }

  const document = await Document.findByIdAndUpdate(
    req.params.id,
    { status: 'Rejected', reviewNote: rejectionReason, reviewedBy: req.user.id },
    { new: true, runValidators: true },
  ).populate('student', 'name email studentId phone')

  if (!document) {
    throw new ApiError(404, 'Document not found')
  }

  await notify(document.student?._id || document.student, 'Document Rejected', `${document.category} was rejected: ${rejectionReason}`, 'document')
  res.json({ success: true, message: 'Document rejected', document })
})

export const getAllComplaints = asyncHandler(async (req, res) => {
  const complaints = await SupportTicket.find()
    .populate('student', 'name email studentId phone')
    .populate('messages.sender', 'name email role')
    .sort({ createdAt: -1 })

  res.json({ success: true, complaints })
})

export const replyComplaint = asyncHandler(async (req, res) => {
  const text = normalizeText(req.body?.reply || req.body?.text)
  if (!text) {
    throw new ApiError(400, 'Reply is required')
  }

  const complaint = await SupportTicket.findById(req.params.id)
  if (!complaint) {
    throw new ApiError(404, 'Complaint not found')
  }

  complaint.messages.push({ sender: req.user.id, text })
  complaint.status = complaint.status === 'Resolved' ? 'Resolved' : 'Pending'
  await complaint.save()

  await notify(complaint.student, 'Complaint Reply Received', 'The super admin replied to your complaint.', 'support')

  await complaint.populate(['student', 'messages.sender'])
  res.json({ success: true, message: 'Reply sent', complaint })
})

export const solveComplaint = asyncHandler(async (req, res) => {
  const complaint = await SupportTicket.findByIdAndUpdate(
    req.params.id,
    { status: 'Resolved', resolvedAt: new Date() },
    { new: true, runValidators: true },
  ).populate('student', 'name email studentId phone')

  if (!complaint) {
    throw new ApiError(404, 'Complaint not found')
  }

  await notify(complaint.student?._id || complaint.student, 'Complaint Solved', 'Your complaint was marked as solved.', 'support')
  res.json({ success: true, message: 'Complaint marked solved', complaint })
})

export const getAllFeedback = asyncHandler(async (req, res) => {
  const feedback = await Review.find()
    .populate('student', 'name email studentId')
    .populate('dorm', 'name block')
    .populate('room', 'roomNumber type')
    .sort({ createdAt: -1 })

  res.json({ success: true, feedback })
})

export const deleteFeedback = asyncHandler(async (req, res) => {
  const feedback = await Review.findById(req.params.id)
  if (!feedback) {
    throw new ApiError(404, 'Feedback not found')
  }

  await feedback.deleteOne()
  res.json({ success: true, message: 'Feedback deleted' })
})
