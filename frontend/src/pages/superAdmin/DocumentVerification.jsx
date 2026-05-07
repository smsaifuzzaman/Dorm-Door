import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Eye, XCircle } from 'lucide-react'
import DataTable from '../../components/superAdmin/DataTable'
import SimpleModal from '../../components/superAdmin/SimpleModal'
import StatusBadge from '../../components/superAdmin/StatusBadge'
import SuperAdminLayout from '../../components/superAdmin/SuperAdminLayout'
import { getDocuments, rejectDocument, verifyDocument } from '../../services/superAdminApi'
import { formatDate, formatDateTime, referenceId } from './pageUtils'

function DocumentVerification() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [selectedDocument, setSelectedDocument] = useState(null)

  const loadDocuments = async () => {
    setLoading(true)
    setError('')

    try {
      const { data } = await getDocuments()
      setDocuments(data.documents || [])
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDocuments()
  }, [])

  const handleVerify = async (doc) => {
    try {
      await verifyDocument(doc._id)
      await loadDocuments()
      setMessage('Document verified successfully.')
    } catch (requestError) {
      setMessage(requestError.response?.data?.message || 'Failed to verify document.')
    }
  }

  const handleReject = async (doc) => {
    const reason = window.prompt('Enter rejection reason:')
    if (!reason) return
    try {
      await rejectDocument(doc._id, reason)
      await loadDocuments()
      setMessage('Document rejected successfully.')
    } catch (requestError) {
      setMessage(requestError.response?.data?.message || 'Failed to reject document.')
    }
  }

  const columns = useMemo(
    () => [
      { key: 'student', label: 'User Name', render: (row) => row.student?.name || 'Unknown User' },
      { key: 'reference', label: 'Reference ID', render: (row) => row.student?.studentId || referenceId(row.application || row) },
      { key: 'category', label: 'Document Type' },
      { key: 'createdAt', label: 'Upload Date', render: (row) => formatDate(row.createdAt) },
      { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
      {
        key: 'actions',
        label: 'Actions',
        render: (row) => (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setSelectedDocument(row)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" title="View">
              <Eye size={16} />
            </button>
            <button type="button" onClick={() => handleVerify(row)} className="rounded-lg p-2 text-emerald-700 hover:bg-emerald-50" title="Verify">
              <CheckCircle2 size={16} />
            </button>
            <button type="button" onClick={() => handleReject(row)} className="rounded-lg p-2 text-red-600 hover:bg-red-50" title="Reject">
              <XCircle size={16} />
            </button>
          </div>
        ),
      },
    ],
    [],
  )

  return (
    <SuperAdminLayout title="Documents" subtitle="Verify or reject uploaded user documents.">
      {error ? <p className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
      {message ? <p className="mb-5 rounded-lg bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">{message}</p> : null}

      <DataTable columns={columns} rows={documents} loading={loading} emptyMessage="No documents found." />

      {selectedDocument ? (
        <SimpleModal title="Document Details" onClose={() => setSelectedDocument(null)}>
          <div className="grid gap-4 text-sm text-slate-700 sm:grid-cols-2">
            <p><strong>User:</strong> {selectedDocument.student?.name || 'N/A'}</p>
            <p><strong>Reference ID:</strong> {selectedDocument.student?.studentId || referenceId(selectedDocument.application || selectedDocument)}</p>
            <p><strong>Type:</strong> {selectedDocument.category}</p>
            <p><strong>File:</strong> {selectedDocument.fileName}</p>
            <p><strong>Uploaded:</strong> {formatDateTime(selectedDocument.createdAt)}</p>
            <p><strong>Status:</strong> {selectedDocument.status}</p>
            {selectedDocument.fileUrl ? (
              <p className="sm:col-span-2">
                <strong>File URL:</strong>{' '}
                <a href={selectedDocument.fileUrl} target="_blank" rel="noreferrer" className="font-bold text-primary underline">Open document</a>
              </p>
            ) : null}
            {selectedDocument.reviewNote ? <p className="sm:col-span-2"><strong>Review Note:</strong> {selectedDocument.reviewNote}</p> : null}
          </div>
        </SimpleModal>
      ) : null}
    </SuperAdminLayout>
  )
}

export default DocumentVerification
