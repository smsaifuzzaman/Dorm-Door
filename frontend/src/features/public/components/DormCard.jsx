import { Link } from 'react-router-dom'

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80'

function DormCard({ dorm }) {
  const statusColor =
    dorm.status === 'Available'
      ? 'bg-emerald-500'
      : dorm.status === 'Limited Seats'
        ? 'bg-amber-500'
        : 'bg-red-500'
  const cardImages = Array.isArray(dorm.images) && dorm.images.length
    ? dorm.images
    : [dorm.image].filter(Boolean)
  const mainImage = cardImages[0] || FALLBACK_IMAGE
  const galleryImages = cardImages.slice(1, 4)
  const hiddenCount = Math.max(cardImages.length - 4, 0)

  return (
    <div className="group rounded-2xl bg-surface p-4 transition duration-300 hover:scale-[1.02] hover:bg-surface-container-lowest">
      <div className="relative mb-3 h-72 overflow-hidden rounded-xl">
        <img src={mainImage} alt={dorm.name} className="h-full w-full object-cover" />
        <div className={`absolute left-4 top-4 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white ${statusColor}`}>
          {dorm.status}
        </div>
      </div>

      {galleryImages.length ? (
        <div className="mb-5 grid grid-cols-3 gap-2">
          {galleryImages.map((image, index) => (
            <div key={`${dorm.id}-thumb-${index}`} className="relative h-16 overflow-hidden rounded-lg">
              <img src={image} alt={`${dorm.name} preview ${index + 2}`} className="h-full w-full object-cover" />
              {index === galleryImages.length - 1 && hiddenCount > 0 ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-xs font-bold text-white">
                  +{hiddenCount}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      <p className="text-[11px] font-bold uppercase tracking-widest text-secondary">{dorm.type}</p>
      <h3 className="mt-2 text-xl font-bold">{dorm.name}</h3>
      {dorm.location && <p className="mt-2 text-sm text-secondary">{dorm.location}</p>}

      <div className="mt-5 flex items-center justify-between">
        <span className="text-lg font-extrabold text-on-surface">
          {dorm.price}
          <span className="text-sm font-normal text-secondary">/mo</span>
        </span>
        <Link
          to={`/dorms/${dorm.id}`}
          className="rounded-lg bg-surface-container-highest px-4 py-2 text-sm font-bold transition hover:bg-primary hover:text-white"
        >
          View Details
        </Link>
      </div>
    </div>
  )
}

export default DormCard
