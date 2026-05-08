import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import AdminLayout from '../../components/dashboard/AdminLayout'
import { collectLocalImages } from '../../features/admin/utils/localImages'

const initialForm = {
  name: '',
  block: '',
  address: '',
  description: '',
  rules: '',
  facilities: '',
  totalFloors: 1,
  totalCapacity: 0,
}

function AdminAddDormPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [images, setImages] = useState([])
  const [message, setMessage] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageSelection = async (event) => {
    const result = await collectLocalImages(event.target.files, { existing: images, maxFiles: 6 })
    setImages(result.images)
    if (result.message) setMessage(result.message)
    event.target.value = ''
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      const requestBody = new FormData()
      Object.entries({
        ...form,
        totalFloors: Number(form.totalFloors),
        totalCapacity: Number(form.totalCapacity),
      }).forEach(([key, value]) => requestBody.append(key, value))
      images.forEach((image) => requestBody.append('images', image.file))

      await api.post('/dorms', requestBody)

      navigate('/admin/dorms')
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to create dorm')
    }
  }

  return (
    <AdminLayout>
      <h1>Add Dorm</h1>
      <section className="card">
        <form className="form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              Name
              <input name="name" value={form.name} onChange={handleChange} required />
            </label>

            <label>
              Block
              <input name="block" value={form.block} onChange={handleChange} required />
            </label>

            <label>
              Address
              <input name="address" value={form.address} onChange={handleChange} required />
            </label>

            <label>
              Total Floors
              <input name="totalFloors" type="number" value={form.totalFloors} onChange={handleChange} min="1" />
            </label>

            <label>
              Total Capacity
              <input name="totalCapacity" type="number" value={form.totalCapacity} onChange={handleChange} min="0" />
            </label>

            <label>
              Facilities (comma separated)
              <input name="facilities" value={form.facilities} onChange={handleChange} />
            </label>

            <label>
              Dorm Photos
              <input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple onChange={handleImageSelection} />
              <span>{images.length ? `${images.length} photo${images.length === 1 ? '' : 's'} selected` : 'Choose photos from your device'}</span>
            </label>

            <label>
              Description
              <textarea name="description" value={form.description} onChange={handleChange} rows={4} />
            </label>

            <label>
              Rules
              <textarea name="rules" value={form.rules} onChange={handleChange} rows={4} />
            </label>
          </div>

          <button type="submit" className="btn btn-primary">Create Dorm</button>
          {message ? <p className="form-error">{message}</p> : null}
        </form>
      </section>
    </AdminLayout>
  )
}

export default AdminAddDormPage
