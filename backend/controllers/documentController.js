import { Application } from '../models/Application.js'
import { Document } from '../models/Document.js'
import { Notification } from '../models/Notification.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/apiError.js'
import { normalizeHttpUrl } from '../utils/url.js'

async function notify(userId, title, message, type) {
  try {
    await Notification.create({ user: userId, title, message, type })
  } catch {
    // intentionally non-blocking
  }
}

function normalizeText(value) {
  return String(value || '').trim()
}

export const listDocuments = asyncHandler(async (req, res) => {
  const query = {}
  if (req.user.role === 'student' || req.user.role === 'admin') {
    query.student = req.user.id
  }

  const documents = await Document.find(query)
    .populate('student', 'name email studentId profileImage')
    .populate('application', 'status dorm room')
    .sort({ createdAt: -1 })

  res.json({ success: true, documents })
})

export const uploadDocumentMetadata = asyncHandler(async (req, res) => {
  const category = normalizeText(req.body?.category) || 'Other'
  const applicationId = normalizeText(req.body?.application)
  const incomingFile = req.file

  let fileName = normalizeText(req.body?.fileName)
  let fileUrl = ''
  let storageType = 'url'
  let mimeType = ''
  let sizeBytes = 0

  if (incomingFile) {
    fileName = normalizeText(incomingFile.originalname) || fileName
    if (!fileName) {
      throw new ApiError(400, 'Uploaded file name is missing')
    }

    storageType = 'upload'
    mimeType = normalizeText(incomingFile.mimetype)
    sizeBytes = Number(incomingFile.size) || 0
  } else {
    if (!fileName) {
      throw new ApiError(400, 'fileName is required')
    }

    fileUrl = normalizeHttpUrl(req.body?.fileUrl, 'fileUrl')
  }

  let ownerStudentId = req.user.id
  let application = undefined
  if (applicationId) {
    const applicationDoc = await Application.findById(applicationId).select('student')
    if (!applicationDoc) {
      throw new ApiError(404, 'Application not found')
    }

    if (req.user.role === 'student' && String(applicationDoc.student) !== req.user.id) {
      throw new ApiError(403, 'You can only attach documents to your own applications')
    }

    ownerStudentId = String(applicationDoc.student)
    application = applicationDoc._id
  }

  const existingActiveDocument = await Document.findOne({
    student: ownerStudentId,
    category,
    status: { $ne: 'Rejected' },
  })
    .sort({ createdAt: -1 })
    .select('status')
    .lean()

  if (existingActiveDocument) {
    throw new ApiError(
      409,
      `A ${category} document is already ${existingActiveDocument.status}. Wait for rejection before uploading another one.`,
    )
  }

  const doc = await Document.create({
    student: ownerStudentId,
    application,
    category,
    fileName,
    fileUrl,
    storageType,
    mimeType,
    sizeBytes,
  })

  await notify(ownerStudentId, 'Document Uploaded', `${fileName} uploaded successfully.`, 'document')

  res.status(201).json({
    success: true,
    message: 'Document metadata saved',
    document: doc,
  })
})

export const reviewDocument = asyncHandler(async (req, res) => {
  const status = normalizeText(req.body?.status)
  const reviewNote = normalizeText(req.body?.reviewNote)

  const allowed = ['Pending', 'Verified', 'Rejected', 'Needs Update']
  if (!allowed.includes(status)) {
    throw new ApiError(400, `Invalid status. Allowed: ${allowed.join(', ')}`)
  }

  const doc = await Document.findById(req.params.id)
  if (!doc) {
    throw new ApiError(404, 'Document not found')
  }

  const previousStatus = doc.status
  doc.status = status
  doc.reviewNote = reviewNote
  doc.reviewedBy = req.user.id
  await doc.save()

  if (previousStatus !== status) {
    const statusTitle = {
      Verified: 'Document Approved',
      Rejected: 'Document Rejected',
      'Needs Update': 'Document Update Requested',
      Pending: 'Document Marked Pending',
    }[status] || 'Document Review Update'

    const statusMessage = {
      Verified: `${doc.category} (${doc.fileName}) is verified.`,
      Rejected: `${doc.category} (${doc.fileName}) was rejected.`,
      'Needs Update': `${doc.category} (${doc.fileName}) needs re-upload.`,
      Pending: `${doc.category} (${doc.fileName}) is pending review.`,
    }[status] || `Your document ${doc.fileName} is now ${status}.`

    await notify(doc.student, statusTitle, statusMessage, 'document')
  }

  res.json({
    success: true,
    message: 'Document status updated',
    document: doc,
  })
})
