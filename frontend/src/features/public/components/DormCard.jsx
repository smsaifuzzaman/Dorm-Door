import { Link } from 'react-router-dom'
import { DORM_IMAGE_FALLBACK } from '../utils/dormMappers'

function handleImageError(event) {
  const image = event.currentTarget
  if (image.dataset.fallbackApplied === 'true') return

  image.dataset.fallbackApplied = 'true'
  image.src = DORM_IMAGE_FALLBACK
}

function DormCard({ dorm, showStudentRating = false }) {
  const studentRating = showStudentRating ? dorm.studentRating : null
  const statusColor =
    dorm.status === 'Available'
      ? 'bg-emerald-500'
      : dorm.status === 'Limited Seats'
        ? 'bg-amber-500'
        : 'bg-red-500'
  const cardImages = Array.isArray(dorm.images) && dorm.images.length
    ? dorm.images
    : [dorm.image].filter(Boolean)
  const mainImage = cardImages[0] || ''
  const galleryImages = cardImages.slice(1, 4)
  const hiddenCount = Math.max(cardImages.length - 4, 0)

  return (
    <div className="group rounded-2xl bg-surface p-4 transition duration-300 hover:scale-[1.02] hover:bg-surface-container-lowest">
      <div className="relative mb-3 h-72 overflow-hidden rounded-xl">
        {mainImage ? (
          <img src={mainImage} alt={dorm.name} onError={handleImageError} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-surface-container px-4 text-center text-outline">
            <span className="material-symbols-outlined text-6xl">image</span>
            <p className="text-sm font-bold text-secondary">No images available</p>
          </div>
        )}
        <div className={`absolute left-4 top-4 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white ${statusColor}`}>
          {dorm.status}
        </div>
      </div>

      {galleryImages.length ? (
        <div className="mb-5 grid grid-cols-3 gap-2">
          {galleryImages.map((image, index) => (
            <div key={`${dorm.id}-thumb-${index}`} className="relative h-16 overflow-hidden rounded-lg">
              <img src={image} alt={`${dorm.name} preview ${index + 2}`} onError={handleImageError} className="h-full w-full object-cover" />
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
      <div className="mt-2 flex items-center justify-between gap-3">
        <h3 className="min-w-0 flex-1 text-xl font-bold">{dorm.name}</h3>
        {studentRating ? (
          <div
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700"
            aria-label={`${studentRating.average.toFixed(1)} out of 5 from ${studentRating.count} student rating${studentRating.count === 1 ? '' : 's'}`}
            title={`${studentRating.count} student-submitted rating${studentRating.count === 1 ? '' : 's'}`}
          >
            <span className="material-symbols-outlined text-[16px] leading-none">star</span>
            <span>{studentRating.average.toFixed(1)}</span>
            {studentRating.count > 1 ? <span className="font-semibold text-amber-700/70">({studentRating.count})</span> : null}
          </div>
        ) : null}
      </div>
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
