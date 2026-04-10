import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../components/layout/AdminLayout'
import Icon from '../components/Icon'
import { topbarAvatars } from '../data/dashboardData'
import { api } from '../../../api/client'

function formatRelativeTime(value) {
  if (!value) return 'Just now'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'Just now'

  const diffMs = Date.now() - parsed.getTime()
  const diffMinutes = Math.max(1, Math.round(diffMs / (60 * 1000)))
  if (diffMinutes < 60) return `${diffMinutes} min ago`

  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`

  const diffDays = Math.round(diffHours / 24)
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
}

function OverviewPage() {
  const [overview, setOverview] = useState(null)
  const [applications, setApplications] = useState([])
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    async function loadData() {
      setLoading(true)
      setError('')

      try {
        const [{ data: dashboardData }, { data: applicationData }, { data: documentData }] = await Promise.all([
          api.get('/dashboard/admin'),
          api.get('/applications'),
          api.get('/documents'),
        ])

        if (!mounted) return
        setOverview(dashboardData.overview || null)
        setApplications(applicationData.applications || [])
        setDocuments(documentData.documents || [])
      } catch (requestError) {
        if (!mounted) return
        setError(requestError.response?.data?.message || 'Failed to load admin overview data')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadData()

    return () => {
      mounted = false
    }
  }, [])

  const stats = useMemo(() => {
    const pendingDocuments = documents.filter((item) => item.status === 'Pending' || item.status === 'Needs Update').length
    const approvedApplications = applications.filter((item) => item.status === 'Approved').length

    return [
      { label: 'Estate Total', value: String(overview?.dorms ?? 0), sub: 'Total Dorms', icon: 'domain', tone: 'bg-white' },
      { label: 'Inventory', value: String(overview?.rooms ?? 0), sub: 'Total Rooms', icon: 'bed', tone: 'bg-white' },
      {
        label: 'Availability',
        value: String(overview?.availableSeats ?? 0),
        sub: 'Available Seats',
        icon: 'inventory_2',
        tone: 'bg-primary text-white',
      },
      {
        label: 'Queue',
        value: String(overview?.pendingApplications ?? 0),
        sub: 'Pending Apps',
        icon: 'more_horiz',
        tone: 'bg-[#dfeaf3]',
      },
      {
        label: 'Efficiency',
        value: String(approvedApplications),
        sub: 'Approved Apps',
        icon: 'verified',
        tone: 'bg-white',
      },
      {
        label: 'Action Required',
        value: String(pendingDocuments),
        sub: 'Documents Pending',
        icon: 'warning',
        tone: 'bg-[#fde7e5]',
      },
    ]
  }, [applications, documents, overview])

  const activity = useMemo(() => {
    const recent = overview?.recentApplications || []
    const fromApplications = recent.slice(0, 4).map((item) => ({
      id: item._id,
      title: `${item.student?.name || 'Student'} submitted an application`,
      detail: `${item.dorm?.name || 'Dorm'}${item.room?.roomNumber ? ` - Room ${item.room.roomNumber}` : ''}`,
      time: formatRelativeTime(item.createdAt),
      status: item.status || 'Pending',
      type: item.status === 'Approved' ? 'success' : item.status === 'Rejected' ? 'danger' : 'info',
    }))

    if (fromApplications.length) return fromApplications

    return [
      {
        id: 'fallback-1',
        title: 'No recent activities yet',
        detail: 'Submit or review applications to populate this timeline.',
        time: 'Now',
        status: 'Idle',
        type: 'neutral',
      },
    ]
  }, [overview])

  const occupancyBars = useMemo(() => {
    const totalSeats = overview?.totalSeats || 0
    const occupiedSeats = overview?.occupiedSeats || 0
    const availableSeats = Math.max(totalSeats - occupiedSeats, 0)
    if (totalSeats === 0) {
      return [16, 20, 24, 18, 22, 14]
    }

    const occupancyRatio = Math.max(0, Math.min(1, occupiedSeats / totalSeats))
    const availableRatio = Math.max(0, Math.min(1, availableSeats / totalSeats))

    return [
      Math.round(40 + occupancyRatio * 90),
      Math.round(30 + occupancyRatio * 100),
      Math.round(38 + occupancyRatio * 104),
      Math.round(26 + availableRatio * 90),
      Math.round(50 + occupancyRatio * 120),
      Math.round(24 + availableRatio * 80),
    ]
  }, [overview])

  return (
    <AdminLayout
      activeKey="overview"
      topbarProps={{
        searchPlaceholder: 'Search applications or students...',
        brandText: 'Dorm Admin',
        showBrand: true,
        profileName: 'Admin Panel',
        profileRole: '',
        avatar: topbarAvatars.admin,
      }}
      contentClassName="p-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-primary">System Pulse</p>
            <h1 className="text-6xl font-black leading-none tracking-tighter">Overview</h1>
            <p className="mt-4 max-w-2xl text-[18px] leading-8 text-secondary">
              A panoramic view of housing operations, student flow, and facility capacity across the estate.
            </p>
          </div>
          <Link to="/admin/applications" className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-4 text-sm font-bold text-white shadow-soft">
            <Icon name="add" /> New Application
          </Link>
        </div>

        {error ? (
          <p className="mb-8 rounded-xl bg-[#ffe9ec] px-4 py-3 text-sm font-semibold text-[#c73535]">{error}</p>
        ) : null}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {stats.map((card, index) => (
            <div key={card.label} className={`rounded-3xl border border-[#ece7e4] p-6 ${card.tone}`}>
              <div className="mb-6 flex items-start justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${index === 2 ? 'bg-white/15' : 'bg-[#edf3ff]'}`}>
                  <Icon name={card.icon} className={index === 2 ? 'text-white' : 'text-primary'} />
                </div>
                <span className={`text-sm ${index === 2 ? 'text-white/80' : 'text-secondary'}`}>{card.label}</span>
              </div>
              <div className={`text-5xl font-black ${index === 5 ? 'text-error' : ''}`}>
                {loading ? '...' : card.value}
              </div>
              <p className={`mt-2 text-xl ${index === 2 ? 'text-white' : index === 5 ? 'text-error' : 'text-[#1c1b1b]'}`}>
                {card.sub}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 xl:grid-cols-12">
          <div className="xl:col-span-7">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[24px] font-extrabold">Recent Activity</h2>
              <button type="button" className="text-sm font-semibold text-primary">View All Operations</button>
            </div>
            <div className="space-y-5">
              {activity.map((item) => (
                <div key={item.id} className="flex items-start gap-4 rounded-2xl bg-transparent p-1">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-full ${
                      item.type === 'success'
                        ? 'bg-[#dff2f1]'
                        : item.type === 'danger'
                          ? 'bg-[#f3e6e1]'
                          : item.type === 'info'
                            ? 'bg-[#d9edf9]'
                            : 'bg-[#ebe8ff]'
                    }`}
                  >
                    <Icon
                      name={
                        item.type === 'success'
                          ? 'verified'
                          : item.type === 'danger'
                            ? 'warning'
                            : item.type === 'info'
                              ? 'assignment'
                              : 'hourglass_empty'
                      }
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-[17px] leading-7 text-[#1c1b1b]">
                      <span className="font-bold">{item.title}</span>
                    </p>
                    <p className="text-sm text-secondary">{item.time} - {item.detail}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                    item.type === 'success'
                      ? 'bg-green-50 text-green-700'
                      : item.type === 'danger'
                        ? 'bg-red-50 text-red-700'
                        : item.type === 'info'
                          ? 'bg-blue-50 text-primary'
                          : 'bg-slate-100 text-slate-600'
                  }`}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="xl:col-span-5">
            <h2 className="mb-4 text-[24px] font-extrabold">Occupancy Trend</h2>
            <div className="rounded-3xl border border-[#ece7e4] bg-white p-8">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary">Global Capacity</p>
                  <p className="mt-2 text-5xl font-black text-primary">{loading ? '...' : `${overview?.occupancyRate ?? 0}%`}</p>
                </div>
                <div className="flex gap-2 text-xs font-bold">
                  <span className="rounded-md bg-primary px-2 py-1 text-white">LIVE</span>
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-secondary">
                    {loading ? '--' : `${overview?.occupiedSeats ?? 0}/${overview?.totalSeats ?? 0}`}
                  </span>
                </div>
              </div>
              <div className="mt-10 flex items-end gap-4">
                {occupancyBars.map((height, index) => (
                  <div key={index} className={`w-12 rounded-t-2xl ${index === 4 ? 'bg-primary shadow-lg shadow-blue-500/20' : index === 5 ? 'border-2 border-dashed border-[#cbd7ec] bg-transparent' : 'bg-[#efebea]'}`} style={{ height: `${height}px` }} />
                ))}
                <div className="ml-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary text-white shadow-soft">
                  <Icon name="bolt" filled className="text-4xl" />
                </div>
              </div>
              <div className="mt-8 flex items-center justify-between text-sm text-secondary">
                <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-primary" />Occupied</span>
                <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#efebea]" />Available</span>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3 text-sm text-secondary">
              <span className="rounded-full bg-white px-4 py-2 shadow-sm">Total Seats: {overview?.totalSeats ?? 0}</span>
              <span className="rounded-full bg-white px-4 py-2 shadow-sm">Occupied: {overview?.occupiedSeats ?? 0}</span>
              <span className="rounded-full bg-white px-4 py-2 shadow-sm">Available: {overview?.availableSeats ?? 0}</span>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-6 rounded-3xl bg-[#f2efee] px-8 py-8 lg:flex-row lg:items-center">
          <div>
            <h3 className="text-[32px] font-extrabold">Housing Maintenance Queue</h3>
            <p className="mt-2 max-w-2xl text-secondary">
              There are currently {overview?.maintenanceOpen ?? 0} open maintenance tickets and {overview?.supportOpen ?? 0} unresolved support cases.
            </p>
          </div>
          <div className="flex gap-4">
            <Link to="/admin/support" className="rounded-2xl bg-white px-6 py-4 font-semibold text-[#1c1b1b]">Manage Tickets</Link>
            <Link to="/admin/availability" className="rounded-2xl bg-[#111111] px-6 py-4 font-semibold text-white">Review Capacity</Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default OverviewPage
