import { useEffect, useRef, useState } from 'react'
import AdminLayout from '../components/layout/AdminLayout'
import { topbarAvatars } from '../data/dashboardData'
import { api } from '../../../api/client'
import { toSafeExternalUrl } from '../../../utils/url'

const ADMIN_DOCUMENT_CATEGORIES = ['National ID', 'Dorm License', 'Ownership Document', 'Trade License', 'Other']

function formatFileSize(value) {
  const bytes = Number(value) || 0
  if (bytes <= 0) return 'N/A'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(value) {
  if (!value) return 'N/A'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'N/A'
  return parsed.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
}

function statusClass(status) {
  if (status === 'Verified') return 'bg-[#e9f6ed] text-[#24925e]'
  if (status === 'Needs Update') return 'bg-[#fff2cf] text-[#b7791f]'
  if (status === 'Rejected') return 'bg-[#ffe9ec] text-[#c73535]'
  return 'bg-[#eef0ff] text-[#4a5fd2]'
}

function DocumentsPage() {
  const fileInputRef = useRef(null)
  const [documents, setDocuments] = useState([])
  const [form, setForm] = useState({ category: ADMIN_DOCUMENT_CATEGORIES[0], file: null })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const fetchDocuments = async () => {
    setLoading(true)
    setError('')

    try {
      const { data } = await api.get('/documents')
      setDocuments(data.documents || [])
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to load your documents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [])

  const handleFileChange = (event) => {
    setForm((prev) => ({ ...prev, file: event.target.files?.[0] || null }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const selectedFile = form.file || fileInputRef.current?.files?.[0] || null

    if (!selectedFile) {
      setError('Please choose a document file to upload.')
      return
    }

    if ((selectedFile.size || 0) > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit.')
      return
    }

    const existingActiveDocument = documents.find(
      (item) => item.category === form.category && item.status !== 'Rejected',
    )
    if (existingActiveDocument) {
      setError(`${form.category} is already ${existingActiveDocument.status}. Upload again after it is rejected.`)
      return
    }

    setSaving(true)
    setMessage('')
    setError('')

    try {
      const payload = new FormData()
      payload.append('category', form.category)
      payload.append('file', selectedFile)
      payload.append('fileName', selectedFile.name)

      await api.post('/documents', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setForm({ category: ADMIN_DOCUMENT_CATEGORIES[0], file: null })
      if (fileInputRef.current) fileInputRef.current.value = ''
      setMessage('Document uploaded successfully for super admin verification.')
      await fetchDocuments()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to submit document')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout
      activeKey="documents"
      topbarProps={{
        searchPlaceholder: 'Search documents...',
        profileName: '',
        profileRole: 'Housing Authority',
        avatar: topbarAvatars.docAdmin,
      }}
      contentClassName="p-8"
    >
      <div className="mx-auto max-w-6xl">
        <p className="text-[12px] font-bold uppercase tracking-[0.28em] text-primary">Verification</p>
        <h1 className="mt-3 text-5xl font-black tracking-tighter">My Documents</h1>
        <p className="mt-3 max-w-2xl text-[16px] leading-8 text-secondary">
          Submit your dorm administration documents and track super admin review status.
        </p>

        {message ? <p className="mt-6 rounded-lg bg-[#ecf7ef] px-4 py-3 text-sm font-semibold text-[#23945b]">{message}</p> : null}
        {error ? <p className="mt-6 rounded-lg bg-[#ffe9ec] px-4 py-3 text-sm font-semibold text-[#c73535]">{error}</p> : null}

        <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[0.9fr_1.2fr]">
          <section className="rounded-[28px] bg-white p-8 ring-1 ring-[#efebea]">
            <h2 className="text-[24px] font-extrabold tracking-[-0.04em]">Add Document</h2>
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="block text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">
                Category
                <select
                  value={form.category}
                  onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                  className="mt-2 w-full rounded-xl border-none bg-[#f1ecea] px-4 py-3 text-sm"
                >
                  {ADMIN_DOCUMENT_CATEGORIES.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </label>

              <label className="block text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">
                Choose File
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.heic,.heif"
                  onChange={handleFileChange}
                  className="mt-2 w-full rounded-xl border-none bg-[#f1ecea] px-4 py-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-xs file:font-bold file:text-white"
                />
              </label>

              <p className="rounded-xl bg-[#f7f4f3] px-4 py-3 text-sm text-secondary">
                Supported: PDF, DOC, DOCX, JPG, PNG, WEBP (max 10MB)
              </p>

              <button type="submit" disabled={saving} className="rounded-[18px] bg-primary px-7 py-3 text-[15px] font-bold text-white disabled:opacity-70">
                {saving ? 'Uploading...' : 'Submit Document'}
              </button>
            </form>
          </section>

          <section className="rounded-[28px] bg-white p-8 ring-1 ring-[#efebea]">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[24px] font-extrabold tracking-[-0.04em]">Submitted Documents</h2>
              {loading ? <span className="text-sm text-secondary">Loading...</span> : null}
            </div>

            {!loading && documents.length === 0 ? (
              <p className="rounded-xl bg-[#f7f4f3] px-4 py-4 text-sm text-secondary">No documents uploaded yet.</p>
            ) : (
              <div className="space-y-4">
                {documents.map((item) => {
                  const safeFileUrl = toSafeExternalUrl(item.fileUrl)
                  return (
                    <div key={item._id} className="rounded-[20px] bg-[#f7f4f3] p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[16px] font-bold">{item.fileName}</p>
                          <p className="mt-1 text-[13px] text-secondary">{item.category || 'Document'}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-[12px] font-bold ${statusClass(item.status)}`}>
                          {item.status || 'Pending'}
                        </span>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-3 text-[12px] font-semibold text-secondary">
                        {safeFileUrl ? (
                          <a href={safeFileUrl} target="_blank" rel="noreferrer" className="text-primary underline">Open File</a>
                        ) : (
                          <span className="text-[#1f4cb7]">Uploaded from device</span>
                        )}
                        <span className="h-1 w-1 rounded-full bg-[#9aa3ae]" />
                        <span>{item.mimeType || 'Document'}</span>
                        <span className="h-1 w-1 rounded-full bg-[#9aa3ae]" />
                        <span>{formatFileSize(item.sizeBytes)}</span>
                        <span className="h-1 w-1 rounded-full bg-[#9aa3ae]" />
                        <span>Updated: {formatDate(item.updatedAt)}</span>
                      </div>
                      {item.reviewNote ? <p className="mt-3 text-sm text-secondary">Note: {item.reviewNote}</p> : null}
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </AdminLayout>
  )
}

export default DocumentsPage
