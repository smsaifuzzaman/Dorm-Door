import { Router } from 'express'
import {
  approveCatalogRequest,
  createCatalogRequest,
  listCatalogRequests,
  rejectCatalogRequest,
} from '../controllers/catalogRequestController.js'
import { authorize, protect } from '../middleware/auth.js'
import { uploadCatalogImages } from '../middleware/upload.js'

const router = Router()

router.use(protect)

router.get('/', authorize('admin', 'superAdmin'), listCatalogRequests)
router.post('/', authorize('admin'), uploadCatalogImages, createCatalogRequest)
router.patch('/:id/approve', authorize('superAdmin'), approveCatalogRequest)
router.patch('/:id/reject', authorize('superAdmin'), rejectCatalogRequest)

export default router
