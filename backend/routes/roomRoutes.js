import { Router } from 'express'
import {
  createRoom,
  deleteRoom,
  getRoomById,
  listRooms,
  updateRoom,
} from '../controllers/roomController.js'
import { authorize, protect } from '../middleware/auth.js'
import { uploadCatalogImages } from '../middleware/upload.js'

const router = Router()

router.get('/', listRooms)
router.get('/:id', getRoomById)
router.post('/', protect, authorize('admin'), uploadCatalogImages, createRoom)
router.patch('/:id', protect, authorize('admin'), updateRoom)
router.delete('/:id', protect, authorize('admin'), deleteRoom)

export default router
