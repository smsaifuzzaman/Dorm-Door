import { Router } from 'express'
import {
  addSupportMessage,
  createSupportTicket,
  listSupportTickets,
  updateSupportTicket,
} from '../controllers/supportController.js'
import { authorize, protect } from '../middleware/auth.js'
import { uploadDocumentFile } from '../middleware/upload.js'

const router = Router()

router.use(protect)

router.get('/', listSupportTickets)
router.post('/', uploadDocumentFile, createSupportTicket)
router.post('/:id/messages', uploadDocumentFile, addSupportMessage)
router.patch('/:id', authorize('admin'), updateSupportTicket)

export default router
