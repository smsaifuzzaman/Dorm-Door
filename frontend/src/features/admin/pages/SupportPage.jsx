import { useEffect, useMemo, useRef, useState } from 'react'
import AdminLayout from '../components/layout/AdminLayout'
import Icon from '../components/Icon'
import { topbarAvatars } from '../data/dashboardData'
import { api } from '../../../api/client'

function StudentAvatar({ className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={`flex items-center justify-center rounded-full bg-[#e5edf9] font-extrabold text-[#0c56d0] ${className}`}
    >
      S
    </div>
  )
}

function formatRelativeTime(value) {
  if (!value) return 'Just now'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'Just now'

  const diffMs = Date.now() - parsed.getTime()
  const diffMinutes = Math.max(1, Math.round(diffMs / (60 * 1000)))
  if (diffMinutes < 60) return `${diffMinutes} min ago`

  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`

  const diffDays = Math.round(diffHours / 24)
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
}

function formatReadableDate(value) {
  if (!value) return 'Not available'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'Not available'
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatFileSize(value) {
  const bytes = Number(value) || 0
  if (bytes <= 0) return 'N/A'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function SupportPage() {
  const fileInputRef = useRef(null)
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [requestState, setRequestState] = useState('')
  const [activeTicketId, setActiveTicketId] = useState('')
  const [filter, setFilter] = useState('All Tickets')
  const [reply, setReply] = useState('')
  const [attachment, setAttachment] = useState(null)
  const [sending, setSending] = useState(false)
  const [resolving, setResolving] = useState(false)

  useEffect(() => {
    async function loadTickets() {
      setLoading(true)
      setError('')

      try {
        const { data } = await api.get('/support')
        const nextTickets = data.tickets || []
        setTickets(nextTickets)
        setActiveTicketId(nextTickets[0]?._id || '')
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Failed to load support tickets')
      } finally {
        setLoading(false)
      }
    }

    loadTickets()
  }, [])

  const filteredTickets = useMemo(() => {
    if (filter === 'Resolved') return tickets.filter((ticket) => ticket.status === 'Resolved')
    if (filter === 'Pending') return tickets.filter((ticket) => ticket.status !== 'Resolved')
    return tickets
  }, [filter, tickets])

  const activeTicket = useMemo(
    () => tickets.find((ticket) => ticket._id === activeTicketId) || filteredTickets[0] || null,
    [activeTicketId, filteredTickets, tickets],
  )

  const mapTicketToView = (ticket) => {
    if (!ticket) return null

    const messages = (ticket.messages || []).map((message) => {
      const isAdmin = message.sender?.role === 'admin'
      return {
        from: isAdmin ? 'admin' : 'resident',
        date: formatReadableDate(message.createdAt),
        text: message.text,
        attachments: message.attachments || [],
      }
    })

    return {
      ...ticket,
      code: `#SR-${String(ticket._id || '').slice(-4).toUpperCase()}`,
      time: formatRelativeTime(ticket.updatedAt),
      preview: messages[0]?.text || ticket.description || '',
      resident: ticket.student?.name || 'Unknown Resident',
      residentInfo: `${ticket.student?.studentId || 'No student ID'} - ${ticket.student?.email || 'No email'}`,
      messages,
      ticketInfo: [
        ['Status', ticket.status || 'Open'],
        ['Priority', ticket.priority || 'Medium'],
        ['Created', formatReadableDate(ticket.createdAt)],
        ['Assigned', ticket.assignedTo?.name || 'Unassigned'],
      ],
      profileInfo: [
        ['Email', ticket.student?.email || 'Not provided'],
        ['Student ID', ticket.student?.studentId || 'Not provided'],
        ['Department', ticket.student?.department || 'Not provided'],
        ['Phone', ticket.student?.phone || 'Not provided'],
      ],
      history: [...messages]
        .slice(-3)
        .reverse()
        .map((message) => [message.date, message.text.slice(0, 36) + (message.text.length > 36 ? '...' : ''), message.from === 'admin' ? 'Admin Reply' : 'Student']),
    }
  }

  const activeViewTicket = mapTicketToView(activeTicket)

  const handleMarkResolved = async () => {
    if (!activeTicket?._id) return
    setResolving(true)
    setRequestState('')

    try {
      await api.patch(`/support/${activeTicket._id}`, { status: 'Resolved' })
      const { data: refreshed } = await api.get('/support')
      const nextTickets = refreshed.tickets || []
      setTickets(nextTickets)
      if (nextTickets.every((ticket) => ticket._id !== activeTicket._id)) {
        setActiveTicketId(nextTickets[0]?._id || '')
      }
      setRequestState('Ticket marked as resolved.')
    } catch (requestError) {
      setRequestState(requestError.response?.data?.message || 'Failed to update ticket.')
    } finally {
      setResolving(false)
    }
  }

  const handleSendMessage = async () => {
    if (!activeTicket?._id || (!reply.trim() && !attachment)) return
    setSending(true)
    setRequestState('')

    try {
      const payload = new FormData()
      payload.append('text', reply.trim())
      if (attachment) payload.append('file', attachment)
      const { data } = await api.post(`/support/${activeTicket._id}/messages`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const updated = data.ticket
      setTickets((prev) => prev.map((ticket) => (ticket._id === updated._id ? updated : ticket)))
      setReply('')
      setAttachment(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (requestError) {
      setRequestState(requestError.response?.data?.message || 'Failed to send message.')
    } finally {
      setSending(false)
    }
  }

  return (
    <AdminLayout
      activeKey="support"
      sidebarVariant="atelier-badge"
      topbarProps={{
        searchPlaceholder: 'Search support tickets...',
        showBrand: true,
        brandText: 'Dorm Admin',
        profileName: '',
        profileRole: '',
        avatar: topbarAvatars.supportAdmin,
      }}
      mainClassName="overflow-hidden"
      contentClassName="flex min-h-[calc(100vh-72px)] overflow-hidden"
    >
      <div className="flex w-96 flex-col bg-surface-container-low">
        <div className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-on-surface">Inbox</h2>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {['All Tickets', 'Pending', 'Resolved'].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFilter(option)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                  filter === option
                    ? 'bg-primary text-white'
                    : 'bg-white text-secondary hover:bg-slate-100'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="no-scrollbar flex-1 overflow-y-auto">
          {loading ? (
            <div className="px-5 py-6 text-sm text-secondary">Loading tickets...</div>
          ) : filteredTickets.length === 0 ? (
            <div className="px-5 py-6 text-sm text-secondary">No support messages yet.</div>
          ) : filteredTickets.map((ticket) => {
            const active = ticket._id === (activeViewTicket?._id || '')
            const mapped = mapTicketToView(ticket)
            return (
              <button
                type="button"
                key={ticket._id}
                onClick={() => {
                  setActiveTicketId(ticket._id)
                  setRequestState('')
                }}
                className={`w-full cursor-pointer px-5 py-5 text-left transition-all ${
                  active
                    ? 'border-l-4 border-primary bg-surface-container-lowest'
                    : `border-b border-outline-variant/10 ${ticket.status === 'Resolved' ? 'opacity-70 hover:bg-white/20' : 'hover:bg-white/40'}`
                }`}
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">{mapped.code}</span>
                  <span className="text-[10px] font-medium text-secondary">{mapped.time}</span>
                </div>
                <h3 className="mb-1 truncate text-sm font-bold text-on-surface">{ticket.subject}</h3>
                {!!mapped.preview && <p className="line-clamp-2 text-xs leading-relaxed text-secondary">{mapped.preview}</p>}
                <div className="mt-3 flex items-center gap-2">
                  <StudentAvatar className="h-6 w-6 text-[11px]" />
                  <span data-user-content="true" className="text-[11px] font-semibold text-on-surface">{mapped.resident}</span>
                  {ticket.status !== 'Resolved' ? (
                    <span className="ml-auto flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600">
                      <span className="h-1 w-1 rounded-full bg-amber-600" /> {ticket.priority || 'Medium'}
                    </span>
                  ) : (
                    <span className="ml-auto rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">RESOLVED</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden bg-surface">
        {activeViewTicket ? (
          <>
            <div className="flex items-center justify-between bg-white/40 px-8 py-6">
              <div className="flex items-center gap-4">
                <StudentAvatar className="h-12 w-12 text-base" />
                <div>
                  <h2 data-user-content="true" className="text-xl font-bold text-on-surface">{activeViewTicket.resident}</h2>
                  <p data-user-content="true" className="text-sm text-secondary">{activeViewTicket.residentInfo}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={handleMarkResolved} disabled={resolving || activeViewTicket.status === 'Resolved'} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60">
                  <Icon name="check_circle" />
                  {resolving ? 'Saving...' : 'Mark Resolved'}
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto p-8">
              {activeViewTicket.messages.length === 0 ? (
                <p className="rounded-2xl bg-white px-5 py-4 text-sm text-secondary shadow-soft">No support messages yet.</p>
              ) : (
                activeViewTicket.messages.map((message, index) => (
                  <div key={`${message.from}-${index}`} className={`max-w-2xl rounded-2xl p-5 ${message.from === 'admin' ? 'ml-auto bg-primary text-white' : 'bg-white shadow-soft'}`}>
                    <p className={`mb-2 text-[11px] font-bold uppercase tracking-widest ${message.from === 'admin' ? 'text-white/80' : 'text-secondary'}`}>
                      {message.date}
                    </p>
                    <p className={`text-sm leading-relaxed ${message.from === 'admin' ? 'text-white' : 'text-on-surface'}`}>{message.text}</p>
                    {message.attachments?.length ? (
                      <div className="mt-3 space-y-1">
                        {message.attachments.map((file, fileIndex) => (
                          <p key={`${file.fileName}-${fileIndex}`} className={`text-xs font-semibold ${message.from === 'admin' ? 'text-white/80' : 'text-secondary'}`}>
                            {file.fileName} ({formatFileSize(file.sizeBytes)})
                          </p>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-outline-variant/10 bg-white p-6">
              {requestState ? <p className="mb-3 text-xs font-semibold text-secondary">{requestState}</p> : null}
              {error ? <p className="mb-3 text-xs font-semibold text-error">{error}</p> : null}
              {attachment ? <p className="mb-3 text-xs font-semibold text-secondary">Attached: {attachment.name}</p> : null}
              <div className="flex items-end gap-3 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-3">
                <div className="flex gap-2 pb-2">
                  <input ref={fileInputRef} type="file" className="hidden" onChange={(event) => setAttachment(event.target.files?.[0] || null)} />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-full p-2 transition-colors hover:bg-white" title="Attach file"><Icon name="attach_file" /></button>
                </div>
                <textarea
                  rows="2"
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  className="flex-1 resize-none border-none bg-transparent px-2 py-2 text-sm"
                  placeholder="Type a reply"
                />
                <button type="button" onClick={handleSendMessage} disabled={sending || (!reply.trim() && !attachment)} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60">
                  {sending ? 'Sending...' : 'Send Message'}
                  <Icon name="send" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-secondary">
            No support messages yet.
          </div>
        )}
      </div>

      <div className="no-scrollbar hidden w-80 flex-col gap-8 overflow-y-auto bg-surface-container-highest/30 p-8 xl:flex">
        <section>
          <h4 className="mb-4 text-sm font-bold text-on-surface">Ticket Info</h4>
          <div className="space-y-3 rounded-2xl bg-white/50 p-5">
            {(activeViewTicket?.ticketInfo || []).map(([label, value]) => (
              <div key={label}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-secondary">{label}</p>
                <p className="mt-1 text-sm font-semibold text-on-surface">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h4 className="mb-4 text-sm font-bold text-on-surface">Resident Profile</h4>
          <div className="space-y-3 rounded-2xl bg-white/50 p-5">
            {(activeViewTicket?.profileInfo || []).map(([label, value]) => (
              <div key={label}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-secondary">{label}</p>
                <p className="mt-1 text-sm font-semibold text-on-surface">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h4 className="mb-4 text-sm font-bold text-on-surface">Past Tickets</h4>
          <div className="space-y-3">
            {(activeViewTicket?.history || []).map(([date, title, statusText], index) => (
              <div key={`${date}-${index}`} className="cursor-pointer rounded-lg bg-white/40 p-3 transition-all hover:bg-white">
                <span className="text-[10px] font-bold text-slate-400">{date}</span>
                <p className="mt-1 text-[11px] font-bold text-on-surface">{title}</p>
                <span className="text-[9px] font-bold uppercase text-emerald-600">{statusText}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AdminLayout>
  )
}

export default SupportPage
