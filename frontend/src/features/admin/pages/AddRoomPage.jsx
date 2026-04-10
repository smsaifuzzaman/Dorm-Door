import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../components/layout/AdminLayout'
import Icon from '../components/Icon'
import { roomGallery, topbarAvatars } from '../data/dashboardData'
import { api } from '../../../api/client'

const amenityOptions = [
  { id: 'wifi', title: 'High-speed Wi-Fi', subtitle: 'Fiber Optic' },
  { id: 'bath', title: 'Attached Bath', subtitle: 'Private' },
  { id: 'balcony', title: 'Balcony', subtitle: 'City View' },
  { id: 'ac', title: 'Air Conditioning', subtitle: 'Smart Control' },
  { id: 'desk', title: 'Study Desk', subtitle: 'Ergonomic' },
  { id: 'cleaning', title: 'Housekeeping', subtitle: 'Weekly' },
]

const initialAmenities = {
  wifi: false,
  bath: true,
  balcony: false,
  ac: false,
  desk: false,
  cleaning: false,
}

const typeOptions = ['Single Room', 'Double Room', 'Shared (4 Bed)', 'Studio Suite', 'Premium Studio']

function FormSection({ title, icon, children }) {
  return (
    <section className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-8 shadow-sm">
      <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-on-surface">
        <Icon name={icon} className="text-primary" />
        {title}
      </h3>
      {children}
    </section>
  )
}

function Label({ children }) {
  return <label className="text-xs font-bold uppercase tracking-wider text-on-secondary-container">{children}</label>
}

function AddRoomPage() {
  const navigate = useNavigate()
  const [dorms, setDorms] = useState([])
  const [loadingDorms, setLoadingDorms] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [seatCount, setSeatCount] = useState(1)
  const [price, setPrice] = useState('15000')
  const [roomNumber, setRoomNumber] = useState('')
  const [floorLevel, setFloorLevel] = useState('2nd Floor')
  const [roomType, setRoomType] = useState('Single Room')
  const [building, setBuilding] = useState('')
  const [amenities, setAmenities] = useState(initialAmenities)
  const [uploadedName, setUploadedName] = useState('')
  const [imageUrl, setImageUrl] = useState('')

  useEffect(() => {
    async function loadDorms() {
      setLoadingDorms(true)
      setError('')

      try {
        const { data } = await api.get('/dorms')
        const records = data.dorms || []
        setDorms(records)
        if (records[0]) {
          setBuilding(records[0]._id)
        }
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Failed to load dorm list.')
      } finally {
        setLoadingDorms(false)
      }
    }

    loadDorms()
  }, [])

  const selectedAmenities = useMemo(
    () => amenityOptions.filter((item) => amenities[item.id]).map((item) => item.title),
    [amenities],
  )

  const selectedBuildingName = useMemo(() => {
    const dorm = dorms.find((item) => item._id === building)
    return dorm ? `${dorm.name} (${dorm.block})` : 'Not selected'
  }, [building, dorms])

  const toggleAmenity = (id) => {
    setAmenities((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleCreateRoom = async () => {
    setMessage('')
    setError('')

    if (!building) {
      setError('Select a dorm before creating a room.')
      return
    }

    if (!roomNumber.trim()) {
      setError('Room number is required.')
      return
    }

    setSaving(true)

    try {
      await api.post('/rooms', {
        dorm: building,
        roomNumber: roomNumber.trim(),
        floor: floorLevel,
        type: roomType,
        seatCount: Math.max(1, Number(seatCount || 1)),
        occupiedSeats: 0,
        priceMonthly: Math.max(0, Number(price || 0)),
        amenities: selectedAmenities,
        images: imageUrl.trim() ? [imageUrl.trim()] : [],
      })

      setMessage('Room created successfully. Redirecting...')
      setTimeout(() => navigate('/admin/availability'), 500)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to create room.')
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setSeatCount(1)
    setPrice('15000')
    setRoomNumber('')
    setFloorLevel('2nd Floor')
    setRoomType('Single Room')
    setAmenities(initialAmenities)
    setUploadedName('')
    setImageUrl('')
    setMessage('')
    setError('')
  }

  return (
    <AdminLayout
      activeKey="dorms"
      sidebarVariant="atelier-badge"
      topbarProps={{
        searchPlaceholder: 'Quick search...',
        showBrand: true,
        brandText: 'DormManager',
        profileName: 'Admin Profile',
        profileRole: 'Housing Administration',
        avatar: topbarAvatars.admin,
        showHelp: false,
      }}
      mainClassName="bg-background"
      contentClassName="px-8 pb-12 pt-8"
    >
      <div className="mx-auto max-w-5xl">
        <div className="mb-10">
          <div className="mb-2 flex items-center gap-2 text-on-secondary-container">
            <span className="text-xs font-bold uppercase tracking-widest">Administrative Portal</span>
            <Icon name="chevron_right" className="text-xs" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Add New Room</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">Create Sanctuary Space</h1>
          <p className="mt-2 text-lg text-secondary">Define a new premium living environment for students.</p>
          {error ? <p className="mt-3 text-sm font-semibold text-error">{error}</p> : null}
          {message ? <p className="mt-3 text-sm font-semibold text-primary">{message}</p> : null}
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          <div className="space-y-8 md:col-span-8">
            <FormSection title="Room Essentials" icon="info">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label>Dormitory/Building</Label>
                  <select
                    value={building}
                    onChange={(e) => setBuilding(e.target.value)}
                    className="rounded-lg border-none bg-surface-container-high px-4 py-3 focus:ring-2 focus:ring-primary"
                  >
                    {loadingDorms ? <option>Loading dorms...</option> : null}
                    {!loadingDorms && dorms.length === 0 ? <option value="">No dorms available</option> : null}
                    {dorms.map((dorm) => (
                      <option key={dorm._id} value={dorm._id}>
                        {dorm.name} ({dorm.block})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Room Number</Label>
                  <input
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="e.g. 402B"
                    className="rounded-lg border-none bg-surface-container-high px-4 py-3 focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Floor Level</Label>
                  <select
                    value={floorLevel}
                    onChange={(e) => setFloorLevel(e.target.value)}
                    className="rounded-lg border-none bg-surface-container-high px-4 py-3 focus:ring-2 focus:ring-primary"
                  >
                    <option>Ground Floor</option>
                    <option>1st Floor</option>
                    <option>2nd Floor</option>
                    <option>3rd Floor</option>
                    <option>4th Floor</option>
                    <option>Penthouse</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Room Type</Label>
                  <select
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value)}
                    className="rounded-lg border-none bg-surface-container-high px-4 py-3 focus:ring-2 focus:ring-primary"
                  >
                    {typeOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>
            </FormSection>

            <FormSection title="Capacity & Pricing" icon="payments">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label>Seat/Bed Count</Label>
                  <div className="flex items-center rounded-lg bg-surface-container-high px-2">
                    <button
                      type="button"
                      onClick={() => setSeatCount((value) => Math.max(1, value - 1))}
                      className="p-2 transition-colors hover:text-primary"
                    >
                      <Icon name="remove_circle" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={seatCount}
                      onChange={(e) => setSeatCount(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full border-none bg-transparent py-3 text-center focus:ring-0"
                    />
                    <button
                      type="button"
                      onClick={() => setSeatCount((value) => value + 1)}
                      className="p-2 transition-colors hover:text-primary"
                    >
                      <Icon name="add_circle" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Monthly Price (BDT)</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary">BDT</span>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full rounded-lg border-none bg-surface-container-high py-3 pl-10 pr-4 focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            </FormSection>

            <FormSection title="Select Amenities" icon="grid_view">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {amenityOptions.map((item) => (
                  <label
                    key={item.id}
                    className="cursor-pointer rounded-lg bg-secondary-container/30 p-4 transition-colors hover:bg-secondary-container/50"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={amenities[item.id]}
                        onChange={() => toggleAmenity(item.id)}
                        className="h-5 w-5 rounded border-none text-primary focus:ring-primary"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">{item.title}</span>
                        <span className="text-[10px] uppercase text-on-secondary-container/70">{item.subtitle}</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </FormSection>
          </div>

          <div className="space-y-8 md:col-span-4">
            <FormSection title="Room Visuals" icon="add_a_photo">
              <label className="group flex aspect-square w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-outline-variant bg-surface-container-low p-6 text-center transition-all duration-300 hover:border-primary hover:bg-white">
                <Icon name="cloud_upload" className="mb-3 text-4xl text-secondary transition-transform group-hover:scale-110 group-hover:text-primary" />
                <p className="text-sm font-bold text-on-surface">Upload Property Photo</p>
                <p className="mt-1 text-xs text-secondary">{uploadedName || 'PNG, JPG up to 10MB'}</p>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    setUploadedName(file?.name || '')
                  }}
                />
              </label>

              <div className="mt-4">
                <label className="text-xs font-bold uppercase tracking-wider text-secondary">Image URL (Optional)</label>
                <input
                  value={imageUrl}
                  onChange={(event) => setImageUrl(event.target.value)}
                  placeholder="https://example.com/room.jpg"
                  className="mt-2 w-full rounded-lg border-none bg-surface-container-high px-4 py-3 text-sm focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="aspect-square overflow-hidden rounded-lg border border-outline-variant/20 bg-surface-container-high">
                  <img src={imageUrl || roomGallery[0]} alt="Room preview" className="h-full w-full object-cover" />
                </div>
                <div className="flex aspect-square items-center justify-center rounded-lg bg-surface-container-high">
                  <Icon name="add" className="text-secondary text-sm" />
                </div>
                <div className="flex aspect-square items-center justify-center rounded-lg bg-surface-container-high">
                  <Icon name="add" className="text-secondary text-sm" />
                </div>
              </div>
            </FormSection>

            <section className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-8 shadow-sm">
              <div className="space-y-4">
                <div className="rounded-xl bg-surface-container-low p-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-secondary">Live Summary</p>
                  <div className="mt-3 space-y-2 text-sm text-on-surface">
                    <p>
                      <span className="font-semibold">Building:</span> {selectedBuildingName}
                    </p>
                    <p>
                      <span className="font-semibold">Room:</span> {roomNumber || 'Not set yet'}
                    </p>
                    <p>
                      <span className="font-semibold">Type:</span> {roomType}
                    </p>
                    <p>
                      <span className="font-semibold">Capacity:</span> {seatCount} bed{seatCount > 1 ? 's' : ''}
                    </p>
                    <p>
                      <span className="font-semibold">Price:</span> BDT {price || '0'} / month
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-secondary-container/20 p-5">
                  <p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary">Selected Amenities</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedAmenities.length ? (
                      selectedAmenities.map((item) => (
                        <span key={item} className="rounded-full bg-white px-3 py-1.5 text-[10px] font-bold text-on-surface shadow-sm">
                          {item}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-secondary">No amenities selected yet.</p>
                    )}
                  </div>
                </div>

                <button type="button" onClick={handleCreateRoom} disabled={saving || loadingDorms} className="w-full rounded-xl bg-gradient-to-br from-primary to-primary-container py-4 font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60">
                  {saving ? 'Creating...' : 'Create Room'}
                </button>
                <button type="button" onClick={resetForm} className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest py-4 font-semibold text-on-surface transition-all hover:bg-surface-container-low">
                  Discard
                </button>

                <div className="rounded-xl border border-tertiary/10 bg-tertiary-container/10 p-6">
                  <div className="flex items-start gap-3">
                    <Icon name="lightbulb" className="text-lg text-tertiary" />
                    <div className="space-y-1">
                      <p className="text-xs font-bold uppercase text-tertiary">Admin Tip</p>
                      <p className="text-sm leading-relaxed text-secondary">
                        Rooms with high-quality photos and detailed amenities receive 40% more applications.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AddRoomPage
