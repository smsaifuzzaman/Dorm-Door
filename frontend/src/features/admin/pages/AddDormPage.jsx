import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../components/layout/AdminLayout'
import { topbarAvatars } from '../data/dashboardData'
import Icon from '../components/Icon'
import { api } from '../../../api/client'

const facilitiesList = ['High-speed Wi-Fi', 'Air Conditioning', '24/7 Security', 'Laundry Service', 'Cafeteria / Dining', 'Study & Fitness Center']

function AddDormPage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState(['High-speed Wi-Fi', '24/7 Security'])
  const [images, setImages] = useState([])
  const [form, setForm] = useState({
    name: '',
    block: '',
    totalFloors: '',
    totalCapacity: '',
    priceRange: '',
    address: '',
    description: '',
    rules: '',
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const toggleFacility = (facility) => {
    setSelected((prev) => (prev.includes(facility) ? prev.filter((item) => item !== facility) : [...prev, facility]))
  }

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const addImageUrl = () => {
    const nextUrl = window.prompt('Paste image URL for this dorm')
    if (!nextUrl) return
    const trimmed = nextUrl.trim()
    if (!trimmed) return
    setImages((prev) => [...prev, trimmed].slice(0, 6))
  }

  const handleSave = async () => {
    setMessage('')
    setError('')

    if (!form.name.trim() || !form.block.trim() || !form.address.trim()) {
      setError('Dorm name, block, and address are required.')
      return
    }

    setSaving(true)

    try {
      await api.post('/catalog-requests', {
        type: 'dorm',
        payload: {
          name: form.name.trim(),
          block: form.block.trim(),
          address: form.address.trim(),
          description: form.description.trim(),
          rules: form.rules.trim(),
          priceRange: form.priceRange.trim(),
          facilities: selected,
          images,
          totalFloors: Number(form.totalFloors || 1),
          totalCapacity: Number(form.totalCapacity || 0),
          status: 'active',
        },
      })
      setMessage('Dorm request submitted for super admin approval. Redirecting...')
      setTimeout(() => navigate('/admin/applications'), 500)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to create dorm.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout
      activeKey="dorms"
      topbarProps={{
        searchPlaceholder: 'Search records...',
        brandText: 'DormManager',
        showBrand: true,
        profileName: 'Admin Profile',
        profileRole: 'Super Administrator',
        avatar: topbarAvatars.admin,
      }}
      contentClassName="p-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-start">
          <div>
            <p className="text-secondary">Dormitories <span className="mx-2">{'>'}</span> <span className="font-semibold text-primary">Add New Dormitory</span></p>
            <h1 className="mt-3 text-5xl font-black tracking-tighter">Expand the Sanctuary</h1>
            <p className="mt-2 text-[18px] text-secondary">Define a new living space for our academic community.</p>
            {error ? <p className="mt-3 text-sm font-semibold text-error">{error}</p> : null}
            {message ? <p className="mt-3 text-sm font-semibold text-primary">{message}</p> : null}
          </div>
          <div className="flex items-center gap-5">
            <button type="button" onClick={() => navigate('/admin/dorms')} className="text-xl text-secondary">Cancel</button>
            <button type="button" onClick={handleSave} disabled={saving} className="rounded-xl bg-primary px-8 py-4 text-xl font-bold text-white shadow-soft disabled:cursor-not-allowed disabled:opacity-70">
              {saving ? 'Saving...' : 'Save Dormitory'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
          <div className="space-y-8 xl:col-span-8">
            <section className="rounded-2xl border border-[#ece7e4] bg-white p-8">
              <h3 className="mb-8 flex items-center gap-3 text-2xl font-extrabold"><span className="rounded-full bg-blue-50 p-3 text-primary"><Icon name="segment" /></span> General Details</h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div><label className="text-[10px] font-bold uppercase tracking-widest text-secondary">Dorm Name</label><input value={form.name} onChange={(event) => updateField('name', event.target.value)} className="mt-2 w-full rounded-xl border-none bg-[#f1ecea] px-5 py-4" placeholder="e.g. Sterling Hall" /></div>
                <div><label className="text-[10px] font-bold uppercase tracking-widest text-secondary">Block / Building</label><input value={form.block} onChange={(event) => updateField('block', event.target.value)} className="mt-2 w-full rounded-xl border-none bg-[#f1ecea] px-5 py-4" placeholder="e.g. North Wing - Block A" /></div>
                <div><label className="text-[10px] font-bold uppercase tracking-widest text-secondary">Total Floor Count</label><input type="number" min="1" value={form.totalFloors} onChange={(event) => updateField('totalFloors', event.target.value)} className="mt-2 w-full rounded-xl border-none bg-[#f1ecea] px-5 py-4" placeholder="0" /></div>
                <div><label className="text-[10px] font-bold uppercase tracking-widest text-secondary">Total Room Capacity</label><input type="number" min="0" value={form.totalCapacity} onChange={(event) => updateField('totalCapacity', event.target.value)} className="mt-2 w-full rounded-xl border-none bg-[#f1ecea] px-5 py-4" placeholder="0" /></div>
                <div className="md:col-span-2"><label className="text-[10px] font-bold uppercase tracking-widest text-secondary">Price Range</label><input value={form.priceRange} onChange={(event) => updateField('priceRange', event.target.value)} className="mt-2 w-full rounded-xl border-none bg-[#f1ecea] px-5 py-4" placeholder="BDT 5,000 - 12,000" /></div>
                <div className="md:col-span-2"><label className="text-[10px] font-bold uppercase tracking-widest text-secondary">Address</label><textarea value={form.address} onChange={(event) => updateField('address', event.target.value)} className="mt-2 min-h-[120px] w-full rounded-xl border-none bg-[#f1ecea] px-5 py-4" placeholder="Enter the full street address and campus proximity details..." /></div>
                <div className="md:col-span-2"><label className="text-[10px] font-bold uppercase tracking-widest text-secondary">Description</label><textarea value={form.description} onChange={(event) => updateField('description', event.target.value)} className="mt-2 min-h-[120px] w-full rounded-xl border-none bg-[#f1ecea] px-5 py-4" placeholder="Short description shown to students during browsing..." /></div>
              </div>
            </section>

            <section className="rounded-2xl border border-[#ece7e4] bg-white p-8">
              <h3 className="mb-8 flex items-center gap-3 text-2xl font-extrabold"><span className="rounded-full bg-blue-50 p-3 text-primary"><Icon name="gavel" /></span> Rules & Policies</h3>
              <label className="text-[10px] font-bold uppercase tracking-widest text-secondary">Dormitory Regulations</label>
              <textarea value={form.rules} onChange={(event) => updateField('rules', event.target.value)} className="mt-3 min-h-[220px] w-full rounded-xl border-none bg-[#f1ecea] px-5 py-4" placeholder="List the house rules, curfew times, and maintenance policies..." />
              <p className="mt-4 text-sm text-secondary">These rules will be displayed to students during the application process.</p>
            </section>
          </div>

          <div className="space-y-8 xl:col-span-4">
            <section className="rounded-2xl border border-[#ece7e4] bg-white p-8">
              <h3 className="mb-6 flex items-center gap-3 text-2xl font-extrabold"><span className="rounded-full bg-blue-50 p-3 text-primary"><Icon name="photo_camera" /></span> Dorm Photos</h3>
              <button type="button" onClick={addImageUrl} className="flex min-h-[240px] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#d8d2cf] text-center">
                <Icon name="add_a_photo" className="text-5xl text-secondary" />
                <p className="mt-4 text-xl font-semibold">Click to add photo URL</p>
                <p className="mt-2 max-w-[220px] text-sm text-secondary">Store image links to keep dorm gallery visible.</p>
              </button>
              <div className="mt-5 grid grid-cols-3 gap-4">
                {[0, 1, 2].map((slot) => (
                  images[slot] ? (
                    <img key={slot} src={images[slot]} alt={`Dorm preview ${slot + 1}`} className="h-20 w-full rounded-xl object-cover" />
                  ) : (
                    <button key={slot} type="button" onClick={addImageUrl} className="flex h-20 items-center justify-center rounded-xl border-2 border-dashed border-[#d8d2cf] text-3xl text-secondary">+</button>
                  )
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-[#ece7e4] bg-white p-8">
              <h3 className="mb-6 flex items-center gap-3 text-2xl font-extrabold"><span className="rounded-full bg-blue-50 p-3 text-primary"><Icon name="inventory_2" /></span> Facilities</h3>
              <div className="space-y-3">
                {facilitiesList.map((facility) => {
                  const checked = selected.includes(facility)
                  return (
                    <label key={facility} className="flex items-center justify-between rounded-xl bg-[#f3f6f8] px-4 py-4">
                      <span className="text-[18px] text-[#384149]">{facility}</span>
                      <input type="checkbox" checked={checked} onChange={() => toggleFacility(facility)} className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary" />
                    </label>
                  )
                })}
              </div>
            </section>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AddDormPage
