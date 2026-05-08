import { Router } from 'express'
import { createTransaction, listTransactions } from '../controllers/transactionController.js'
import { authorize, protect } from '../middleware/auth.js'
import { uploadDocumentFile } from '../middleware/upload.js'

const router = Router()

router.use(protect)

router.get('/', listTransactions)
router.post('/', authorize('student'), uploadDocumentFile, createTransaction)

export default router
