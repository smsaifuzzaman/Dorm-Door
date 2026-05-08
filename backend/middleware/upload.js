import multer from 'multer'
import path from 'path'
import { ApiError } from '../utils/apiError.js'

const MAX_DOCUMENT_FILE_SIZE = 10 * 1024 * 1024
const MAX_PROFILE_IMAGE_FILE_SIZE = 3 * 1024 * 1024

const allowedMimeTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
])

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_DOCUMENT_FILE_SIZE,
    files: 1,
  },
  fileFilter(req, file, callback) {
    const mimeType = String(file?.mimetype || '').toLowerCase()
    const isAllowed = allowedMimeTypes.has(mimeType) || mimeType.startsWith('image/')

    if (!isAllowed) {
      callback(new ApiError(400, 'Unsupported file type. Upload PDF or image files only.'))
      return
    }

    callback(null, true)
  },
})

const profileImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_PROFILE_IMAGE_FILE_SIZE,
    files: 1,
  },
  fileFilter(req, file, callback) {
    const mimeType = String(file?.mimetype || '').toLowerCase()
    const extension = path.extname(String(file?.originalname || '')).toLowerCase()

    if (mimeType !== 'image/png' || extension !== '.png') {
      callback(new ApiError(400, 'Only PNG profile pictures are allowed.'))
      return
    }

    callback(null, true)
  },
})

export function uploadDocumentFile(req, res, next) {
  upload.single('file')(req, res, (error) => {
    if (!error) {
      next()
      return
    }

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        next(new ApiError(400, 'File size exceeds 10MB limit'))
        return
      }

      next(new ApiError(400, error.message || 'File upload failed'))
      return
    }

    next(error)
  })
}

export function uploadProfilePng(req, res, next) {
  profileImageUpload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'avatar', maxCount: 1 },
  ])(req, res, (error) => {
    if (!error) {
      req.file = req.files?.profileImage?.[0] || req.files?.avatar?.[0] || null
      next()
      return
    }

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        next(new ApiError(400, 'Profile picture exceeds 3MB limit'))
        return
      }

      next(new ApiError(400, error.message || 'Profile picture upload failed'))
      return
    }

    next(error)
  })
}
