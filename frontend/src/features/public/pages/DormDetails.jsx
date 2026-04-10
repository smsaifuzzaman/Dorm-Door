import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageShell from '../components/PageShell'
import { getDormDetailsById } from '../data/dormData'

function DormDetails() {
  const { id } = useParams()
  const dorm = useMemo(() => getDormDetailsById(id), [id])

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
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl bg-surface-container-lowest p-8 shadow-sm ring-1 ring-outline-variant/15">
              <h3 className="mb-3 text-2xl font-bold">Ready to apply?</h3>
              <p className="mb-6 text-secondary">Secure your preferred room now. Our team will review your request within 24 hours.</p>
              <Link to="/apply-now" className="block rounded-lg bg-gradient-to-br from-primary to-primary-container px-6 py-4 text-center font-bold text-white transition hover:scale-[1.01]">
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
