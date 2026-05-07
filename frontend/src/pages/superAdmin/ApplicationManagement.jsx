import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Eye, Search, Timer, XCircle } from 'lucide-react'
import DataTable from '../../components/superAdmin/DataTable'
import SimpleModal from '../../components/superAdmin/SimpleModal'
import StatusBadge from '../../components/superAdmin/StatusBadge'
import SuperAdminLayout from '../../components/superAdmin/SuperAdminLayout'
import {
  approveCatalogRequest,
  approveApplication,
  getCatalogRequests,
  getApplications,
  rejectCatalogRequest,
  rejectApplication,
  waitlistApplication,
} from '../../services/superAdminApi'
import { formatDate, formatDateTime, referenceId, studentNameFromApplication } from './pageUtils'

const statusOptions = ['All', 'Pending', 'Under Review', 'Approved', 'Rejected', 'Waitlisted']

function ApplicationManagement() {
  const [applications, setApplications] = useState([])
  const [catalogRequests, setCatalogRequests] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [selectedCatalogRequest, setSelectedCatalogRequest] = useState(null)

  const loadApplications = async () => {
    setLoading(true)
    setError('')

    try {
      const [{ data: applicationData }, { data: catalogData }] = await Promise.all([
        getApplications({
          search,
          status: statusFilter === 'All' ? undefined : statusFilter,
        }),
        getCatalogRequests(),
      ])
      setApplications(applicationData.applications || [])
      setCatalogRequests(catalogData.requests || [])
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadApplications()
  }, [statusFilter])

  const handleSearch = (event) => {
    event.preventDefault()
    loadApplications()
  }

  const decide = async (application, action) => {
    const note = window.prompt('Admin note (optional):') || ''

    try {
      if (action === 'approve') await approveApplication(application._id, note)
      if (action === 'reject') await rejectApplication(application._id, note)
      if (action === 'waitlist') await waitlistApplication(application._id, note)
      await loadApplications()
      setMessage('Application updated successfully.')
    } catch (requestError) {
      setMessage(requestError.response?.data?.message || 'Failed to update application.')
    }
  }

  const decideCatalogRequest = async (request, action) => {
    const note = window.prompt('Admin note (optional):') || ''

    try {
      if (action === 'approve') await approveCatalogRequest(request._id, note)
      if (action === 'reject') await rejectCatalogRequest(request._id, note)
      await loadApplications()
      setMessage('Catalog request updated successfully.')
    } catch (requestError) {
      setMessage(requestError.response?.data?.message || 'Failed to update catalog request.')
    }
  }

  const columns = useMemo(
    () => [
      { key: 'reference', label: 'Reference ID', render: (row) => referenceId(row) },
      { key: 'student', label: 'Student Name', render: (row) => studentNameFromApplication(row) },
      { key: 'dorm', label: 'Dorm Name', render: (row) => row.dorm?.name || 'N/A' },
      { key: 'roomType', label: 'Room Type', render: (row) => row.room?.type || row.preferences?.preferredRoomType || 'N/A' },
      { key: 'createdAt', label: 'Application Date', render: (row) => formatDate(row.createdAt) },
      { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status || 'Pending'} /> },
      {
        key: 'actions',
        label: 'Actions',
        render: (row) => (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setSelectedApplication(row)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" title="View">
              <Eye size={16} />
            </button>
            <button type="button" onClick={() => decide(row, 'approve')} className="rounded-lg p-2 text-emerald-700 hover:bg-emerald-50" title="Approve">
              <CheckCircle2 size={16} />
            </button>
            <button type="button" onClick={() => decide(row, 'reject')} className="rounded-lg p-2 text-red-600 hover:bg-red-50" title="Reject">
              <XCircle size={16} />
            </button>
            <button type="button" onClick={() => decide(row, 'waitlist')} className="rounded-lg p-2 text-violet-700 hover:bg-violet-50" title="Waitlist">
              <Timer size={16} />
            </button>
          </div>
        ),
      },
    ],
    [search, statusFilter],
  )

  const catalogColumns = useMemo(
    () => [
      { key: 'type', label: 'Request Type', render: (row) => <span className="capitalize">{row.type}</span> },
      {
        key: 'name',
        label: 'Name / Room',
        render: (row) => (row.type === 'dorm' ? row.payload?.name || 'N/A' : row.payload?.roomNumber || 'N/A'),
      },
      { key: 'requestedBy', label: 'Dorm Admin', render: (row) => row.requestedBy?.name || 'N/A' },
      { key: 'createdAt', label: 'Submitted', render: (row) => formatDate(row.createdAt) },
      { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status || 'Pending'} /> },
      {
        key: 'actions',
        label: 'Actions',
        render: (row) => (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setSelectedCatalogRequest(row)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" title="View">
              <Eye size={16} />
            </button>
            {row.status === 'Pending' ? (
              <>
                <button type="button" onClick={() => decideCatalogRequest(row, 'approve')} className="rounded-lg p-2 text-emerald-700 hover:bg-emerald-50" title="Approve">
                  <CheckCircle2 size={16} />
                </button>
                <button type="button" onClick={() => decideCatalogRequest(row, 'reject')} className="rounded-lg p-2 text-red-600 hover:bg-red-50" title="Reject">
                  <XCircle size={16} />
                </button>
              </>
            ) : null}
          </div>
        ),
      },
    ],
    [],
  )

  return (
    <SuperAdminLayout title="Applications" subtitle="Review applications separately from payment approval.">
      <section className="mb-8">
        <div className="mb-4">
          <h3 className="text-xl font-black text-slate-950">Dorm and Room Requests</h3>
          <p className="mt-1 text-sm text-slate-500">Approve dorm-admin catalog submissions before they enter the public website.</p>
        </div>
        <DataTable columns={catalogColumns} rows={catalogRequests} loading={loading} emptyMessage="No dorm or room requests found." />
      </section>

      <div className="mb-6 grid gap-3 xl:grid-cols-[1fr_auto]">
        <form onSubmit={handleSearch} className="grid gap-3 md:grid-cols-[1fr_auto]">
          <label className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by reference ID, student, or dorm"
              className="w-full rounded-lg border border-[#e8edf3] bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-primary"
            />
          </label>
          <button type="submit" className="rounded-lg bg-primary px-5 py-3 text-sm font-bold text-white">Search</button>
        </form>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-lg border border-[#e8edf3] bg-white px-4 py-3 text-sm font-bold">
          {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
      </div>

      {error ? <p className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
      {message ? <p className="mb-5 rounded-lg bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">{message}</p> : null}

      <DataTable columns={columns} rows={applications} loading={loading} emptyMessage="No applications found." />

      {selectedCatalogRequest ? (
        <SimpleModal title="Catalog Request Details" onClose={() => setSelectedCatalogRequest(null)}>
          <div className="grid gap-4 text-sm text-slate-700 sm:grid-cols-2">
            <p><strong>Type:</strong> {selectedCatalogRequest.type}</p>
            <p><strong>Status:</strong> {selectedCatalogRequest.status}</p>
            <p><strong>Requested By:</strong> {selectedCatalogRequest.requestedBy?.name || 'N/A'}</p>
            <p><strong>Submitted:</strong> {formatDateTime(selectedCatalogRequest.createdAt)}</p>
            {Object.entries(selectedCatalogRequest.payload || {}).map(([key, value]) => (
              <p key={key} className="sm:col-span-2">
                <strong>{key}:</strong>{' '}
                {Array.isArray(value)
                  ? value.map((item) => String(item).startsWith('data:image') ? 'Uploaded image' : item).join(', ')
                  : String(value || '').startsWith('data:image')
                    ? 'Uploaded image'
                    : String(value || 'N/A')}
              </p>
            ))}
            <p className="sm:col-span-2"><strong>Admin Note:</strong> {selectedCatalogRequest.adminNote || 'No note yet.'}</p>
          </div>
        </SimpleModal>
      ) : null}

      {selectedApplication ? (
        <SimpleModal title="Application Details" onClose={() => setSelectedApplication(null)}>
          <div className="grid gap-4 text-sm text-slate-700 sm:grid-cols-2">
            <p><strong>Reference ID:</strong> {referenceId(selectedApplication)}</p>
            <p><strong>Student:</strong> {studentNameFromApplication(selectedApplication)}</p>
            <p><strong>Dorm:</strong> {selectedApplication.dorm?.name || 'N/A'}</p>
            <p><strong>Room:</strong> {selectedApplication.room?.roomNumber || 'To be assigned'}</p>
            <p><strong>Room Type:</strong> {selectedApplication.room?.type || selectedApplication.preferences?.preferredRoomType || 'N/A'}</p>
            <p><strong>Payment Status:</strong> {selectedApplication.paymentStatus || 'Not Submitted'}</p>
            <p><strong>Submitted:</strong> {formatDateTime(selectedApplication.createdAt)}</p>
            <p><strong>Move-In:</strong> {formatDate(selectedApplication.preferences?.moveInDate)}</p>
            <p className="sm:col-span-2"><strong>Admin Note:</strong> {selectedApplication.adminNote || 'No note yet.'}</p>
          </div>
        </SimpleModal>
      ) : null}
    </SuperAdminLayout>
  )
}

export default ApplicationManagement
