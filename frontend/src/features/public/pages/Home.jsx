import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import DormCard from '../components/DormCard'
import PageShell from '../components/PageShell'
import { browseDorms, featuredDorms } from '../data/dormData'

const QUICK_FILTERS = [
  { key: 'building', icon: 'apartment', label: 'Building' },
  { key: 'budget', icon: 'payments', label: 'Budget' },
  { key: 'roomType', icon: 'hotel', label: 'Room Type' },
  { key: 'amenities', icon: 'local_laundry_service', label: 'Amenities' },
]

const HOME_BUDGET_CAP = 8000

function priceToNumber(price) {
  const numeric = String(price || '').replace(/[^\d]/g, '')
  return numeric ? Number(numeric) : 0
}

function Home() {
  const navigate = useNavigate()
  const [locationQuery, setLocationQuery] = useState('')
  const [selectedRoomType, setSelectedRoomType] = useState('All Room Types')
  const [activeQuickFilters, setActiveQuickFilters] = useState({
    building: false,
    budget: false,
    roomType: false,
    amenities: false,
  })

  const roomTypeOptions = useMemo(
    () => ['All Room Types', ...new Set(browseDorms.map((dorm) => dorm.type))],
    [],
  )

  const effectiveRoomType = useMemo(() => {
    if (selectedRoomType !== 'All Room Types') return selectedRoomType
    if (activeQuickFilters.roomType) return 'Single Room'
    return ''
  }, [selectedRoomType, activeQuickFilters.roomType])

  const filteredDorms = useMemo(() => {
    const query = locationQuery.trim().toLowerCase()

    return featuredDorms.filter((dorm) => {
      const searchableText = `${dorm.location || ''} ${dorm.block || ''} ${dorm.name || ''}`.toLowerCase()
      const matchesLocation = query === '' || searchableText.includes(query)
      const matchesRoomType = !effectiveRoomType || dorm.type === effectiveRoomType
      const matchesBuilding = !activeQuickFilters.building || String(dorm.block || '').toLowerCase().includes('block')
      const matchesBudget = !activeQuickFilters.budget || priceToNumber(dorm.price) <= HOME_BUDGET_CAP
      const matchesAmenities = !activeQuickFilters.amenities || (dorm.amenities || []).includes('Laundry')

      return (
        matchesLocation &&
        matchesRoomType &&
        matchesBuilding &&
        matchesBudget &&
        matchesAmenities
      )
    })
  }, [locationQuery, effectiveRoomType, activeQuickFilters])

  const toggleQuickFilter = (key) => {
    setActiveQuickFilters((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const goToBrowseWithFilters = () => {
    const params = new URLSearchParams()
    const query = locationQuery.trim()
    if (query) params.set('q', query)
    if (effectiveRoomType) params.set('roomType', effectiveRoomType)

    if (activeQuickFilters.building) {
      params.set('blocks', 'Block A (North),Block B (South)')
    }
    if (activeQuickFilters.budget) {
      params.set('maxBudget', String(HOME_BUDGET_CAP))
    }
    if (activeQuickFilters.amenities) {
      params.set('amenities', 'Laundry')
    }

    const queryString = params.toString()
    navigate(queryString ? `/browse-dorms?${queryString}` : '/browse-dorms')
  }

  return (
    <PageShell buttonLabel="Login" buttonTo="/login">
      <main className="pt-24">
        <section className="relative overflow-hidden px-6 min-h-[900px] flex items-center md:px-12">
          <div className="mx-auto grid w-full max-w-screen-2xl grid-cols-1 items-center gap-12 lg:grid-cols-12">
            <div className="z-10 lg:col-span-6">
              <h1 className="mb-6 text-5xl font-extrabold leading-[1.1] tracking-tight text-on-surface md:text-7xl">
                Find Your Perfect <br />
                <span className="text-primary">Dorm Easily</span>
              </h1>
              <p className="mb-10 max-w-lg text-xl leading-relaxed text-secondary">
                Curated student living spaces designed for focus and community. Experience premium housing that feels like home.
              </p>

              <div className="mb-12 flex flex-wrap gap-4">
                <Link to="/browse-dorms" className="rounded-lg bg-gradient-to-br from-primary to-primary-container px-8 py-4 text-lg font-bold text-white transition hover:shadow-xl">
                  Browse Dorms
                </Link>
                <Link to="/apply-now" className="rounded-lg border border-outline-variant/15 bg-surface-container-lowest px-8 py-4 text-lg font-bold text-on-surface transition hover:bg-surface-container">
                  Apply Now
                </Link>
              </div>

              <div className="max-w-xl rounded-xl border border-outline-variant/10 bg-surface-container-lowest/80 p-2 shadow-2xl backdrop-blur-md">
                <div className="flex flex-col md:flex-row md:items-center">
                  <div className="flex-1 border-outline-variant/20 px-6 py-3 md:border-r">
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-secondary">Location</label>
                    <input
                      type="text"
                      value={locationQuery}
                      onChange={(event) => setLocationQuery(event.target.value)}
                      placeholder="Which campus?"
                      className="w-full border-none bg-transparent p-0 text-on-surface placeholder:text-outline-variant focus:ring-0"
                    />
                  </div>
                  <div className="flex-1 px-6 py-3">
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-secondary">Room Type</label>
                    <select
                      value={selectedRoomType}
                      onChange={(event) => setSelectedRoomType(event.target.value)}
                      className="w-full appearance-none border-none bg-transparent p-0 text-on-surface focus:ring-0"
                    >
                      {roomTypeOptions.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={goToBrowseWithFilters}
                    className="m-1 flex aspect-square items-center justify-center rounded-lg bg-primary p-4 text-white transition hover:bg-primary-container"
                    aria-label="Search Dorms"
                    title="Search Dorms"
                  >
                    <span className="material-symbols-outlined">search</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="relative min-h-[500px] lg:col-span-6">
              <div className="absolute inset-0 -rotate-3 scale-105 rounded-[2rem] bg-secondary-container/20" />
              <img
                src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1600&q=80"
                alt="Modern dorm interior"
                className="relative h-[600px] w-full rounded-[2rem] object-cover shadow-2xl transition duration-700 hover:grayscale-0 lg:h-[600px]"
              />
              <div className="absolute -bottom-8 -left-2 z-20 max-w-[220px] rounded-2xl bg-surface-container-lowest p-6 shadow-xl md:-left-8">
                <div className="mb-1 text-3xl font-bold text-primary">98%</div>
                <p className="text-xs font-medium uppercase tracking-wider text-secondary">Student Satisfaction Rating</p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-outline-variant/10 bg-surface-container-low py-12">
          <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center justify-center gap-8 px-6 md:px-12">
            <span className="text-sm font-bold uppercase tracking-widest text-secondary">Quick Filters</span>
            <div className="flex flex-wrap gap-3">
              {QUICK_FILTERS.map((filter) => {
                const active = activeQuickFilters[filter.key]
                return (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => toggleQuickFilter(filter.key)}
                    className={`glass-chip flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition ${
                      active
                        ? 'bg-primary text-white'
                        : 'bg-secondary-container/40 text-on-secondary-container hover:bg-secondary-container'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{filter.icon}</span>
                    {filter.label}
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-screen-2xl px-6 py-24 md:px-12">
          <div className="mb-16 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <h2 className="mb-4 text-4xl font-bold tracking-tight">Curated Residences</h2>
              <p className="max-w-md text-secondary">Hand-picked living spaces that prioritize your academic success and comfort.</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold uppercase tracking-widest text-secondary">
                Showing {filteredDorms.length} match{filteredDorms.length === 1 ? '' : 'es'}
              </p>
              <button type="button" onClick={goToBrowseWithFilters} className="group mt-2 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-primary md:ml-auto">
                Search In Browse
                <span className="material-symbols-outlined transition group-hover:translate-x-1">arrow_forward</span>
              </button>
            </div>
          </div>

          {filteredDorms.length === 0 ? (
            <div className="rounded-2xl bg-surface-container-low px-6 py-12 text-center">
              <h3 className="text-xl font-bold text-on-surface">No dorms match your current filters</h3>
              <p className="mt-3 text-secondary">Adjust location, room type, or quick filters and try again.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
              {filteredDorms.map((dorm) => (
                <DormCard key={dorm.id} dorm={dorm} />
              ))}
            </div>
          )}
        </section>
      </main>
    </PageShell>
  )
}

export default Home
