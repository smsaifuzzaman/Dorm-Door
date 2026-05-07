import { Router } from 'express'
import {
  changePassword,
  getProfile,
  updateProfile,
  uploadProfileImage,
} from '../controllers/profileController.js'
import { protect } from '../middleware/auth.js'
import { uploadProfilePng } from '../middleware/upload.js'

const router = Router()

router.use(protect)

router.get('/', getProfile)
router.patch('/', updateProfile)
router.post('/avatar', uploadProfilePng, uploadProfileImage)
router.patch('/password', changePassword)

export default router
