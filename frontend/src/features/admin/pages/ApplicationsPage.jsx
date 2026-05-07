import { useEffect, useMemo, useState } from 'react'
import { FiEye, FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { MdPendingActions, MdRateReview, MdCheckCircle, MdAnalytics } from 'react-icons/md'
import AdminLayout from '../components/layout/AdminLayout'
import { topbarAvatars } from '../data/dashboardData'
import { api } from '../../../api/client'

const STATUS_OPTIONS = ['Pending', 'Under Review', 'Approved', 'Rejected', 'Re-upload Requested']

function getStatusStyle(status) {
  if (status === 'Pending') {
    return {
      badge: 'bg-blue-50 text-blue-700 ring-blue-700/10',
      dot: 'bg-blue-700',
    }
  }

  if (status === 'Under Review' || status === 'Re-upload Requested') {
    return {
      badge: 'bg-amber-50 text-amber-700 ring-amber-700/10',
      dot: 'bg-amber-700',
    }
  }

  if (status === 'Approved') {
    return {
      badge: 'bg-green-50 text-green-700 ring-green-700/10',
      dot: 'bg-green-700',
    }
  }

  return {
    badge: 'bg-red-50 text-red-700 ring-red-700/10',
    dot: 'bg-red-700',
  }
}

function formatDate(value) {
  if (!value) return 'Not available'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'Not available'
  return parsed.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
}

function formatDateTime(value) {
  if (!value) return 'Not available'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'Not available'
  return parsed.toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function initialsFromName(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'NA'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

function ApplicationsPage() {
  const [applications, setApplications] = useState([])
  const [catalogRequests, setCatalogRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [requestState, setRequestState] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const [selectedApplication, setSelectedApplication] = useState(null)
  const [availableRooms, setAvailableRooms] = useState([])
  const [roomsLoading, setRoomsLoading] = useState(false)
  const [selectedRoomId, setSelectedRoomId] = useState('')
  const [nextStatus, setNextStatus] = useState('Pending')
  const [adminNote, setAdminNote] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadApplications() {
      setLoading(true)
      setError('')

      try {
        const [{ data: applicationData }, { data: catalogData }] = await Promise.all([
          api.get('/applications'),
          api.get('/catalog-requests'),
        ])
        setApplications(applicationData.applications || [])
        setCatalogRequests(catalogData.requests || [])
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Failed to load applications')
      } finally {
        setLoading(false)
      }
    }

    loadApplications()
  }, [])

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const query = searchTerm.trim().toLowerCase()
      const studentName = app.student?.name || ''
      const studentId = app.student?.studentId || app.student?._id || ''
      const dormName = app.dorm?.name || ''
      const roomText = `${app.room?.type || ''} ${app.room?.roomNumber || ''}`

      const matchesSearch =
        query === '' ||
        studentName.toLowerCase().includes(query) ||
        String(studentId).toLowerCase().includes(query) ||
        dormName.toLowerCase().includes(query) ||
        roomText.toLowerCase().includes(query)

      const matchesStatus = statusFilter === 'All' || app.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [applications, searchTerm, statusFilter])

  const stats = useMemo(() => {
    const total = filteredApplications.length
    const reviewing = filteredApplications.filter((app) => app.status === 'Under Review' || app.status === 'Pending').length
    const approved = filteredApplications.filter((app) => app.status === 'Approved').length
    const approvalRate = total === 0 ? 0 : Math.round((approved / total) * 100)

    return [
      {
        icon: MdPendingActions,
        iconWrap: 'bg-blue-50 text-blue-700',
        badge: `${total} shown`,
        badgeClass: 'bg-blue-50 text-blue-600',
        label: 'Visible Applications',
        value: String(total),
      },
      {
        icon: MdRateReview,
        iconWrap: 'bg-amber-50 text-amber-700',
        label: 'Under Review',
        value: String(reviewing),
      },
      {
        icon: MdCheckCircle,
        iconWrap: 'bg-green-50 text-green-700',
        label: 'Approved',
        value: String(approved),
      },
      {
        icon: MdAnalytics,
        iconWrap: 'bg-slate-100 text-slate-700',
        label: 'Approval Rate',
        value: `${approvalRate}%`,
      },
    ]
  }, [filteredApplications])

  const openDetails = (app) => {
    setSelectedApplication(app)
    setSelectedRoomId(app.room?._id || '')
    setAvailableRooms([])
    setNextStatus(app.status || 'Pending')
    setAdminNote(app.adminNote || '')
    setRequestState('')
  }

  const closeDetails = () => {
    setSelectedApplication(null)
    setSelectedRoomId('')
    setAvailableRooms([])
    setRequestState('')
  }

  useEffect(() => {
    if (!selectedApplication?.dorm?._id) return

    let mounted = true

    async function loadAssignableRooms() {
      setRoomsLoading(true)

      try {
        const { data } = await api.get('/rooms', {
          params: {
            dormId: selectedApplication.dorm._id,
          },
        })

        if (!mounted) return
        setAvailableRooms(data.rooms || [])
      } catch (requestError) {
        if (mounted) {
          setRequestState(requestError.response?.data?.message || 'Failed to load rooms for this dorm.')
        }
      } finally {
        if (mounted) {
          setRoomsLoading(false)
        }
      }
    }

    loadAssignableRooms()

    return () => {
      mounted = false
    }
  }, [selectedApplication?.dorm?._id])

  const handleStatusUpdate = async () => {
    if (!selectedApplication?._id) return
    setSaving(true)
    setRequestState('')

    try {
      const { data } = await api.patch(`/applications/${selectedApplication._id}/status`, {
        status: nextStatus,
        room: selectedRoomId || null,
        adminNote,
      })

      const updated = data.application
      const updatedStudentId = updated.student?._id || selectedApplication.student?._id || selectedApplication.student
      setApplications((prev) =>
        prev
          .filter((item) => {
            if (updated.status !== 'Approved') return true
            const itemStudentId = item.student?._id || item.student
            return item._id === updated._id || String(itemStudentId) !== String(updatedStudentId) || item.status === 'Approved'
          })
          .map((item) => (
            item._id === updated._id
              ? {
                  ...item,
                  status: updated.status,
                  room: updated.room,
                  adminNote: updated.adminNote,
                  updatedAt: updated.updatedAt || item.updatedAt,
                }
              : item
          )),
      )
      setSelectedApplication((prev) =>
        prev
          ? {
              ...prev,
              status: updated.status,
              room: updated.room,
              adminNote: updated.adminNote,
              updatedAt: updated.updatedAt || prev.updatedAt,
            }
          : prev,
      )
      setRequestState('Application updated successfully.')
    } catch (requestError) {
      setRequestState(requestError.response?.data?.message || 'Failed to update application.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout
      activeKey="applications"
      topbarProps={{
        searchPlaceholder: 'Search applications...',
        profileName: 'Admin Panel',
        profileRole: '',
        avatar: topbarAvatars.admin,
      }}
      contentClassName="p-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-primary">Management Portal</p>
            <h1 className="text-5xl font-black tracking-tighter">Application Stream</h1>
            <p className="mt-3 max-w-xl text-[18px] leading-8 text-secondary">
              Review and process student housing requests for the current academic session.
            </p>
          </div>
        </div>

        {error ? <p className="mb-6 rounded-xl bg-[#ffe9ec] px-4 py-3 text-sm font-semibold text-[#c73535]">{error}</p> : null}

        <section className="mb-10 rounded-[1.5rem] border border-[#ece7e4] bg-white p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black tracking-tight">Dorm and Room Requests</h2>
              <p className="mt-1 text-sm text-secondary">Requests you submitted for super admin approval.</p>
            </div>
            <span className="rounded-full bg-[#eef3ff] px-3 py-1 text-xs font-bold text-primary">
              {catalogRequests.filter((item) => item.status === 'Pending').length} Pending
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-[#faf7f6]">
                <tr>
                  {['Type', 'Name / Room', 'Target Dorm', 'Submitted', 'Status', 'Note'].map((head) => (
                    <th key={head} className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-secondary">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-secondary">Loading requests...</td></tr>
                ) : catalogRequests.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-secondary">No dorm or room requests submitted yet.</td></tr>
                ) : (
                  catalogRequests.map((request) => {
                    const statusStyle = getStatusStyle(request.status)
                    const payload = request.payload || {}
                    return (
                      <tr key={request._id} className="border-t border-[#f0ebea]">
                        <td className="px-4 py-4 text-sm font-bold capitalize">{request.type}</td>
                        <td className="px-4 py-4 text-sm">{request.type === 'dorm' ? payload.name : payload.roomNumber}</td>
                        <td className="px-4 py-4 text-sm text-secondary">{request.type === 'dorm' ? payload.block || 'General' : payload.dorm || 'Selected dorm'}</td>
                        <td className="px-4 py-4 text-sm text-secondary">{formatDate(request.createdAt)}</td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ring-1 ${statusStyle.badge}`}>
                            <span className={`h-2 w-2 rounded-full ${statusStyle.dot}`} />
                            {request.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-secondary">{request.adminNote || 'No note'}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="mb-8 grid gap-4 md:grid-cols-[1fr_auto]">
          <label className="relative block">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
              <FiSearch />
            </span>
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by student, ID, dorm, or room"
              className="w-full rounded-xl border border-[#ece7e4] bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-primary"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {['All', ...STATUS_OPTIONS].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`rounded-xl px-4 py-3 text-sm font-bold transition ${
                  statusFilter === status
                    ? 'bg-primary text-white'
                    : 'bg-[#f2efee] text-[#1c1b1b] hover:bg-[#ebe6e4]'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => {
            const ItemIcon = item.icon
            return (
              <div key={item.label} className="rounded-xl border border-[#ece7e4] bg-white p-6 transition-all hover:border-blue-200">
                <div className="mb-4 flex items-start justify-between">
                  <div className={`rounded-xl p-3 ${item.iconWrap}`}><ItemIcon size={24} /></div>
                  {item.badge ? <span className={`rounded-md px-2 py-1 text-[10px] font-bold ${item.badgeClass}`}>{item.badge}</span> : null}
                </div>
                <p className="mb-1 text-sm text-secondary">{item.label}</p>
                <h3 className="text-[18px] font-extrabold sm:text-[22px]">{loading ? '...' : item.value}</h3>
              </div>
            )
          })}
        </div>

        <div className="overflow-hidden rounded-[1.5rem] border border-[#ece7e4] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead className="bg-[#faf7f6]">
                <tr>
                  {['Student Name', 'Student ID', 'Applied Dorm/Room', 'Date', 'Status', 'Actions'].map((head) => (
                    <th key={head} className="px-6 py-5 text-[11px] font-black uppercase tracking-[0.18em] text-secondary">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr className="border-t border-[#f0ebea]">
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-secondary">Loading applications...</td>
                  </tr>
                ) : filteredApplications.length === 0 ? (
                  <tr className="border-t border-[#f0ebea]">
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-secondary">No applications found for the selected filters.</td>
                  </tr>
                ) : (
                  filteredApplications.map((app) => {
                    const statusStyle = getStatusStyle(app.status)
                    const studentName = app.student?.name || 'Unknown Student'
                    const studentId = app.student?.studentId || app.student?._id || 'N/A'
                    const dormLabel = app.dorm?.name || 'Dorm not assigned'
                    const roomLabel = `${app.room?.type || 'Room pending'}${app.room?.roomNumber ? ` - ${app.room.roomNumber}` : ''}`
                    const initials = initialsFromName(studentName)

                    return (
                      <tr key={app._id} className="border-t border-[#f0ebea]">
                        <td className="px-6 py-6">
                          <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-sm font-bold text-white">
                              {initials}
                            </div>
                            <div className="text-[16px] font-bold leading-8">{studentName}</div>
                          </div>
                        </td>
                        <td className="px-6 py-6 text-[18px] text-secondary">{studentId}</td>
                        <td className="px-6 py-6">
                          <div className="text-[18px] font-semibold">{dormLabel}</div>
                          <div className="text-sm text-secondary">{roomLabel}</div>
                        </td>
                        <td className="px-6 py-6 text-[18px] text-secondary">{formatDate(app.createdAt)}</td>
                        <td className="px-6 py-6">
                          <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ring-1 ${statusStyle.badge}`}>
                            <span className={`h-2.5 w-2.5 rounded-full ${statusStyle.dot}`} />
                            {app.status || 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-6">
                          <button type="button" onClick={() => openDetails(app)} className="rounded-lg p-2 text-primary hover:bg-blue-50">
                            <FiEye size={18} />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-6 py-5 text-sm text-secondary">
            <p>Showing 1-{filteredApplications.length} of {filteredApplications.length} applications</p>
            <div className="flex items-center gap-2">
              <button type="button" className="rounded-lg p-2 hover:bg-[#f2efee]"><FiChevronLeft /></button>
              <button type="button" className="rounded-lg bg-primary px-3 py-2 text-white">1</button>
              <button type="button" className="rounded-lg p-2 hover:bg-[#f2efee]"><FiChevronRight /></button>
            </div>
          </div>
        </div>
      </div>

      {selectedApplication ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-extrabold">Application Details</h3>
                <p className="mt-1 text-sm text-secondary">
                  {selectedApplication.student?.name || 'Student'} - {selectedApplication.student?.studentId || selectedApplication.student?._id || 'N/A'}
                </p>
              </div>
              <button type="button" onClick={closeDetails} className="rounded-lg px-3 py-2 text-sm font-semibold text-secondary hover:bg-[#f2efee]">
                Close
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-[#f7f4f3] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Dorm</p>
                <p className="mt-2 text-sm font-semibold">{selectedApplication.dorm?.name || 'Not assigned'}</p>
                <p className="mt-1 text-xs text-secondary">{selectedApplication.dorm?.block || 'No block selected'}</p>
              </div>
              <div className="rounded-xl bg-[#f7f4f3] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Room</p>
                <p className="mt-2 text-sm font-semibold">{selectedApplication.room?.roomNumber || 'Pending assignment'}</p>
                <p className="mt-1 text-xs text-secondary">{selectedApplication.room?.type || 'Type not set'}</p>
              </div>
              <div className="rounded-xl bg-[#f7f4f3] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Submitted</p>
                <p className="mt-2 text-sm font-semibold">{formatDateTime(selectedApplication.createdAt)}</p>
              </div>
              <div className="rounded-xl bg-[#f7f4f3] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Last Updated</p>
                <p className="mt-2 text-sm font-semibold">{formatDateTime(selectedApplication.updatedAt)}</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-secondary">
                Assign Room
                <select
                  value={selectedRoomId}
                  onChange={(event) => setSelectedRoomId(event.target.value)}
                  disabled={roomsLoading}
                  className="mt-2 w-full rounded-lg border border-[#ece7e4] px-3 py-2 outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <option value="">{roomsLoading ? 'Loading rooms...' : 'Select a room'}</option>
                  {availableRooms.map((room) => {
                    const isCurrentRoom = room._id === selectedApplication.room?._id
                    const isUnavailable = !isCurrentRoom && (room.status === 'Full' || room.status === 'Maintenance')
                    const seatsLeft = Math.max(0, (room.seatCount || 0) - (room.occupiedSeats || 0))
                    return (
                      <option key={room._id} value={room._id} disabled={isUnavailable}>
                        {room.roomNumber} - {room.type} ({seatsLeft}/{room.seatCount} seats left, {room.status})
                      </option>
                    )
                  })}
                </select>
              </label>

              <label className="text-sm font-semibold text-secondary">
                Update Status
                <select
                  value={nextStatus}
                  onChange={(event) => setNextStatus(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-[#ece7e4] px-3 py-2 outline-none focus:border-primary"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-semibold text-secondary sm:col-span-2">
                Admin Note
                <textarea
                  value={adminNote}
                  onChange={(event) => setAdminNote(event.target.value)}
                  rows={4}
                  placeholder="Add note for student..."
                  className="mt-2 w-full rounded-lg border border-[#ece7e4] px-3 py-2 outline-none focus:border-primary"
                />
              </label>
            </div>

            {requestState ? <p className="mt-4 text-sm font-semibold text-secondary">{requestState}</p> : null}

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={closeDetails} className="rounded-lg px-4 py-2 font-semibold text-secondary hover:bg-[#f2efee]">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStatusUpdate}
                disabled={saving}
                className="rounded-lg bg-primary px-5 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? 'Saving...' : 'Update Application'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  )
}

export default ApplicationsPage
