import { useEffect, useMemo, useState } from 'react'
import { Eye, Lock, Pencil, Plus, Trash2, Unlock } from 'lucide-react'
import DataTable from '../../components/superAdmin/DataTable'
import SimpleModal from '../../components/superAdmin/SimpleModal'
import StatusBadge from '../../components/superAdmin/StatusBadge'
import SuperAdminLayout from '../../components/superAdmin/SuperAdminLayout'
import {
  createDormAdmin,
  deleteDormAdmin,
  getDormAdmins,
  getDorms,
  updateDormAdmin,
  updateDormAdminStatus,
} from '../../services/superAdminApi'

const initialForm = {
  name: '',
  email: '',
  phone: '',
  address: '',
  password: '',
  assignedDorm: '',
  accountStatus: 'active',
}

function DormAdminManagement() {
  const [admins, setAdmins] = useState([])
  const [dorms, setDorms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [selectedAdmin, setSelectedAdmin] = useState(null)
  const [modalMode, setModalMode] = useState('')
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)

  const loadData = async () => {
    setLoading(true)
    setError('')

    try {
      const [{ data: adminData }, { data: dormData }] = await Promise.all([getDormAdmins(), getDorms()])
      setAdmins(adminData.dormAdmins || [])
      setDorms(dormData.dorms || [])
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to load dorm admins')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const openAdd = () => {
    setSelectedAdmin(null)
    setForm(initialForm)
    setModalMode('form')
  }

  const openEdit = (admin) => {
    setSelectedAdmin(admin)
    setForm({
      name: admin.name || '',
      email: admin.email || '',
      phone: admin.phone || '',
      address: admin.address || '',
      password: '',
      assignedDorm: admin.assignedDorm?._id || '',
      accountStatus: admin.accountStatus || 'active',
    })
    setModalMode('form')
  }

  const openView = (admin) => {
    setSelectedAdmin(admin)
    setModalMode('view')
  }

  const closeModal = () => {
    setSelectedAdmin(null)
    setModalMode('')
    setForm(initialForm)
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    const payload = { ...form }
    if (!payload.password) delete payload.password

    try {
      if (selectedAdmin?._id) {
        await updateDormAdmin(selectedAdmin._id, payload)
        setMessage('Dorm admin updated successfully.')
      } else {
        await createDormAdmin(payload)
        setMessage('Dorm admin added successfully.')
      }
      await loadData()
      closeModal()
    } catch (requestError) {
      setMessage(requestError.response?.data?.message || 'Failed to save dorm admin.')
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (admin) => {
    const next = admin.accountStatus === 'blocked' ? 'active' : 'blocked'
    try {
      await updateDormAdminStatus(admin._id, next)
      await loadData()
    } catch (requestError) {
      setMessage(requestError.response?.data?.message || 'Failed to update admin status.')
    }
  }

  const handleDelete = async (admin) => {
    if (!window.confirm(`Delete admin ${admin.name}?`)) return
    try {
      await deleteDormAdmin(admin._id)
      await loadData()
      setMessage('Dorm admin deleted successfully.')
    } catch (requestError) {
      setMessage(requestError.response?.data?.message || 'Failed to delete dorm admin.')
    }
  }

  const columns = useMemo(
    () => [
      { key: 'name', label: 'Name', render: (row) => <span className="font-black text-slate-950">{row.name}</span> },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone', render: (row) => row.phone || 'N/A' },
      { key: 'address', label: 'Address', render: (row) => row.address || 'N/A' },
      { key: 'assignedDorm', label: 'Assigned Dorm', render: (row) => row.assignedDorm?.name || 'Unassigned' },
      { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.accountStatus === 'blocked' ? 'Blocked' : 'Active'} /> },
      {
        key: 'actions',
        label: 'Actions',
        render: (row) => (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => openView(row)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" title="View">
              <Eye size={16} />
            </button>
            <button type="button" onClick={() => openEdit(row)} className="rounded-lg p-2 text-primary hover:bg-blue-50" title="Edit">
              <Pencil size={16} />
            </button>
            <button type="button" onClick={() => toggleStatus(row)} className="rounded-lg p-2 text-amber-700 hover:bg-amber-50" title="Block or unblock">
              {row.accountStatus === 'blocked' ? <Unlock size={16} /> : <Lock size={16} />}
            </button>
            <button type="button" onClick={() => handleDelete(row)} className="rounded-lg p-2 text-red-600 hover:bg-red-50" title="Delete">
              <Trash2 size={16} />
            </button>
          </div>
        ),
      },
    ],
    [],
  )

  return (
    <SuperAdminLayout title="Dorm Admins" subtitle="Create admins, assign dorms, and block access when needed.">
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h3 className="text-xl font-black text-slate-950">Dorm Admin Management</h3>
          <p className="mt-1 text-sm text-slate-500">Total admins: {admins.length}</p>
        </div>
        <button type="button" onClick={openAdd} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white">
          <Plus size={17} /> Add Dorm Admin
        </button>
      </div>

      {error ? <p className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
      {message ? <p className="mb-5 rounded-lg bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">{message}</p> : null}

      <DataTable columns={columns} rows={admins} loading={loading} emptyMessage="No dorm admins found." />

      {modalMode === 'form' ? (
        <SimpleModal title={selectedAdmin ? 'Edit Dorm Admin' : 'Add Dorm Admin'} onClose={closeModal}>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-bold text-slate-600">
              Name
              <input name="name" value={form.name} onChange={handleChange} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2" required />
            </label>
            <label className="text-sm font-bold text-slate-600">
              Email
              <input name="email" type="email" value={form.email} onChange={handleChange} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2" required />
            </label>
            <label className="text-sm font-bold text-slate-600">
              Phone
              <input name="phone" value={form.phone} onChange={handleChange} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2" />
            </label>
            <label className="text-sm font-bold text-slate-600">
              Address
              <input name="address" value={form.address} onChange={handleChange} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2" />
            </label>
            <label className="text-sm font-bold text-slate-600">
              Password
              <input name="password" type="password" value={form.password} onChange={handleChange} placeholder={selectedAdmin ? 'Leave blank to keep current' : 'Default: Admin123!'} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2" />
            </label>
            <label className="text-sm font-bold text-slate-600">
              Assigned Dorm
              <select name="assignedDorm" value={form.assignedDorm} onChange={handleChange} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2">
                <option value="">Unassigned</option>
                {dorms.map((dorm) => (
                  <option key={dorm._id} value={dorm._id}>{dorm.name}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-bold text-slate-600">
              Status
              <select name="accountStatus" value={form.accountStatus} onChange={handleChange} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2">
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
              </select>
            </label>
            <div className="flex justify-end gap-3 sm:col-span-2">
              <button type="button" onClick={closeModal} className="rounded-lg px-4 py-2 font-bold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button type="submit" disabled={saving} className="rounded-lg bg-primary px-5 py-2 font-bold text-white disabled:opacity-70">
                {saving ? 'Saving...' : 'Save Admin'}
              </button>
            </div>
          </form>
        </SimpleModal>
      ) : null}

      {modalMode === 'view' && selectedAdmin ? (
        <SimpleModal title="Dorm Admin Details" onClose={closeModal}>
          <div className="space-y-3 text-sm text-slate-700">
            <p><strong>Name:</strong> {selectedAdmin.name}</p>
            <p><strong>Email:</strong> {selectedAdmin.email}</p>
            <p><strong>Phone:</strong> {selectedAdmin.phone || 'N/A'}</p>
            <p><strong>Address:</strong> {selectedAdmin.address || 'N/A'}</p>
            <p><strong>Assigned Dorm:</strong> {selectedAdmin.assignedDorm?.name || 'Unassigned'}</p>
            <p><strong>Status:</strong> {selectedAdmin.accountStatus === 'blocked' ? 'Blocked' : 'Active'}</p>
          </div>
        </SimpleModal>
      ) : null}
    </SuperAdminLayout>
  )
}

export default DormAdminManagement
