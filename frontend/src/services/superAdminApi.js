import { api } from '../api/client'

const base = '/super-admin'

export const getDashboardStats = () => api.get(`${base}/dashboard`)

export const getDorms = () => api.get(`${base}/dorms`)
export const createDorm = (payload) => api.post(`${base}/dorms`, payload)
export const updateDorm = (id, payload) => api.patch(`${base}/dorms/${id}`, payload)
export const updateDormStatus = (id, status) => api.patch(`${base}/dorms/${id}/status`, { status })
export const deleteDorm = (id) => api.delete(`${base}/dorms/${id}`)

export const getDormAdmins = () => api.get(`${base}/dorm-admins`)
export const createDormAdmin = (payload) => api.post(`${base}/dorm-admins`, payload)
export const updateDormAdmin = (id, payload) => api.patch(`${base}/dorm-admins/${id}`, payload)
export const updateDormAdminStatus = (id, status) =>
  api.patch(`${base}/dorm-admins/${id}/status`, { accountStatus: status })
export const deleteDormAdmin = (id) => api.delete(`${base}/dorm-admins/${id}`)

export const getStudents = (params = {}) => api.get(`${base}/students`, { params })
export const updateStudentStatus = (id, status) =>
  api.patch(`${base}/students/${id}/status`, { accountStatus: status })

export const getApplications = (params = {}) => api.get(`${base}/applications`, { params })
export const updateApplicationStatus = (id, status, adminNote = '') =>
  api.patch(`${base}/applications/${id}/status`, { status, adminNote })
export const approveApplication = (id, adminNote = '') =>
  api.patch(`${base}/applications/${id}/approve`, { adminNote })
export const rejectApplication = (id, adminNote = '') =>
  api.patch(`${base}/applications/${id}/reject`, { adminNote })
export const waitlistApplication = (id, adminNote = '') =>
  api.patch(`${base}/applications/${id}/waitlist`, { adminNote })

export const getCatalogRequests = () => api.get('/catalog-requests')
export const approveCatalogRequest = (id, adminNote = '') =>
  api.patch(`/catalog-requests/${id}/approve`, { adminNote })
export const rejectCatalogRequest = (id, adminNote = '') =>
  api.patch(`/catalog-requests/${id}/reject`, { adminNote })

export const getTransactions = () => api.get(`${base}/transactions`)
export const getTransaction = (id) => api.get(`${base}/transactions/${id}`)
export const approveTransaction = (id) => api.patch(`${base}/transactions/${id}/approve`)
export const rejectTransaction = (id, rejectionReason) =>
  api.patch(`${base}/transactions/${id}/reject`, { rejectionReason })

export const getDocuments = () => api.get(`${base}/documents`)
export const verifyDocument = (id, reviewNote = '') =>
  api.patch(`${base}/documents/${id}/verify`, { reviewNote })
export const rejectDocument = (id, rejectionReason) =>
  api.patch(`${base}/documents/${id}/reject`, { rejectionReason })

export const getComplaints = () => api.get(`${base}/complaints`)
export const replyComplaint = (id, reply) => api.patch(`${base}/complaints/${id}/reply`, { reply })
export const solveComplaint = (id) => api.patch(`${base}/complaints/${id}/solve`)

export default {
  getDashboardStats,
  getDorms,
  createDorm,
  updateDorm,
  updateDormStatus,
  deleteDorm,
  getDormAdmins,
  createDormAdmin,
  updateDormAdmin,
  updateDormAdminStatus,
  deleteDormAdmin,
  getStudents,
  updateStudentStatus,
  getApplications,
  updateApplicationStatus,
  approveApplication,
  rejectApplication,
  waitlistApplication,
  getCatalogRequests,
  approveCatalogRequest,
  rejectCatalogRequest,
  getTransactions,
  getTransaction,
  approveTransaction,
  rejectTransaction,
  getDocuments,
  verifyDocument,
  rejectDocument,
  getComplaints,
  replyComplaint,
  solveComplaint,
}
