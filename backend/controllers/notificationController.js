import { Notification } from '../models/Notification.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/apiError.js'

export const listNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(50)

  res.json({ success: true, notifications })
})

export const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { read: true },
    { new: true },
  )

  if (!notification) {
    throw new ApiError(404, 'Notification not found')
  }

  res.json({ success: true, notification })
})
