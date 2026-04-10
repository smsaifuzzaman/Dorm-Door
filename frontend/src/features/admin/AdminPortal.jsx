import { Navigate, Route, Routes } from 'react-router-dom'
import OverviewPage from './pages/OverviewPage'
import DormsPage from './pages/DormsPage'
import ApplicationsPage from './pages/ApplicationsPage'
import DocumentsPage from './pages/DocumentsPage'
import AvailabilityPage from './pages/AvailabilityPage'
import SupportPage from './pages/SupportPage'
import SettingsPage from './pages/SettingsPage'
import AddRoomPage from './pages/AddRoomPage'
import AddDormPage from './pages/AddDormPage'

function AdminPortal() {
  return (
    <Routes>
      <Route index element={<OverviewPage />} />
      <Route path="dorms" element={<DormsPage />} />
      <Route path="dorms/add" element={<AddDormPage />} />
      <Route path="rooms/add" element={<AddRoomPage />} />
      <Route path="applications" element={<ApplicationsPage />} />
      <Route path="documents" element={<DocumentsPage />} />
      <Route path="availability" element={<AvailabilityPage />} />
      <Route path="support" element={<SupportPage />} />
      <Route path="settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}

export default AdminPortal



