import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import StudentLayout from '../../components/dashboard/StudentLayout'

const initialForm = {
  dorm: '',
  room: '',
  cleanliness: 4,
  security: 4,
  internet: 4,
  maintenance: 4,
  comment: '',
  anonymous: false,
}

function StudentReviewsPage() {
  const [approvedApplications, setApprovedApplications] = useState([])
  const [reviews, setReviews] = useState([])
  const [form, setForm] = useState(initialForm)
  const [message, setMessage] = useState('')

  useEffect(() => {
    api.get('/applications')
      .then(({ data }) => {
        const approved = (data.applications || []).filter((application) => (
          application.status === 'Approved' && application.dorm?._id && application.room?._id
        ))
        setApprovedApplications(approved)
        setForm((prev) => ({
          ...prev,
          dorm: approved[0]?.dorm?._id || '',
          room: approved[0]?.room?._id || '',
        }))
      })
      .catch(() => setApprovedApplications([]))
    api.get('/reviews').then(({ data }) => setReviews(data.reviews)).catch(() => setReviews([]))
  }, [])

  const dorms = approvedApplications.map((application) => application.dorm)
  const rooms = approvedApplications
    .filter((application) => application.dorm?._id === form.dorm)
    .map((application) => application.room)

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      await api.post('/reviews', {
        dorm: form.dorm,
        room: form.room,
        rating: {
          cleanliness: Number(form.cleanliness),
          security: Number(form.security),
          internet: Number(form.internet),
          maintenance: Number(form.maintenance),
        },
        comment: form.comment,
        anonymous: form.anonymous,
      })

      setMessage('Review submitted')
      setForm(initialForm)

      const { data } = await api.get('/reviews')
      setReviews(data.reviews)
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to submit review')
    }
  }

  return (
    <StudentLayout>
      <h1>Reviews</h1>

      <section className="card">
        <h2>Submit Review</h2>
        <form className="form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              Dorm
              <select name="dorm" value={form.dorm} onChange={handleChange} required>
                <option value="">Select dorm</option>
                {dorms.map((dorm) => (
                  <option key={dorm._id} value={dorm._id}>{dorm.name}</option>
                ))}
              </select>
            </label>

            <label>
              Room
              <select name="room" value={form.room} onChange={handleChange} required>
                <option value="">Select approved room</option>
                {rooms.map((room) => (
                  <option key={room._id} value={room._id}>{room.roomNumber}</option>
                ))}
              </select>
            </label>

            <label>
              Cleanliness
              <input name="cleanliness" type="number" min="1" max="5" value={form.cleanliness} onChange={handleChange} />
            </label>

            <label>
              Security
              <input name="security" type="number" min="1" max="5" value={form.security} onChange={handleChange} />
            </label>

            <label>
              Internet
              <input name="internet" type="number" min="1" max="5" value={form.internet} onChange={handleChange} />
            </label>

            <label>
              Maintenance
              <input name="maintenance" type="number" min="1" max="5" value={form.maintenance} onChange={handleChange} />
            </label>

            <label>
              Comment
              <textarea name="comment" value={form.comment} onChange={handleChange} rows={4} required />
            </label>

            <label className="checkbox-inline">
              <input name="anonymous" type="checkbox" checked={form.anonymous} onChange={handleChange} />
              Post anonymously
            </label>
          </div>

          <button type="submit" className="btn btn-primary" disabled={!approvedApplications.length}>Submit Review</button>
          {message ? <p className="form-message">{message}</p> : null}
          {!approvedApplications.length ? <p className="form-message">You can submit a review after your application is approved and assigned a room.</p> : null}
        </form>
      </section>

      <section className="card">
        <h2>Latest Published Reviews</h2>
        <ul className="list-clean">
          {reviews.map((review) => (
            <li key={review._id}>
              <strong>{review.dorm?.name || 'Dorm'}</strong>
              <p>{review.comment}</p>
              <small>Overall rating: {review.rating?.overall}/5</small>
            </li>
          ))}
        </ul>
      </section>
    </StudentLayout>
  )
}

export default StudentReviewsPage
