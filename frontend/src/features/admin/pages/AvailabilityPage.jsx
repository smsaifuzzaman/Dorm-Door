import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../components/layout/AdminLayout'
import Icon from '../components/Icon'
import { topbarAvatars } from '../data/dashboardData'
import { api } from '../../../api/client'

const STATUS_OPTIONS = ['All', 'Open', 'Limited', 'Full', 'Maintenance']
const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=300&q=80'

function statusClass(status) {
  if (status === 'Open') return 'bg-emerald-500/10 text-emerald-600'
  if (status === 'Limited') return 'bg-amber-500/10 text-amber-600'
  if (status === 'Full') return 'bg-error/10 text-error'
  return 'bg-slate-200 text-slate-700'
}

function AvailabilityPage() {
  const navigate = useNavigate()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [requestState, setRequestState] = useState('')
  const [updating, setUpdating] = useState(false)

  const [roomReferenceId, setRoomReferenceId] = useState('')
  const [occupancy, setOccupancy] = useState('0')
  const [status, setStatus] = useState('Limited')

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  useEffect(() => {
    async function loadRooms() {
      setLoading(true)
      setError('')

      try {
        const { data } = await api.get('/rooms')
        const rows = data.rooms || []
        setRooms(rows)
        if (rows[0]) {
          setRoomReferenceId(rows[0]._id || '')
          setOccupancy(String(rows[0].occupiedSeats || 0))
          setStatus(rows[0].status || 'Open')
        }
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Failed to load room availability data')
      } finally {
        setLoading(false)
      }
    }

    loadRooms()
  }, [])

  const availabilityRows = useMemo(() => {
    return rooms.map((room) => {
      const total = Number(room.seatCount || 0)
      const occupied = Number(room.occupiedSeats || 0)
      const available = Math.max(total - occupied, 0)
      return {
        id: room._id,
        dorm: room.dorm?.name || 'Dorm not assigned',
        room: room.roomNumber || 'Unknown',
        total,
        occupied,
        available,
        status: room.status || 'Open',
        statusClass: statusClass(room.status || 'Open'),
        image: room.images?.[0] || PLACEHOLDER_IMAGE,
      }
    })
  }, [rooms])

  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return availabilityRows.filter((row) => {
      const matchesSearch =
        query === '' ||
        row.dorm.toLowerCase().includes(query) ||
        row.room.toLowerCase().includes(query) ||
        row.status.toLowerCase().includes(query)

      const matchesStatus = statusFilter === 'All' || row.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [availabilityRows, searchTerm, statusFilter])

  const selectedQuickRoom = useMemo(
    () => rooms.find((room) => room._id === roomReferenceId) || null,
    [roomReferenceId, rooms],
  )

  const summary = useMemo(() => {
    const totalCapacity = filteredRows.reduce((sum, row) => sum + row.total, 0)
    const occupied = filteredRows.reduce((sum, row) => sum + row.occupied, 0)
    const available = filteredRows.reduce((sum, row) => sum + row.available, 0)
    const maintenance = filteredRows.filter((row) => row.status === 'Maintenance').length

    const occupancyRate = totalCapacity === 0 ? 0 : Math.round((occupied / totalCapacity) * 100)

    return {
      totalCapacity,
      occupied,
      available,
      maintenance,
      occupancyRate,
    }
  }, [filteredRows])

  const resetFilters = () => {
    setSearchTerm('')
    setStatusFilter('All')
  }

  const useRoomInQuickUpdate = (row) => {
    setRoomReferenceId(row.id)
    setOccupancy(String(row.occupied))
    setStatus(row.status)
    setRequestState('')
  }

  const handleQuickUpdate = async () => {
    const target = rooms.find((room) => room._id === roomReferenceId)
    if (!target) {
      setRequestState('Select a room before applying a quick update.')
      return
    }

    setUpdating(true)
    setRequestState('')

    try {
      await api.patch(`/rooms/${target._id}`, {
        occupiedSeats: Number(occupancy || 0),
        status,
      })

      const { data } = await api.get('/rooms')
      const refreshedRooms = data.rooms || []
      setRooms(refreshedRooms)

      const refreshedTarget = refreshedRooms.find((room) => room._id === target._id)
      if (refreshedTarget) {
        setRoomReferenceId(refreshedTarget._id)
        setOccupancy(String(refreshedTarget.occupiedSeats || 0))
        setStatus(refreshedTarget.status || 'Open')
      } else if (refreshedRooms[0]) {
        setRoomReferenceId(refreshedRooms[0]._id)
        setOccupancy(String(refreshedRooms[0].occupiedSeats || 0))
        setStatus(refreshedRooms[0].status || 'Open')
      } else {
        setRoomReferenceId('')
        setOccupancy('0')
        setStatus('Open')
      }

      setRequestState(
        `Room ${target.roomNumber} (${target.dorm?.name || 'Unknown Dorm'}) updated successfully.`,
      )
    } catch (requestError) {
      setRequestState(requestError.response?.data?.message || 'Failed to update room.')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <AdminLayout
      activeKey="availability"
      sidebarVariant="atelier-badge"
      topbarProps={{
        searchPlaceholder: 'Search dorms, rooms, or students...',
        profileName: 'Admin Panel',
        profileRole: '',
        avatar: topbarAvatars.availabilityAdmin,
      }}
      contentClassName="p-8"
    >
      <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="max-w-2xl">
          <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.2em] text-secondary">
            Space Management
          </label>
          <h2 className="text-5xl font-extrabold leading-tight tracking-tight text-on-surface">
            Room Availability <br />&amp; Occupancy.
          </h2>
        </div>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={resetFilters}
            className="flex items-center gap-2 rounded-lg bg-surface-container-low px-6 py-3 font-bold text-primary transition-all hover:bg-surface-container-high"
          >
            <Icon name="filter_list" />
            Reset Filters
          </button>
          <button type="button" onClick={() => navigate('/admin/rooms/add')} className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-primary to-primary-container px-6 py-3 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]">
            <Icon name="add" />
            New Room
          </button>
        </div>
      </div>

      {error ? <p className="mb-6 rounded-xl bg-[#ffe9ec] px-4 py-3 text-sm font-semibold text-[#c73535]">{error}</p> : null}
      {requestState ? <p className="mb-6 rounded-xl bg-[#e8f0f7] px-4 py-3 text-sm font-semibold text-[#4e6875]">{requestState}</p> : null}

      <div className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-[1.6fr_1fr_auto]">
        <label className="relative block">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by dorm, room, or status"
            className="w-full rounded-xl border border-outline-variant/20 bg-white px-4 py-3 pl-10 text-sm outline-none focus:border-primary"
          />
        </label>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-xl border border-outline-variant/20 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setStatusFilter(option)}
              className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                statusFilter === option
                  ? 'bg-primary text-white'
                  : 'bg-surface-container-low text-secondary hover:bg-surface-container-high'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-secondary">Total Capacity</p>
          <h3 className="text-3xl font-black text-on-surface">{loading ? '...' : summary.totalCapacity}</h3>
          <div className="mt-4 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-container">
              <div className="h-full bg-primary" style={{ width: `${summary.occupancyRate}%` }} />
            </div>
            <span className="text-[10px] font-bold text-primary">{summary.occupancyRate}%</span>
          </div>
        </div>
        <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-secondary">Occupied</p>
          <h3 className="text-3xl font-black text-on-surface">{loading ? '...' : summary.occupied}</h3>
          <p className="mt-2 text-[10px] text-secondary">Active student residents</p>
        </div>
        <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-secondary">Available</p>
          <h3 className="text-3xl font-black text-primary">{loading ? '...' : summary.available}</h3>
          <p className="mt-2 text-[10px] text-secondary">Ready for allocation</p>
        </div>
        <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-secondary">Maintenance</p>
          <h3 className="text-3xl font-black text-error">{loading ? '...' : summary.maintenance}</h3>
          <p className="mt-2 text-[10px] text-secondary">Out of rotation</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-outline-variant/10 bg-surface-container-lowest shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-surface-container-low/50">
                {['Dormitory Name', 'Room #', 'Total Seats', 'Occupied', 'Available', 'Status', 'Action'].map((head, index) => (
                  <th
                    key={head}
                    className={`px-6 py-5 text-[11px] font-black uppercase tracking-[0.1em] text-secondary ${
                      index === 6 ? 'text-right' : ''
                    }`}
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-secondary">
                    Loading room availability...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-secondary">
                    No rooms match the current filters.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr key={row.id} className="group transition-colors hover:bg-surface-container-low/30">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg">
                          <img src={row.image} alt={row.dorm} className="h-full w-full object-cover" />
                        </div>
                        <span className="font-bold text-on-surface">{row.dorm}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 font-medium text-secondary">{row.room}</td>
                    <td className="px-6 py-5 font-bold">{row.total}</td>
                    <td className="px-6 py-5 font-bold">{row.occupied}</td>
                    <td className={`px-6 py-5 font-bold ${row.available ? 'text-primary' : 'text-secondary'}`}>
                      {row.available}
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${row.statusClass}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${row.status === 'Full' ? 'bg-error' : row.status === 'Open' ? 'bg-emerald-600' : row.status === 'Maintenance' ? 'bg-slate-600' : 'bg-amber-500'}`} />
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button type="button" onClick={() => useRoomInQuickUpdate(row)} className="rounded-lg p-2 text-primary opacity-0 transition-all hover:bg-surface-container-high group-hover:opacity-100">
                        <Icon name="edit" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-outline-variant/10 bg-surface-container-low/30 px-6 py-4">
          <p className="text-sm text-secondary">Showing {filteredRows.length} of {availabilityRows.length} rooms</p>
          <div className="flex items-center gap-2">
            <button type="button" className="rounded-lg bg-white px-3 py-2 text-sm shadow-sm"><Icon name="chevron_left" /></button>
            <button type="button" className="rounded-lg bg-primary px-3 py-2 text-sm font-bold text-white">1</button>
            <button type="button" className="rounded-lg bg-white px-3 py-2 text-sm shadow-sm">2</button>
            <button type="button" className="rounded-lg bg-white px-3 py-2 text-sm shadow-sm">3</button>
            <button type="button" className="rounded-lg bg-white px-3 py-2 text-sm shadow-sm"><Icon name="chevron_right" /></button>
          </div>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-outline-variant/10 bg-white p-8 shadow-soft md:col-span-2">
          <h4 className="text-xl font-bold text-on-surface">Quick Manual Update</h4>
          <p className="mt-2 text-sm text-secondary">Override room status or adjust seat count manually.</p>

          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-secondary">Room Reference</label>
              <div className="relative">
                <Icon name="bolt" className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
                <select
                  value={roomReferenceId}
                  onChange={(e) => {
                    const nextId = e.target.value
                    setRoomReferenceId(nextId)
                    const selectedRoom = rooms.find((room) => room._id === nextId)
                    if (selectedRoom) {
                      setOccupancy(String(selectedRoom.occupiedSeats || 0))
                      setStatus(selectedRoom.status || 'Open')
                    }
                    setRequestState('')
                  }}
                  className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 pl-10"
                >
                  {!rooms.length ? <option value="">No rooms available</option> : null}
                  {rooms.map((room) => (
                    <option key={room._id} value={room._id}>
                      {(room.dorm?.name || 'Unknown Dorm') + ' - ' + (room.roomNumber || 'Unknown Room')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-secondary">New Occupancy</label>
              <select
                value={occupancy}
                onChange={(e) => setOccupancy(e.target.value)}
                className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3"
              >
                {Array.from({ length: 8 }, (_, index) => (
                  <option key={index} value={String(index)}>
                    {index}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-secondary">Status Override</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3"
              >
                <option>Open</option>
                <option>Limited</option>
                <option>Full</option>
                <option>Maintenance</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between rounded-2xl bg-surface-container-low p-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-secondary">Update Preview</p>
              <p className="mt-2 text-sm text-on-surface">
                Room{' '}
                <span className="font-bold">
                  {selectedQuickRoom
                    ? `${selectedQuickRoom.dorm?.name || 'Dorm'} / ${selectedQuickRoom.roomNumber || 'N/A'}`
                    : 'N/A'}
                </span>{' '}
                will be set to <span className="font-bold">{occupancy}</span> occupied seats and{' '}
                <span className="font-bold">{status}</span> status.
              </p>
            </div>
            <button type="button" onClick={handleQuickUpdate} disabled={updating} className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70">
              {updating ? 'Updating...' : 'Update Room'}
            </button>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-surface-container p-8">
          <h4 className="text-xl font-bold text-on-surface">Availability Alerts</h4>
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-3 rounded-2xl bg-white/60 p-4">
              <Icon name="warning" className="text-amber-500" />
              <p className="text-xs font-medium">{summary.maintenance} rooms currently marked for maintenance.</p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-white/60 p-4">
              <Icon name="group" className="text-primary" />
              <p className="text-xs font-medium">{summary.available} seats are available for new allocations.</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2 border-t border-outline-variant/20 pt-4">
            <span className="flex items-center gap-1.5 rounded-full bg-secondary-container/50 px-3 py-1.5 text-[10px] font-bold text-on-secondary-container">
              <Icon name="wifi" className="text-xs" /> Live Sync
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-secondary-container/50 px-3 py-1.5 text-[10px] font-bold text-on-secondary-container">
              <Icon name="cleaning_services" className="text-xs" /> {summary.maintenance} Pending
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-secondary-container/50 px-3 py-1.5 text-[10px] font-bold text-on-secondary-container">
              <Icon name="bed" className="text-xs" /> {summary.totalCapacity} Capacity
            </span>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AvailabilityPage
