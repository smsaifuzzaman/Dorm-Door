import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { User } from '../models/User.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/apiError.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const profileImageDir = path.resolve(__dirname, '../uploads/profile-images')
const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

function hasPngSignature(buffer) {
  if (!buffer || buffer.length < pngSignature.length) return false
  return pngSignature.every((byte, index) => buffer[index] === byte)
}

export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
  if (!user) {
    throw new ApiError(404, 'User not found')
  }

  res.json({ success: true, user })
})

export const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = [
    'name',
    'gender',
    'phone',
    'department',
    'university',
    'address',
    'profileImage',
    'emergencyContact',
    'settings',
  ]

  const updates = {}
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field]
    }
  }

  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true,
  })

  if (!user) {
    throw new ApiError(404, 'User not found')
  }

  res.json({
    success: true,
    message: 'Profile updated',
    user,
  })
})

export const uploadProfileImage = asyncHandler(async (req, res) => {
  const file = req.file

  if (!file) {
    throw new ApiError(400, 'Please upload a PNG profile picture.')
  }

  if (String(file.mimetype || '').toLowerCase() !== 'image/png' || !hasPngSignature(file.buffer)) {
    throw new ApiError(400, 'Only PNG profile pictures are allowed.')
  }

  await fs.promises.mkdir(profileImageDir, { recursive: true })

  const fileName = `profile-${req.user.id}-${Date.now()}.png`
  const filePath = path.join(profileImageDir, fileName)
  await fs.promises.writeFile(filePath, file.buffer)

  const profileImage = `${req.protocol}://${req.get('host')}/uploads/profile-images/${fileName}`
  const user = await User.findByIdAndUpdate(req.user.id, { profileImage }, {
    new: true,
    runValidators: true,
  })

  if (!user) {
    throw new ApiError(404, 'User not found')
  }

  res.json({
    success: true,
    message: 'Profile picture updated',
    profileImage,
    user,
  })
})

export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body

  if (!oldPassword || !newPassword) {
    throw new ApiError(400, 'oldPassword and newPassword are required')
  }

  const user = await User.findById(req.user.id).select('+password')
  if (!user) {
    throw new ApiError(404, 'User not found')
  }

  const valid = await user.comparePassword(oldPassword)
  if (!valid) {
    throw new ApiError(400, 'Old password is incorrect')
  }

  user.password = newPassword
  await user.save()

  res.json({
    success: true,
    message: 'Password updated successfully',
  })
})
