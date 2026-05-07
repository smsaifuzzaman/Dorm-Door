import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bath,
  Building,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CookingPot,
  DoorClosed,
  Download,
  Filter,
  PencilLine,
  Search,
  Snowflake,
  Trash2,
  Tv,
  WashingMachine,
  Wifi,
  Wrench,
} from 'lucide-react'
import AdminLayout from '../components/layout/AdminLayout'
import { topbarAvatars } from '../data/dashboardData'
import { api } from '../../../api/client'

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=300&q=80'

function getStatusStyle(status) {
  if (status === 'Open') {
    return {
      dot: 'bg-emerald-500',
      badge: 'bg-emerald-50 text-emerald-700 ring-emerald-700/10',
      label: 'Open',
    }
  }

  if (status === 'Limited') {
    return {
      dot: 'bg-amber-500',
      badge: 'bg-amber-50 text-amber-700 ring-amber-700/10',
      label: 'Limited',
    }
  }

  if (status === 'Full') {
    return {
      dot: 'bg-blue-700',
      badge: 'bg-blue-50 text-blue-700 ring-blue-700/10',
      label: 'Full',
    }
  }

  return {
    dot: 'bg-slate-500',
    badge: 'bg-slate-100 text-slate-700 ring-slate-700/10',
    label: 'Maintenance',
  }
}

function mapAmenityIcons(amenities = []) {
  const normalized = amenities.map((item) => String(item).toLowerCase())
  const icons = []

  if (normalized.some((item) => item.includes('wifi') || item.includes('internet'))) icons.push(Wifi)
  if (normalized.some((item) => item.includes('ac') || item.includes('air'))) icons.push(Snowflake)
  if (normalized.some((item) => item.includes('tv'))) icons.push(Tv)
  if (normalized.some((item) => item.includes('bath'))) icons.push(Bath)
  if (normalized.some((item) => item.includes('laundry') || item.includes('wash'))) icons.push(WashingMachine)
  if (normalized.some((item) => item.includes('kitchen') || item.includes('dining') || item.includes('cook'))) icons.push(CookingPot)
  if (normalized.some((item) => item.includes('maintenance'))) icons.push(Wrench)

  if (!icons.length) icons.push(Wifi)
  return icons.slice(0, 4)
}

function DormsPage() {
  const [dorms, setDorms] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [requestState, setRequestState] = useState('')
  const [actionInFlightId, setActionInFlightId] = useState('')

  const [query, setQuery] = useState('')
  const [inventoryView, setInventoryView] = useState('all')
  const [selectedBlock, setSelectedBlock] = useState('All Blocks')
  const [selectedStatus, setSelectedStatus] = useState('All Statuses')
  const [sortBy, setSortBy] = useState('dorm')

  const [editingRoomId, setEditingRoomId] = useState('')
  const [editForm, setEditForm] = useState({
    floor: '',
    type: '',
    seatCount: 1,
    occupiedSeats: 0,
    status: 'Open',
    priceMonthly: 0,
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [{ data: dormData }, { data: roomData }] = await Promise.all([api.get('/dorms'), api.get('/rooms')])
      setDorms(dormData.dorms || [])
      setRooms(roomData.rooms || [])
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to load dorm and room data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const roomRows = useMemo(() => {
    return rooms.map((room) => ({
      id: room._id,
      image: room.images?.[0] || PLACEHOLDER_IMAGE,
      dorm: room.dorm?.name || 'Dorm not assigned',
      block: room.dorm?.block || 'Block N/A',
      floor: room.floor || 'Floor N/A',
      room: room.roomNumber || 'Unknown',
      type: room.type || 'Unknown',
      facilities: mapAmenityIcons(room.amenities),
      price: `BDT ${room.priceMonthly || 0}`,
      priceValue: Number(room.priceMonthly || 0),
      priceSub: 'per month',
      status: room.status || 'Open',
      seatCount: Number(room.seatCount || 0),
      occupiedSeats: Number(room.occupiedSeats || 0),
    }))
  }, [rooms])

  const stats = useMemo(() => {
    const totalSeats = rooms.reduce((sum, room) => sum + Number(room.seatCount || 0), 0)
    const occupiedSeats = rooms.reduce((sum, room) => sum + Number(room.occupiedSeats || 0), 0)
    const availableRooms = rooms.filter((room) => (Number(room.seatCount || 0) - Number(room.occupiedSeats || 0)) > 0).length
    const maintenanceRooms = rooms.filter((room) => room.status === 'Maintenance').length
    const occupancyRate = totalSeats === 0 ? 0 : Math.round((occupiedSeats / totalSeats) * 100)

    return [
      {
        title: 'Total Dorms',
        value: `${dorms.length} Buildings`,
        tag: 'Active',
        tagClass: 'text-emerald-600 bg-emerald-50',
        icon: Building,
        iconWrap: 'bg-blue-50 text-blue-700',
      },
      {
        title: 'Total Rooms',
        value: `${rooms.length} Units`,
        icon: DoorClosed,
        iconWrap: 'bg-indigo-50 text-indigo-700',
      },
      {
        title: 'Available Now',
        value: `${availableRooms} Rooms`,
        tag: `${occupancyRate}% Occ.`,
        tagClass: 'text-primary',
        icon: CheckCircle2,
        iconWrap: 'bg-emerald-50 text-emerald-700',
      },
      {
        title: 'Under Maintenance',
        value: `${maintenanceRooms} Rooms`,
        icon: Wrench,
        iconWrap: 'bg-amber-50 text-amber-700',
      },
    ]
  }, [dorms.length, rooms])

  const blockOptions = useMemo(() => {
    return ['All Blocks', ...new Set(roomRows.map((row) => row.block))]
  }, [roomRows])

  const filteredRows = useMemo(() => {
    const search = query.trim().toLowerCase()
    const statusPriority = {
      Open: 0,
      Limited: 1,
      Full: 2,
      Maintenance: 3,
    }

    let rows = roomRows.filter((row) => {
      const matchesSearch =
        search === '' ||
        row.dorm.toLowerCase().includes(search) ||
        row.room.toLowerCase().includes(search) ||
        row.type.toLowerCase().includes(search) ||
        row.block.toLowerCase().includes(search)

      const matchesView =
        inventoryView === 'all' ||
        (inventoryView === 'maintenance' && row.status === 'Maintenance') ||
        inventoryView === 'block'

      const matchesBlock = selectedBlock === 'All Blocks' || row.block === selectedBlock
      const matchesStatus = selectedStatus === 'All Statuses' || row.status === selectedStatus

      return matchesSearch && matchesView && matchesBlock && matchesStatus
    })

    rows = [...rows].sort((a, b) => {
      if (sortBy === 'price-high') return b.priceValue - a.priceValue
      if (sortBy === 'price-low') return a.priceValue - b.priceValue
      if (sortBy === 'room') return a.room.localeCompare(b.room)
      if (sortBy === 'status') return statusPriority[a.status] - statusPriority[b.status]
      return a.dorm.localeCompare(b.dorm)
    })

    return rows
  }, [inventoryView, query, roomRows, selectedBlock, selectedStatus, sortBy])

  const resetFilters = () => {
    setQuery('')
    setInventoryView('all')
    setSelectedBlock('All Blocks')
    setSelectedStatus('All Statuses')
    setSortBy('dorm')
  }

  const exportCsv = () => {
    const header = ['Dorm', 'Block', 'Floor', 'Room', 'Type', 'Status', 'Seat Count', 'Occupied Seats', 'Price Monthly']
    const body = filteredRows.map((row) => [
      row.dorm,
      row.block,
      row.floor,
      row.room,
      row.type,
      row.status,
      String(row.seatCount),
      String(row.occupiedSeats),
      String(row.priceValue),
    ])

    const csv = [header, ...body]
      .map((line) => line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'dormdoor-room-inventory.csv'
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const openEditModal = (row) => {
    setEditingRoomId(row.id)
    setEditForm({
      floor: row.floor,
      type: row.type,
      seatCount: row.seatCount,
      occupiedSeats: row.occupiedSeats,
      status: row.status,
      priceMonthly: row.priceValue,
    })
    setRequestState('')
  }

  const closeEditModal = () => {
    setEditingRoomId('')
    setRequestState('')
  }

  const updateEditField = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleRoomUpdate = async (event) => {
    event.preventDefault()
    if (!editingRoomId) return

    const nextSeatCount = Math.max(1, Number(editForm.seatCount || 1))
    const nextOccupiedSeats = Math.max(0, Math.min(Number(editForm.occupiedSeats || 0), nextSeatCount))

    setActionInFlightId(editingRoomId)
    setRequestState('')

    try {
      await api.patch(`/rooms/${editingRoomId}`, {
        floor: editForm.floor,
        type: editForm.type,
        seatCount: nextSeatCount,
        occupiedSeats: nextOccupiedSeats,
        status: editForm.status,
        priceMonthly: Number(editForm.priceMonthly || 0),
      })
      setRequestState('Room updated successfully.')
      await loadData()
      setTimeout(() => closeEditModal(), 400)
    } catch (requestError) {
      setRequestState(requestError.response?.data?.message || 'Failed to update room.')
    } finally {
      setActionInFlightId('')
    }
  }

  const handleRoomDelete = async (roomId, roomLabel) => {
    const confirmed = window.confirm(`Delete room ${roomLabel}? This action cannot be undone.`)
    if (!confirmed) return

    setActionInFlightId(roomId)
    setRequestState('')

    try {
      await api.delete(`/rooms/${roomId}`)
      await loadData()
      setRequestState(`Room ${roomLabel} deleted successfully.`)
    } catch (requestError) {
      setRequestState(requestError.response?.data?.message || 'Failed to delete room.')
    } finally {
      setActionInFlightId('')
    }
  }

  return (
    <AdminLayout
      activeKey="dorms"
      topbarProps={{
        searchPlaceholder: 'Search dorms or room numbers...',
        profileName: 'Alex Sterling',
        profileRole: 'Admin Head',
        avatar: topbarAvatars.admin,
      }}
      contentClassName="p-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.08em] text-secondary">
              Inventory Management
            </p>
            <h2 className="text-3xl font-bold tracking-tight">Manage Dorms and Rooms</h2>
          </div>
          <div className="flex gap-3">
            <Link
              to="/admin/dorms/add"
              className="flex items-center gap-2 rounded-lg border border-[#ece7e4] bg-white px-6 py-3 text-sm font-semibold text-primary transition-all hover:bg-[#f6f3f2]"
            >
              <Building2 size={18} /> Add Dorm
            </Link>
            <Link
              to="/admin/rooms/add"
              className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white shadow-soft transition-all hover:brightness-110"
            >
              <span className="text-lg leading-none">+</span> Add Room
            </Link>
          </div>
        </div>

        {error ? (
          <p className="mb-6 rounded-xl bg-[#ffe9ec] px-4 py-3 text-sm font-semibold text-[#c73535]">{error}</p>
        ) : null}
        {requestState ? (
          <p className="mb-6 rounded-xl bg-[#e8f0f7] px-4 py-3 text-sm font-semibold text-[#4e6875]">{requestState}</p>
        ) : null}

        <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-4">
          {stats.map((stat) => {
            const StatIcon = stat.icon
            return (
              <div key={stat.title} className="rounded-xl border border-[#ece7e4] bg-white p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div className={`rounded-lg p-2 ${stat.iconWrap}`}>
                    <StatIcon size={18} />
                  </div>
                  {stat.tag ? (
                    <span className={`rounded px-2 py-1 text-xs font-bold ${stat.tagClass}`}>
                      {stat.tag}
                    </span>
                  ) : null}
                </div>
                <p className="mb-1 text-sm text-secondary">{stat.title}</p>
                <p className="text-2xl font-bold">{loading ? '...' : stat.value}</p>
              </div>
            )
          })}
        </div>

        <div className="overflow-hidden rounded-[1.25rem] border border-[#ece7e4] bg-white shadow-sm">
          <div className="flex flex-col items-center justify-between gap-4 border-b border-[#f0ebea] p-6 md:flex-row">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setInventoryView('all')}
                className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                  inventoryView === 'all'
                    ? 'bg-primary text-white'
                    : 'text-secondary hover:bg-[#f2efee]'
                }`}
              >
                All Inventory
              </button>
              <button
                type="button"
                onClick={() => setInventoryView('block')}
                className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                  inventoryView === 'block'
                    ? 'bg-primary text-white'
                    : 'text-secondary hover:bg-[#f2efee]'
                }`}
              >
                By Block
              </button>
              <button
                type="button"
                onClick={() => setInventoryView('maintenance')}
                className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                  inventoryView === 'maintenance'
                    ? 'bg-primary text-white'
                    : 'text-secondary hover:bg-[#f2efee]'
                }`}
              >
                Maintenance Needed
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={resetFilters}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-secondary"
              >
                <Filter size={16} /> Reset Filters
              </button>
              <button
                type="button"
                onClick={exportCsv}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-secondary"
              >
                <Download size={16} /> Export CSV
              </button>
            </div>
          </div>

          <div className="grid gap-3 border-b border-[#f0ebea] p-6 md:grid-cols-[1.4fr_repeat(3,minmax(0,1fr))]">
            <label className="relative block">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-secondary">
                <Search size={16} />
              </span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search dorm, room, type, or block"
                className="w-full rounded-lg border border-[#ece7e4] bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary"
              />
            </label>

            <select
              value={selectedBlock}
              onChange={(event) => setSelectedBlock(event.target.value)}
              className="rounded-lg border border-[#ece7e4] bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
            >
              {blockOptions.map((block) => (
                <option key={block} value={block}>
                  {block}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
              className="rounded-lg border border-[#ece7e4] bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
            >
              {['All Statuses', 'Open', 'Limited', 'Full', 'Maintenance'].map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="rounded-lg border border-[#ece7e4] bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
            >
              <option value="dorm">Sort: Dorm Name</option>
              <option value="room">Sort: Room Number</option>
              <option value="status">Sort: Availability</option>
              <option value="price-low">Sort: Price Low to High</option>
              <option value="price-high">Sort: Price High to Low</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead className="bg-[#faf7f6]">
                <tr>
                  {['Dorm Name and Block', 'Room Details', 'Facilities', 'Pricing', 'Availability', 'Actions'].map(
                    (head) => (
                      <th
                        key={head}
                        className="px-6 py-5 text-[11px] font-black uppercase tracking-[0.18em] text-secondary"
                      >
                        {head}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr className="border-t border-[#f0ebea]">
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-secondary">
                      Loading room inventory...
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr className="border-t border-[#f0ebea]">
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-secondary">
                      No rooms match the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => {
                    const statusStyle = getStatusStyle(row.status)
                    return (
                      <tr key={row.id} className="border-t border-[#f0ebea]">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <img src={row.image} alt={row.dorm} className="h-14 w-14 rounded-xl object-cover" />
                            <div>
                              <p className="text-[16px] font-bold leading-6">{row.dorm}</p>
                              <p className="text-sm text-secondary">
                                {row.block} - {row.floor}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <p className="font-semibold">{row.room}</p>
                          <span className="mt-2 inline-block rounded-md bg-[#dce6ef] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-secondary">
                            {row.type}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            {row.facilities.map((Facility, index) => (
                              <span key={index} className="rounded-md bg-[#f2efee] p-2 text-secondary">
                                <Facility size={16} />
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-[16px] font-bold">{row.price}</p>
                          <p className="text-xs text-secondary">{row.priceSub}</p>
                        </td>
                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-semibold ring-1 ${statusStyle.badge}`}
                          >
                            <span className={`h-2.5 w-2.5 rounded-full ${statusStyle.dot}`} />
                            {statusStyle.label}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(row)}
                              className="rounded-lg p-2 text-primary hover:bg-blue-50"
                            >
                              <PencilLine size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRoomDelete(row.id, row.room)}
                              disabled={actionInFlightId === row.id}
                              className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-6 py-5 text-sm text-secondary">
            <p>
              Showing {filteredRows.length} of {roomRows.length} rooms
            </p>
            <div className="flex items-center gap-2">
              <button type="button" className="rounded-lg p-2 hover:bg-[#f2efee]">
                <ChevronLeft size={16} />
              </button>
              <button type="button" className="rounded-lg bg-primary px-3 py-2 text-white">1</button>
              <button type="button" className="rounded-lg px-3 py-2 hover:bg-[#f2efee]">2</button>
              <button type="button" className="rounded-lg px-3 py-2 hover:bg-[#f2efee]">3</button>
              <button type="button" className="rounded-lg p-2 hover:bg-[#f2efee]">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

      </div>

      {editingRoomId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <form onSubmit={handleRoomUpdate} className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-2xl font-extrabold">Edit Room</h3>
            <p className="mt-2 text-sm text-secondary">Update room details and seat availability.</p>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-secondary">
                Floor
                <input
                  value={editForm.floor}
                  onChange={(event) => updateEditField('floor', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-[#ece7e4] px-3 py-2 outline-none focus:border-primary"
                />
              </label>

              <label className="text-sm font-semibold text-secondary">
                Room Type
                <select
                  value={editForm.type}
                  onChange={(event) => updateEditField('type', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-[#ece7e4] px-3 py-2 outline-none focus:border-primary"
                >
                  {['Single Room', 'Double Room', 'Shared (4 Bed)', 'Studio Suite', 'Premium Studio'].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-semibold text-secondary">
                Seat Count
                <input
                  type="number"
                  min="1"
                  value={editForm.seatCount}
                  onChange={(event) => updateEditField('seatCount', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-[#ece7e4] px-3 py-2 outline-none focus:border-primary"
                />
              </label>

              <label className="text-sm font-semibold text-secondary">
                Occupied Seats
                <input
                  type="number"
                  min="0"
                  value={editForm.occupiedSeats}
                  onChange={(event) => updateEditField('occupiedSeats', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-[#ece7e4] px-3 py-2 outline-none focus:border-primary"
                />
              </label>

              <label className="text-sm font-semibold text-secondary">
                Monthly Price
                <input
                  type="number"
                  min="0"
                  value={editForm.priceMonthly}
                  onChange={(event) => updateEditField('priceMonthly', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-[#ece7e4] px-3 py-2 outline-none focus:border-primary"
                />
              </label>

              <label className="text-sm font-semibold text-secondary">
                Status
                <select
                  value={editForm.status}
                  onChange={(event) => updateEditField('status', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-[#ece7e4] px-3 py-2 outline-none focus:border-primary"
                >
                  {['Open', 'Limited', 'Full', 'Maintenance'].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-6 flex items-center justify-between">
              {requestState ? <p className="text-sm font-semibold text-secondary">{requestState}</p> : <span />}
              <div className="flex gap-3">
                <button type="button" onClick={closeEditModal} className="rounded-lg px-4 py-2 font-semibold text-secondary hover:bg-[#f2efee]">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionInFlightId === editingRoomId}
                  className="rounded-lg bg-primary px-5 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {actionInFlightId === editingRoomId ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : null}
    </AdminLayout>
  )
}

export default DormsPage
