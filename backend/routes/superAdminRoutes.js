import { Router } from 'express'
import {
  approveTransaction,
  createDorm,
  createDormAdmin,
  deleteDorm,
  deleteDormAdmin,
  getAllApplications,
  getAllComplaints,
  getAllDocuments,
  getAllDormAdmins,
  getAllDorms,
  getAllStudents,
  getAllTransactions,
  getDashboardStats,
  getSingleTransaction,
  rejectDocument,
  rejectTransaction,
  replyComplaint,
  solveComplaint,
  updateApplicationDecision,
  updateDorm,
  updateDormAdmin,
  updateDormAdminStatus,
  updateDormStatus,
  updateStudentStatus,
  verifyDocument,
} from '../controllers/superAdminController.js'
import { authorize, protect } from '../middleware/auth.js'

const router = Router()

router.use(protect)
router.use(authorize('superAdmin'))

router.get('/dashboard', getDashboardStats)

router.get('/dorms', getAllDorms)
router.post('/dorms', createDorm)
router.patch('/dorms/:id', updateDorm)
router.patch('/dorms/:id/status', updateDormStatus)
router.delete('/dorms/:id', deleteDorm)

router.get('/dorm-admins', getAllDormAdmins)
router.post('/dorm-admins', createDormAdmin)
router.patch('/dorm-admins/:id', updateDormAdmin)
router.patch('/dorm-admins/:id/status', updateDormAdminStatus)
router.delete('/dorm-admins/:id', deleteDormAdmin)

router.get('/students', getAllStudents)
router.patch('/students/:id/status', updateStudentStatus)

router.get('/applications', getAllApplications)
router.patch('/applications/:id/status', updateApplicationDecision)
router.patch('/applications/:id/approve', (req, res, next) => {
  req.body = { ...req.body, status: 'Approved' }
  updateApplicationDecision(req, res, next)
})
router.patch('/applications/:id/reject', (req, res, next) => {
  req.body = { ...req.body, status: 'Rejected' }
  updateApplicationDecision(req, res, next)
})
router.patch('/applications/:id/waitlist', (req, res, next) => {
  req.body = { ...req.body, status: 'Waitlisted' }
  updateApplicationDecision(req, res, next)
})

router.get('/transactions', getAllTransactions)
router.get('/transactions/:id', getSingleTransaction)
router.patch('/transactions/:id/approve', approveTransaction)
router.patch('/transactions/:id/reject', rejectTransaction)

router.get('/documents', getAllDocuments)
router.patch('/documents/:id/verify', verifyDocument)
router.patch('/documents/:id/reject', rejectDocument)

router.get('/complaints', getAllComplaints)
router.patch('/complaints/:id/reply', replyComplaint)
router.patch('/complaints/:id/solve', solveComplaint)

export default router
