import { useEffect, useMemo, useState } from 'react'
import AdminLayout from '../components/layout/AdminLayout'
import Icon from '../components/Icon'
import { topbarAvatars } from '../data/dashboardData'
import { api } from '../../../api/client'

const PREVIEW_PLACEHOLDER = 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=800&q=80'

function formatRelativeTime(value) {
  if (!value) return 'Just now'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'Just now'

  const diffMs = Date.now() - parsed.getTime()
  const diffMinutes = Math.max(1, Math.round(diffMs / (60 * 1000)))
  if (diffMinutes < 60) return `${diffMinutes}m ago`

  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  const diffDays = Math.round(diffHours / 24)
  return `${diffDays}d ago`
}

function isImageUrl(url) {
  return /\.(png|jpg|jpeg|webp|gif|bmp|svg)$/i.test(String(url || ''))
}

function docBadge(status) {
  if (status === 'Verified') return { label: 'VERIFIED', color: 'text-primary bg-primary/10' }
  if (status === 'Pending') return { label: 'PENDING', color: 'text-amber-600 bg-amber-100' }
  if (status === 'Needs Update') return { label: 'RE-UPLOAD', color: 'text-error bg-error/10' }
  return { label: 'REJECTED', color: 'text-red-700 bg-red-100' }
}

function docNote(status, reviewNote) {
  if (reviewNote) {
    return {
      title: 'Admin Note',
      text: reviewNote,
      icon: 'info',
      tone: 'bg-secondary-container text-primary',
    }
  }

  if (status === 'Verified') {
    return {
      title: 'Validation Complete',
      text: 'Document approved and synced with applicant profile.',
      icon: 'check_circle',
      tone: 'bg-primary/10 text-primary',
    }
  }

  if (status === 'Needs Update') {
    return {
      title: 'Re-upload Requested',
      text: 'Student must provide an updated document file.',
      icon: 'refresh',
      tone: 'bg-error/10 text-error',
    }
  }

  if (status === 'Rejected') {
    return {
      title: 'Rejected',
      text: 'Document was rejected by admin review.',
      icon: 'close',
      tone: 'bg-error/10 text-error',
    }
  }

  return {
    title: 'Awaiting Review',
    text: 'This document is pending administrative verification.',
    icon: 'pending_actions',
    tone: 'bg-secondary-container text-on-secondary-container',
  }
}

function normalizeApplicants(documents = []) {
  const grouped = documents.reduce((acc, doc) => {
    const studentId = doc.student?._id || 'unknown'
    if (!acc[studentId]) {
      acc[studentId] = {
        id: studentId,
        name: doc.student?.name || 'Unknown Applicant',
        email: doc.student?.email || 'Not provided',
        recordId: doc.student?.studentId || studentId.slice(-8).toUpperCase(),
        avatar: doc.student?.profileImage || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
        largeAvatar: doc.student?.profileImage || 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=300&q=80',
        documents: [],
      }
    }

    acc[studentId].documents.push(doc)
    return acc
  }, {})

  return Object.values(grouped)
    .map((applicant) => {
      const sortedDocuments = [...applicant.documents].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      const pendingCount = sortedDocuments.filter((item) => item.status === 'Pending' || item.status === 'Needs Update').length

      return {
        ...applicant,
        applied: formatRelativeTime(sortedDocuments[0]?.createdAt),
        badge: pendingCount > 0 ? `${pendingCount} PENDING` : 'CLEARED',
        badgeColor: pendingCount > 0 ? 'text-error bg-error/10' : 'text-primary bg-primary/10',
        tags: [...new Set(sortedDocuments.map((item) => item.category || 'Other'))].slice(0, 3),
        documents: sortedDocuments,
      }
    })
    .sort((a, b) => new Date(b.documents[0]?.createdAt || 0) - new Date(a.documents[0]?.createdAt || 0))
}

function DocumentsPage() {
  const [documents, setDocuments] = useState([])
  const [activeApplicantId, setActiveApplicantId] = useState('')
  const [activeDocumentId, setActiveDocumentId] = useState('')
  const [reviewNote, setReviewNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [requestState, setRequestState] = useState('')
  const [reviewing, setReviewing] = useState(false)

  useEffect(() => {
    async function loadDocuments() {
      setLoading(true)
      setError('')

      try {
        const { data } = await api.get('/documents')
        const docs = data.documents || []
        setDocuments(docs)

        const normalized = normalizeApplicants(docs)
        const firstApplicantId = normalized[0]?.id || ''
        setActiveApplicantId(firstApplicantId)
        setActiveDocumentId(normalized[0]?.documents?.[0]?._id || '')
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Failed to load document queue')
      } finally {
        setLoading(false)
      }
    }

    loadDocuments()
  }, [])

  const applicants = useMemo(() => normalizeApplicants(documents), [documents])
  const activeApplicant = useMemo(
    () => applicants.find((item) => item.id === activeApplicantId) || applicants[0] || null,
    [activeApplicantId, applicants],
  )

  const activeDocument = useMemo(() => {
    const fallback = activeApplicant?.documents?.[0] || null
    if (!activeApplicant) return null
    return activeApplicant.documents.find((item) => item._id === activeDocumentId) || fallback
  }, [activeApplicant, activeDocumentId])

  const pendingCount = useMemo(
    () => documents.filter((item) => item.status === 'Pending' || item.status === 'Needs Update').length,
    [documents],
  )

  const urgentCount = useMemo(
    () => documents.filter((item) => item.status === 'Needs Update').length,
    [documents],
  )

  const handleApplicantSelect = (applicantId) => {
    setActiveApplicantId(applicantId)
    const selectedApplicant = applicants.find((item) => item.id === applicantId)
    const firstDocument = selectedApplicant?.documents?.[0]
    setActiveDocumentId(firstDocument?._id || '')
    setReviewNote(firstDocument?.reviewNote || '')
    setRequestState('')
  }

  const handleDocumentSelect = (doc) => {
    setActiveDocumentId(doc._id)
    setReviewNote(doc.reviewNote || '')
    setRequestState('')
  }

  const handleReview = async (status) => {
    if (!activeDocument?._id) return
    setReviewing(true)
    setRequestState('')

    try {
      const { data } = await api.patch(`/documents/${activeDocument._id}/review`, {
        status,
        reviewNote: reviewNote.trim(),
      })

      const updated = data.document
      setDocuments((prev) =>
        prev.map((item) => (
          item._id === updated._id
            ? {
                ...item,
                status: updated.status,
                reviewNote: updated.reviewNote,
                reviewedBy: updated.reviewedBy,
                updatedAt: updated.updatedAt || item.updatedAt,
              }
            : item
        )),
      )
      setRequestState(`Document marked as ${status}.`)
    } catch (requestError) {
      setRequestState(requestError.response?.data?.message || 'Failed to update document status.')
    } finally {
      setReviewing(false)
    }
  }

  return (
    <AdminLayout
      activeKey="documents"
      sidebarVariant="atelier"
      topbarProps={{
        searchPlaceholder: 'Search applicants...',
        profileName: 'Admin User',
        profileRole: 'Housing Authority',
        avatar: topbarAvatars.docAdmin,
      }}
      contentClassName="mx-auto max-w-7xl p-10"
    >
      <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-primary">Verification Queue</span>
          <h2 className="text-5xl font-black tracking-tighter text-on-surface">Document Center</h2>
          <p className="mt-3 max-w-md text-secondary">
            Reviewing uploaded applicant documents and updating verification decisions in real-time.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex flex-col justify-center rounded-xl bg-secondary-container px-6 py-4">
            <span className="text-xs font-bold uppercase tracking-tight text-on-secondary-container">Pending Approval</span>
            <span className="text-2xl font-black text-primary">{loading ? '...' : pendingCount}</span>
          </div>
          <div className="flex flex-col justify-center rounded-xl bg-surface-container-high px-6 py-4">
            <span className="text-xs font-bold uppercase tracking-tight text-on-secondary-container">Urgent</span>
            <span className="text-2xl font-black text-error">{loading ? '...' : urgentCount}</span>
          </div>
        </div>
      </div>

      {error ? <p className="mb-6 rounded-xl bg-[#ffe9ec] px-4 py-3 text-sm font-semibold text-[#c73535]">{error}</p> : null}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-4">
          <h3 className="flex items-center gap-2 px-2 text-sm font-bold text-on-surface-variant">
            <Icon name="filter_list" className="text-sm" />
            RECENT SUBMISSIONS
          </h3>

          {loading ? (
            <div className="rounded-xl bg-surface-container-lowest p-5 text-sm text-secondary">Loading applicants...</div>
          ) : applicants.length === 0 ? (
            <div className="rounded-xl bg-surface-container-lowest p-5 text-sm text-secondary">No document submissions found.</div>
          ) : applicants.map((applicant) => {
            const active = applicant.id === (activeApplicant?.id || '')
            return (
              <button
                key={applicant.id}
                type="button"
                onClick={() => handleApplicantSelect(applicant.id)}
                className={`group w-full rounded-xl p-5 text-left transition-all ${
                  active
                    ? 'border-l-4 border-primary bg-surface-container-lowest ring-1 ring-black/[0.03]'
                    : 'bg-surface hover:scale-[1.02] hover:bg-surface-container-lowest'
                }`}
              >
                <div className="flex items-start gap-4">
                  <img src={applicant.avatar} alt={applicant.name} className={`h-12 w-12 rounded-lg object-cover ${active ? '' : 'opacity-80'}`} />
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="font-bold text-on-surface">{applicant.name}</h4>
                      <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${applicant.badgeColor}`}>
                        {applicant.badge}
                      </span>
                    </div>
                    <p className="mb-3 text-xs text-secondary">Applied: {applicant.applied}</p>
                    <div className="flex flex-wrap gap-2">
                      {applicant.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded bg-secondary-container px-2 py-1 text-[10px] font-bold text-on-secondary-container"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <div className="lg:col-span-8">
          <div className="flex h-full min-h-[600px] flex-col overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm">
            {activeApplicant ? (
              <>
                <div className="flex items-center justify-between border-b border-outline-variant/10 bg-white p-8">
                  <div className="flex items-center gap-6">
                    <img src={activeApplicant.largeAvatar} alt={activeApplicant.name} className="h-20 w-20 rounded-2xl object-cover ring-4 ring-surface shadow-md" />
                    <div>
                      <h3 className="text-3xl font-black tracking-tight text-on-surface">{activeApplicant.name}</h3>
                      <p className="mt-1 flex flex-wrap items-center gap-4 text-sm text-secondary">
                        <span className="flex items-center gap-1">
                          <Icon name="mail" className="text-xs" />
                          {activeApplicant.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon name="badge" className="text-xs" />
                          {activeApplicant.recordId}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black uppercase tracking-widest text-secondary">
                      FILES: {activeApplicant.documents.length}
                    </span>
                    <button type="button" className="mt-2 rounded-lg border border-outline-variant/20 p-2 transition-colors hover:bg-slate-100">
                      <Icon name="more_vert" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-surface-container-low p-8">
                  <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
                    {activeApplicant.documents.map((document) => {
                      const badge = docBadge(document.status)
                      const note = docNote(document.status, document.reviewNote)
                      const previewImage = isImageUrl(document.fileUrl) ? document.fileUrl : PREVIEW_PLACEHOLDER
                      const isActiveDocument = document._id === activeDocument?._id

                      return (
                        <button
                          key={document._id}
                          type="button"
                          onClick={() => handleDocumentSelect(document)}
                          className={`flex h-full flex-col gap-4 rounded-xl border p-3 text-left transition ${
                            isActiveDocument
                              ? 'border-primary/30 bg-primary/[0.03] ring-1 ring-primary/30'
                              : 'border-transparent hover:bg-white/60'
                          }`}
                        >
                          <div className="flex items-center justify-between px-1">
                            <h5 className="text-xs font-black uppercase tracking-widest text-secondary">{document.category || 'Other'}</h5>
                            <span className={`flex items-center gap-1 rounded px-2 py-1 text-[10px] font-bold ${badge.color}`}>
                              {badge.label}
                            </span>
                          </div>
                          <div className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-white ring-1 ring-black/[0.05] shadow-xl shadow-slate-900/5">
                            <img src={previewImage} alt={document.fileName} className="h-full w-full object-cover transition-all duration-500 group-hover:scale-[1.02]" />
                            <div className="absolute inset-0 flex items-center justify-center gap-4 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                              <a href={document.fileUrl} target="_blank" rel="noreferrer" className="rounded-full bg-white/90 p-3 transition-colors hover:bg-white">
                                <Icon name="open_in_new" className="text-on-surface" />
                              </a>
                              <a href={document.fileUrl} target="_blank" rel="noreferrer" className="rounded-full bg-white/90 p-3 transition-colors hover:bg-white">
                                <Icon name="download" className="text-on-surface" />
                              </a>
                            </div>
                          </div>
                          <div className={`flex min-h-[82px] items-center gap-3 rounded-xl bg-white/50 p-4 ${isActiveDocument ? 'border border-primary/20' : ''}`}>
                            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${note.tone}`}>
                              <Icon name={note.icon} />
                            </div>
                            <div>
                              <p className={`text-xs font-bold ${isActiveDocument ? 'text-primary' : 'text-on-surface'}`}>
                                {note.title}
                              </p>
                              <p className="text-[10px] text-secondary">{note.text}</p>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="flex flex-col items-center justify-between gap-6 border-t border-outline-variant/10 bg-white p-8 md:flex-row">
                  <div className="w-full md:max-w-[420px]">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      <p className="text-xs font-medium text-secondary">
                        Reviewing <span className="font-bold text-on-surface">{activeDocument?.fileName || 'document'}</span>
                      </p>
                    </div>
                    <textarea
                      rows={3}
                      value={reviewNote}
                      onChange={(event) => setReviewNote(event.target.value)}
                      placeholder="Add a note for the student (optional)"
                      className="w-full rounded-xl border border-outline-variant/20 px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                    {requestState ? <p className="mt-2 text-xs font-semibold text-secondary">{requestState}</p> : null}
                  </div>
                  <div className="flex w-full gap-4 md:w-auto">
                    <button
                      type="button"
                      disabled={!activeDocument || reviewing}
                      onClick={() => handleReview('Rejected')}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-outline-variant/30 px-6 py-3 text-sm font-bold text-secondary transition-all hover:bg-error/5 hover:text-error disabled:cursor-not-allowed disabled:opacity-50 md:flex-none"
                    >
                      <Icon name="close" className="text-lg" />
                      Reject
                    </button>
                    <button
                      type="button"
                      disabled={!activeDocument || reviewing}
                      onClick={() => handleReview('Needs Update')}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-outline-variant/30 px-6 py-3 text-sm font-bold text-on-surface transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 md:flex-none"
                    >
                      <Icon name="refresh" className="text-lg" />
                      Request Re-upload
                    </button>
                    <button
                      type="button"
                      disabled={!activeDocument || reviewing}
                      onClick={() => handleReview('Verified')}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-container px-8 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 md:flex-none"
                    >
                      <Icon name="check_circle" className="text-lg" />
                      {reviewing ? 'Saving...' : 'Approve Document'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center p-10 text-center text-sm text-secondary">
                No documents available for review yet.
              </div>
            )}
          </div>
        </div>
      </div>

    </AdminLayout>
  )
}

export default DocumentsPage
