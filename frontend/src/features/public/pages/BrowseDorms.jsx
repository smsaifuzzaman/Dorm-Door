import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import DormCard from '../components/DormCard'
import PageShell from '../components/PageShell'
import { browseDorms } from '../data/dormData'

const BLOCK_OPTIONS = ['Block A (North)', 'Block B (South)', 'Executive Annex']
const AMENITY_OPTIONS = [
  ['wifi', 'WiFi'],
  ['ac_unit', 'AC'],
  ['bathroom', 'Bath'],
  ['local_laundry_service', 'Laundry'],
]
const STATUS_OPTIONS = [
  ['bg-emerald-500', 'Available'],
  ['bg-amber-500', 'Limited Seats'],
  ['bg-red-500', 'Full'],
]

function priceToNumber(price) {
  const numeric = String(price || '').replace(/[^\d]/g, '')
  return numeric ? Number(numeric) : 0
}

function parseCsvParam(value) {
  if (!value) return []
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function BrowseDorms() {
  const [searchParams] = useSearchParams()

  const roomTypeOptions = useMemo(() => {
    return ['All Types', ...new Set(browseDorms.map((dorm) => dorm.type))]
  }, [])

  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('q') || '')
  const [selectedBlocks, setSelectedBlocks] = useState(() =>
    parseCsvParam(searchParams.get('blocks')).filter((block) => BLOCK_OPTIONS.includes(block)),
  )
  const [selectedRoomType, setSelectedRoomType] = useState(() => {
    const fromQuery = searchParams.get('roomType')
    return roomTypeOptions.includes(fromQuery) ? fromQuery : 'All Types'
  })
  const [maxBudget, setMaxBudget] = useState(() => {
    const fromQuery = Number(searchParams.get('maxBudget'))
    if (!Number.isFinite(fromQuery) || fromQuery <= 0) return 15000
    return Math.max(2500, Math.min(fromQuery, 15000))
  })
  const [selectedAmenities, setSelectedAmenities] = useState(() =>
    parseCsvParam(searchParams.get('amenities')).filter((amenity) =>
      AMENITY_OPTIONS.some(([, label]) => label === amenity),
    ),
  )
  const [selectedStatuses, setSelectedStatuses] = useState(() =>
    parseCsvParam(searchParams.get('statuses')).filter((status) =>
      STATUS_OPTIONS.some(([, label]) => label === status),
    ),
  )
  const [sortBy, setSortBy] = useState(() => searchParams.get('sortBy') || 'availability')

  const filteredDorms = useMemo(() => {
    const availabilityRank = {
      Available: 0,
      'Limited Seats': 1,
      Full: 2,
    }

    const filtered = browseDorms.filter((dorm) => {
      const matchesSearch =
        searchTerm.trim() === '' ||
        dorm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dorm.location.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesBlock = selectedBlocks.length === 0 || selectedBlocks.includes(dorm.block)
      const matchesRoomType = selectedRoomType === 'All Types' || dorm.type === selectedRoomType
      const matchesBudget = priceToNumber(dorm.price) <= maxBudget

      const matchesAmenities =
        selectedAmenities.length === 0 ||
        selectedAmenities.every((amenity) => dorm.amenities.includes(amenity))

      const matchesStatus =
        selectedStatuses.length === 0 || selectedStatuses.includes(dorm.status)

      return (
        matchesSearch &&
        matchesBlock &&
        matchesRoomType &&
        matchesBudget &&
        matchesAmenities &&
        matchesStatus
      )
    })

    return filtered.sort((a, b) => {
      if (sortBy === 'price-low') {
        return priceToNumber(a.price) - priceToNumber(b.price)
      }

      if (sortBy === 'price-high') {
        return priceToNumber(b.price) - priceToNumber(a.price)
      }

      if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      }

      return availabilityRank[a.status] - availabilityRank[b.status]
    })
  }, [
    maxBudget,
    searchTerm,
    selectedAmenities,
    selectedBlocks,
    selectedRoomType,
    selectedStatuses,
    sortBy,
  ])

  const toggleSelection = (items, setItems, value) => {
    if (items.includes(value)) {
      setItems(items.filter((item) => item !== value))
      return
    }

    setItems([...items, value])
  }

  return (
    <PageShell buttonLabel="Login / Dashboard" buttonTo="/login">
      <main className="mx-auto max-w-[1440px] px-6 pb-20 pt-24 md:px-12">
        <header className="mb-12">
          <div className="max-w-3xl">
            <h1 className="mb-4 text-5xl font-extrabold tracking-tight text-on-surface">Browse Dorms</h1>
            <p className="mb-8 text-lg font-medium text-secondary">
              Find available dorms by room type, price, and facilities in our curated sanctuary.
            </p>
          </div>

          <div className="group relative max-w-2xl">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline transition group-focus-within:text-primary">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Quick search by name or location..."
              className="w-full rounded-xl border-none bg-surface-container py-4 pl-12 pr-6 text-on-surface shadow-sm transition focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary"
            />
          </div>
        </header>

        <div className="flex flex-col gap-12 md:flex-row">
          <aside className="w-full md:w-1/4">
            <div className="sticky top-28 space-y-8">
              <section>
                <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Block / Building</h3>
                <div className="space-y-3">
                  {BLOCK_OPTIONS.map((item) => (
                    <label key={item} className="group flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedBlocks.includes(item)}
                        onChange={() => toggleSelection(selectedBlocks, setSelectedBlocks, item)}
                        className="h-5 w-5 rounded border-outline-variant text-primary focus:ring-primary"
                      />
                      <span className="text-sm font-medium text-secondary transition group-hover:text-on-surface">{item}</span>
                    </label>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Room Type</h3>
                <div className="grid gap-2">
                  {roomTypeOptions.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedRoomType(type)}
                      className={`rounded-lg px-4 py-2 text-left text-sm font-bold transition ${
                        selectedRoomType === type
                          ? 'bg-secondary-fixed text-on-secondary-fixed'
                          : 'text-secondary hover:bg-surface-container-high'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Budget Range (Monthly)</h3>
                <input
                  type="range"
                  min={2500}
                  max={15000}
                  step={500}
                  value={maxBudget}
                  onChange={(event) => setMaxBudget(Number(event.target.value))}
                  className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-surface-container-high accent-primary"
                />
                <div className="mt-2 flex justify-between text-[10px] font-bold text-outline">
                  <span>BDT 2,500</span>
                  <span>Up to BDT {maxBudget.toLocaleString()}</span>
                </div>
              </section>

              <section>
                <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Amenities</h3>
                <div className="grid grid-cols-2 gap-2">
                  {AMENITY_OPTIONS.map(([icon, label]) => {
                    const active = selectedAmenities.includes(label)
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => toggleSelection(selectedAmenities, setSelectedAmenities, label)}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-[11px] font-bold transition ${
                          active
                            ? 'border-transparent bg-secondary-container text-on-secondary-container'
                            : 'border-outline-variant/20 bg-surface-container-lowest hover:border-primary'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">{icon}</span>
                        {label}
                      </button>
                    )
                  })}
                </div>
              </section>

              <section>
                <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Availability</h3>
                <div className="space-y-3">
                  {STATUS_OPTIONS.map(([color, label]) => (
                    <label key={label} className="group flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedStatuses.includes(label)}
                        onChange={() => toggleSelection(selectedStatuses, setSelectedStatuses, label)}
                        className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"
                      />
                      <div className={`h-3 w-3 rounded-full ${color}`} />
                      <span className="text-sm font-medium text-secondary transition group-hover:text-on-surface">{label}</span>
                    </label>
                  ))}
                </div>
              </section>
            </div>
          </aside>

          <div className="w-full md:w-3/4">
            <div className="mb-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
              <p className="text-sm font-medium text-secondary">
                Showing <span className="font-bold text-on-surface">{filteredDorms.length}</span> matching dormitory spaces
              </p>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-widest text-outline">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  className="rounded-lg border-none bg-surface-container py-2 pl-4 pr-10 text-sm font-bold focus:ring-2 focus:ring-primary"
                >
                  <option value="availability">Availability</option>
                  <option value="price-low">Price (Low to High)</option>
                  <option value="price-high">Price (High to Low)</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>
            </div>

            {filteredDorms.length === 0 ? (
              <div className="rounded-2xl bg-surface-container-low px-6 py-12 text-center">
                <h3 className="text-xl font-bold text-on-surface">No matching dorms found</h3>
                <p className="mt-3 text-secondary">Try clearing one or two filters to see more options.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {filteredDorms.map((dorm) => (
                  <DormCard key={dorm.id} dorm={dorm} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </PageShell>
  )
}

export default BrowseDorms
