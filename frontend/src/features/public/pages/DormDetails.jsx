import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageShell from '../components/PageShell'
import { comparableDorms, getDormDetailsById } from '../data/dormData'

const amenityLabelMap = {
  WiFi: 'Wi-Fi',
  AC: 'Air conditioning',
  Bath: 'Attached bath',
  Laundry: 'Laundry',
}

function getRentValue(rent) {
  return Number(String(rent).replace(/[^\d]/g, '')) || 0
}

function formatPriceDifference(currentRent, comparedRent) {
  const difference = getRentValue(comparedRent) - getRentValue(currentRent)

  if (difference === 0) {
    return {
      label: 'Same price',
      detail: 'No monthly rent difference',
      className: 'bg-surface-container-low text-on-surface',
      icon: 'drag_handle',
    }
  }

  const absoluteDifference = Math.abs(difference).toLocaleString('en-US')
  const comparedCostsMore = difference > 0

  return {
    label: `${comparedCostsMore ? '+' : '-'}BDT ${absoluteDifference}/mo`,
    detail: comparedCostsMore ? 'Compared dorm costs more' : 'Compared dorm costs less',
    className: comparedCostsMore ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900',
    icon: comparedCostsMore ? 'trending_up' : 'trending_down',
  }
}

function getAmenityDiff(currentAmenities = [], comparedAmenities = []) {
  const currentSet = new Set(currentAmenities)
  const comparedSet = new Set(comparedAmenities)
  const added = comparedAmenities.filter((amenity) => !currentSet.has(amenity))
  const lost = currentAmenities.filter((amenity) => !comparedSet.has(amenity))

  return { added, lost }
}

function renderAmenityPill(amenity, tone) {
  const toneClass =
    tone === 'added'
      ? 'bg-emerald-100 text-emerald-900 ring-emerald-200'
      : 'bg-red-100 text-red-900 ring-red-200'

  return (
    <span key={amenity} className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${toneClass}`}>
      {amenityLabelMap[amenity] || amenity}
    </span>
  )
}

function DormDetails() {
  const { id } = useParams()
  const [isCompareOpen, setIsCompareOpen] = useState(false)
  const [compareDormId, setCompareDormId] = useState('')
  const [useSimpleComparePicker, setUseSimpleComparePicker] = useState(false)
  const dorm = useMemo(() => getDormDetailsById(id), [id])
  const compareOptions = useMemo(() => comparableDorms.filter((item) => item.id !== id), [id])
  const comparedDorm = useMemo(
    () => compareOptions.find((item) => item.id === compareDormId) || null,
    [compareDormId, compareOptions],
  )

  if (!dorm) {
    return (
      <PageShell buttonLabel="Browse Dorms" buttonTo="/browse-dorms">
        <main className="mx-auto max-w-4xl px-6 pb-20 pt-32 md:px-8">
          <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-10 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Dorm not found</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-on-surface">This listing is unavailable</h1>
            <p className="mt-3 text-secondary">The dorm you opened may have been removed or moved to a different listing.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/browse-dorms" className="rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white">
                Browse Dorms
              </Link>
              <Link to="/" className="rounded-lg border border-outline-variant/20 px-6 py-3 text-sm font-bold text-on-surface">
                Back Home
              </Link>
            </div>
          </div>
        </main>
      </PageShell>
    )
  }

  const mainImage = dorm.gallery[0]
  const galleryGrid = dorm.gallery.slice(1, 4)
  const finalGalleryImage = dorm.gallery[4] || dorm.gallery[0]
  const priceDifference = comparedDorm ? formatPriceDifference(dorm.rent, comparedDorm.rent) : null
  const amenityDifference = comparedDorm ? getAmenityDiff(dorm.amenityTags, comparedDorm.amenityTags) : null

  return (
    <PageShell buttonLabel="Login" buttonTo="/login">
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-28 md:px-8">
        <header className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <span className="rounded-full bg-secondary-container px-3 py-1 text-xs font-bold uppercase tracking-wider text-on-secondary-container">
                {dorm.type}
              </span>
              <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                {dorm.status}
              </span>
            </div>
            <h1 className="mb-1 text-5xl font-black tracking-tighter text-on-surface md:text-6xl">{dorm.name}</h1>
            <p className="flex items-center gap-2 text-lg text-secondary">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                location_on
              </span>
              {dorm.location}
            </p>
          </div>

          <div className="text-left md:text-right">
            <p className="text-sm font-medium uppercase tracking-widest text-secondary">Monthly Rent</p>
            <div className="text-4xl font-extrabold text-primary">
              {dorm.rent}
              <span className="text-lg font-medium text-secondary">/mo</span>
            </div>
          </div>
        </header>

        <section className="mb-12 grid h-auto grid-cols-1 gap-4 md:grid-cols-4 md:grid-rows-2 md:h-[500px]">
          <div className="overflow-hidden rounded-xl bg-surface-container transition hover:scale-[1.01] md:col-span-2 md:row-span-2">
            <img src={mainImage} alt={`${dorm.name} main view`} className="h-full w-full object-cover" />
          </div>
          {galleryGrid.map((image, index) => (
            <div key={image} className="overflow-hidden rounded-xl bg-surface-container transition hover:scale-[1.02]">
              <img src={image} alt={`Gallery ${index + 2}`} className="h-full w-full object-cover" />
            </div>
          ))}
          <div className="group relative overflow-hidden rounded-xl bg-surface-container transition hover:scale-[1.02]">
            <img src={finalGalleryImage} alt={`${dorm.name} exterior`} className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-on-surface/40 opacity-0 transition group-hover:opacity-100">
              <span className="font-bold text-white">+12 Photos</span>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          <div className="space-y-16 lg:col-span-2">
            <section>
              <h2 className="mb-6 text-2xl font-bold tracking-tight">Room Specifications</h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {dorm.specs.map((item) => (
                  <div key={item.label} className="rounded-xl bg-surface-container-low p-6 transition duration-300 hover:bg-surface-container-lowest">
                    <span className="material-symbols-outlined mb-3 text-primary">{item.icon}</span>
                    <p className="text-xs font-bold uppercase tracking-widest text-secondary">{item.label}</p>
                    <p className="text-lg font-bold">{item.value}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-6 text-2xl font-bold tracking-tight">Premium Amenities</h2>
              <div className="flex flex-wrap gap-3">
                {dorm.amenities.map((item) => (
                  <div key={item.label} className="flex cursor-default items-center gap-3 rounded-full bg-secondary-container/50 px-5 py-3 transition hover:bg-secondary-container">
                    <span className="material-symbols-outlined text-on-secondary-container" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {item.icon}
                    </span>
                    <span className="text-sm font-semibold text-on-secondary-container">{item.label}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm ring-1 ring-outline-variant/15">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Room Compare</p>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight">Compare with another dorm</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCompareOpen((value) => !value)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-white transition hover:scale-[1.01]"
                >
                  <span className="material-symbols-outlined text-base">compare_arrows</span>
                  {isCompareOpen ? 'Hide Compare' : 'Compare Dorm'}
                </button>
              </div>

              {isCompareOpen ? (
                <div className="mt-6 space-y-6">
                  <div className="flex flex-col gap-3 rounded-xl bg-surface-container-low p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-bold text-on-surface">Choose the room page to compare</p>
                      <p className="text-sm text-secondary">Pick from the dorm room cards below, or switch back to the simple dropdown.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUseSimpleComparePicker((value) => !value)}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant/30 px-4 py-2 text-sm font-bold text-on-surface transition hover:border-primary hover:text-primary"
                    >
                      <span className="material-symbols-outlined text-base">{useSimpleComparePicker ? 'view_module' : 'list'}</span>
                      {useSimpleComparePicker ? 'Use room cards' : 'Use simple selector'}
                    </button>
                  </div>

                  {useSimpleComparePicker ? (
                    <label className="block">
                      <span className="mb-2 block text-sm font-bold text-on-surface">Select a dorm to compare</span>
                      <select
                        value={compareDormId}
                        onChange={(event) => setCompareDormId(event.target.value)}
                        className="w-full rounded-lg border border-outline-variant/30 bg-surface px-4 py-3 text-sm font-semibold text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                      >
                        <option value="">Choose another dorm</option>
                        {compareOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.name} - {option.rent}/mo
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {compareOptions.map((option) => {
                        const isSelected = option.id === compareDormId
                        const optionImage = option.gallery[0]

                        return (
                          <article
                            key={option.id}
                            className={`overflow-hidden rounded-xl bg-surface transition ${
                              isSelected
                                ? 'ring-2 ring-primary shadow-md'
                                : 'ring-1 ring-outline-variant/15 hover:ring-primary/40'
                            }`}
                          >
                            <div className="relative h-40 overflow-hidden">
                              <img src={optionImage} alt={`${option.name} room preview`} className="h-full w-full object-cover" />
                              <span className="absolute left-3 top-3 rounded-full bg-on-surface/75 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                                {option.status}
                              </span>
                            </div>

                            <div className="space-y-4 p-4">
                              <div>
                                <p className="text-[11px] font-bold uppercase tracking-widest text-secondary">{option.type}</p>
                                <h3 className="mt-1 text-lg font-black text-on-surface">{option.name}</h3>
                                <p className="mt-1 text-sm text-secondary">{option.location}</p>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {option.amenityTags.map((amenity) => (
                                  <span key={`${option.id}-${amenity}`} className="rounded-full bg-secondary-container/60 px-3 py-1 text-[11px] font-bold text-on-secondary-container">
                                    {amenityLabelMap[amenity] || amenity}
                                  </span>
                                ))}
                              </div>

                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-lg font-black text-primary">
                                  {option.rent}
                                  <span className="text-sm font-medium text-secondary">/mo</span>
                                </p>
                                <div className="flex gap-2">
                                  <Link
                                    to={`/dorms/${option.id}`}
                                    className="rounded-lg border border-outline-variant/30 px-3 py-2 text-xs font-bold text-on-surface transition hover:border-primary hover:text-primary"
                                  >
                                    View Page
                                  </Link>
                                  <button
                                    type="button"
                                    onClick={() => setCompareDormId(option.id)}
                                    className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                                      isSelected
                                        ? 'bg-primary text-white'
                                        : 'bg-surface-container-highest text-on-surface hover:bg-primary hover:text-white'
                                    }`}
                                  >
                                    {isSelected ? 'Selected' : 'Compare'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  )}

                  {comparedDorm ? (
                    <div className="space-y-5">
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-xl bg-surface-container-low p-5">
                          <p className="text-xs font-bold uppercase tracking-widest text-secondary">Current Dorm</p>
                          <h3 className="mt-2 text-lg font-black">{dorm.name}</h3>
                          <p className="mt-1 text-sm text-secondary">{dorm.rent}/mo</p>
                        </div>
                        <div className={`rounded-xl p-5 ${priceDifference.className}`}>
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined">{priceDifference.icon}</span>
                            <p className="text-xs font-bold uppercase tracking-widest">Price Difference</p>
                          </div>
                          <p className="mt-2 text-2xl font-black">{priceDifference.label}</p>
                          <p className="text-sm font-semibold">{priceDifference.detail}</p>
                        </div>
                        <div className="rounded-xl bg-surface-container-low p-5">
                          <p className="text-xs font-bold uppercase tracking-widest text-secondary">Compared Dorm</p>
                          <h3 className="mt-2 text-lg font-black">{comparedDorm.name}</h3>
                          <p className="mt-1 text-sm text-secondary">{comparedDorm.rent}/mo</p>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-xl bg-surface-container-low p-5">
                          <div className="flex items-center gap-2 text-emerald-800">
                            <span className="material-symbols-outlined">add_circle</span>
                            <h3 className="font-bold">Amenities added</h3>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {amenityDifference.added.length ? (
                              amenityDifference.added.map((amenity) => renderAmenityPill(amenity, 'added'))
                            ) : (
                              <p className="text-sm text-secondary">No extra amenities in the compared dorm.</p>
                            )}
                          </div>
                        </div>

                        <div className="rounded-xl bg-surface-container-low p-5">
                          <div className="flex items-center gap-2 text-red-800">
                            <span className="material-symbols-outlined">remove_circle</span>
                            <h3 className="font-bold">Amenities lost</h3>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {amenityDifference.lost.length ? (
                              amenityDifference.lost.map((amenity) => renderAmenityPill(amenity, 'lost'))
                            ) : (
                              <p className="text-sm text-secondary">No amenities are lost with this comparison.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-outline-variant/40 bg-surface-container-low p-5 text-sm font-medium text-secondary">
                      Choose another dorm to see price and amenity differences.
                    </div>
                  )}
                </div>
              ) : null}
            </section>
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl bg-surface-container-lowest p-8 shadow-sm ring-1 ring-outline-variant/15">
              <h3 className="mb-3 text-2xl font-bold">Ready to apply?</h3>
              <p className="mb-6 text-secondary">Secure your preferred room now. Our team will review your request within 24 hours.</p>
              <Link
                to={`/apply-now?dormName=${encodeURIComponent(dorm.name)}&dormId=${encodeURIComponent(dorm.id)}`}
                className="block rounded-lg bg-gradient-to-br from-primary to-primary-container px-6 py-4 text-center font-bold text-white transition hover:scale-[1.01]"
              >
                Apply Now
              </Link>
            </div>

            <div className="rounded-2xl bg-surface-container-low p-8">
              <h4 className="mb-4 text-lg font-bold">Need help?</h4>
              <div className="space-y-4 text-secondary">
                <p className="flex items-center gap-3"><span className="material-symbols-outlined text-primary">call</span>+880 1XXX XXXXXX</p>
                <p className="flex items-center gap-3"><span className="material-symbols-outlined text-primary">mail</span>support@dormdoor.com</p>
                <p className="flex items-center gap-3"><span className="material-symbols-outlined text-primary">schedule</span>Response within 24 hours</p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </PageShell>
  )
}

export default DormDetails
