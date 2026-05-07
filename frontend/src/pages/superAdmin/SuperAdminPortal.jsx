import { Navigate, Route, Routes } from 'react-router-dom'
import ApplicationManagement from './ApplicationManagement'
import ComplaintManagement from './ComplaintManagement'
import DocumentVerification from './DocumentVerification'
import DormAdminManagement from './DormAdminManagement'
import DormManagement from './DormManagement'
import StudentManagement from './StudentManagement'
import SuperAdminDashboard from './SuperAdminDashboard'
import TransactionManagement from './TransactionManagement'

function SuperAdminPortal() {
  return (
    <Routes>
      <Route index element={<Navigate to="/super-admin/dashboard" replace />} />
      <Route path="dashboard" element={<SuperAdminDashboard />} />
      <Route path="dorms" element={<DormManagement />} />
      <Route path="dorm-admins" element={<DormAdminManagement />} />
      <Route path="students" element={<StudentManagement />} />
      <Route path="applications" element={<ApplicationManagement />} />
      <Route path="transactions" element={<TransactionManagement />} />
      <Route path="documents" element={<DocumentVerification />} />
      <Route path="complaints" element={<ComplaintManagement />} />
      <Route path="*" element={<Navigate to="/super-admin/dashboard" replace />} />
    </Routes>
  )
}

export default SuperAdminPortal
