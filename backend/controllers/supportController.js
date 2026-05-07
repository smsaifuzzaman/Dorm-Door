import { SupportTicket } from '../models/SupportTicket.js'
import { Notification } from '../models/Notification.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/apiError.js'

async function notify(userId, title, message) {
  try {
    await Notification.create({ user: userId, title, message, type: 'support' })
  } catch {
    // intentionally non-blocking
  }
}

function normalizeText(value) {
  return String(value || '').trim()
}

function attachmentFromFile(file) {
  if (!file) return []
  return [
    {
      fileName: normalizeText(file.originalname),
      mimeType: normalizeText(file.mimetype),
      sizeBytes: Number(file.size) || 0,
      storageType: 'upload',
    },
  ]
}

export const createSupportTicket = asyncHandler(async (req, res) => {
  const { subject, description, priority = 'Medium' } = req.body
  const attachments = attachmentFromFile(req.file)

  if (!subject || !description) {
    throw new ApiError(400, 'subject and description are required')
  }

  const ticket = await SupportTicket.create({
    student: req.user.id,
    subject,
    description,
    priority,
    messages: [
      {
        sender: req.user.id,
        text: normalizeText(description),
        attachments,
      },
    ],
  })

  res.status(201).json({
    success: true,
    message: 'Support ticket created',
    ticket,
  })
})

export const listSupportTickets = asyncHandler(async (req, res) => {
  const query = {}
  if (req.user.role === 'student') {
    query.student = req.user.id
  }

  const tickets = await SupportTicket.find(query)
    .populate('student', 'name email studentId')
    .populate('assignedTo', 'name email')
    .populate('messages.sender', 'name role')
    .sort({ updatedAt: -1 })

  res.json({ success: true, tickets })
})

export const addSupportMessage = asyncHandler(async (req, res) => {
  const text = normalizeText(req.body?.text)
  const attachments = attachmentFromFile(req.file)
  if (!text && attachments.length === 0) {
    throw new ApiError(400, 'text or attachment is required')
  }

  const ticket = await SupportTicket.findById(req.params.id)
  if (!ticket) {
    throw new ApiError(404, 'Support ticket not found')
  }

  if (req.user.role === 'student' && String(ticket.student) !== req.user.id) {
    throw new ApiError(403, 'Not allowed to access this ticket')
  }

  ticket.messages.push({
    sender: req.user.id,
    text,
    attachments,
  })

  await ticket.save()

  await notify(ticket.student, 'Support Reply Received', 'A new message was posted on your support ticket.')

  const populated = await ticket.populate(['student', 'assignedTo', 'messages.sender'])

  res.json({
    success: true,
    message: 'Message added',
    ticket: populated,
  })
})

export const updateSupportTicket = asyncHandler(async (req, res) => {
  const { status, priority, assignedTo } = req.body
  const ticket = await SupportTicket.findById(req.params.id)

  if (!ticket) {
    throw new ApiError(404, 'Support ticket not found')
  }

  if (status) {
    ticket.status = status
    if (status === 'Resolved') {
      ticket.resolvedAt = new Date()
    }
  }

  if (priority) ticket.priority = priority
  if (assignedTo) ticket.assignedTo = assignedTo

  await ticket.save()

  await notify(ticket.student, 'Support Ticket Updated', `Ticket status is now ${ticket.status}.`)

  res.json({
    success: true,
    message: 'Support ticket updated',
    ticket,
  })
})
