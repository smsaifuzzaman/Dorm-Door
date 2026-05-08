import { Router } from 'express'
import {
  createDorm,
  deleteDorm,
  getDormById,
  listDorms,
  updateDorm,
} from '../controllers/dormController.js'
import { authorize, protect } from '../middleware/auth.js'
import { uploadCatalogImages } from '../middleware/upload.js'

const router = Router()

router.get('/', listDorms)
router.get('/:id', getDormById)
router.post('/', protect, authorize('admin'), uploadCatalogImages, createDorm)
router.patch('/:id', protect, authorize('admin'), updateDorm)
router.delete('/:id', protect, authorize('admin'), deleteDorm)

export default router
