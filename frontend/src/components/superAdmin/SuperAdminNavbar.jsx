import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck } from 'lucide-react'
import { api } from '../../api/client'
import { useAuth } from '../../context/AuthContext'

function formatNotificationTimestamp(value) {
  if (!value) return 'Now'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'Now'

  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function SuperAdminNavbar({ title = 'Super Admin Panel', subtitle = 'Manage the full dorm booking system.' }) {
  const navigate = useNavigate()
  const { token, user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [notificationsError, setNotificationsError] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const notificationMenuRef = useRef(null)

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  )

  const refreshNotifications = async ({ silent = false } = {}) => {
    if (!token) {
      setNotifications([])
      return
    }

    if (!silent) {
      setNotificationsLoading(true)
      setNotificationsError('')
    }

    try {
      const { data } = await api.get('/notifications')
      setNotifications(data.notifications || [])
    } catch (requestError) {
      if (!silent) {
        setNotificationsError(requestError.response?.data?.message || 'Failed to load notifications')
      }
    } finally {
      if (!silent) {
        setNotificationsLoading(false)
      }
    }
  }

  const handleNotificationToggle = () => {
    setShowNotifications((current) => {
      const nextOpen = !current
      if (nextOpen) {
        void refreshNotifications()
      }
      return nextOpen
    })
  }

  const markNotificationRead = async (notificationId) => {
    if (!notificationId) return
    const target = notifications.find((item) => item._id === notificationId)
    if (!target || target.read) return

    try {
      await api.patch(`/notifications/${notificationId}/read`)
      setNotifications((prev) => prev.map((item) => (item._id === notificationId ? { ...item, read: true } : item)))
    } catch (requestError) {
      setNotificationsError(requestError.response?.data?.message || 'Failed to update notification')
    }
  }

  const handleNotificationClick = async (notification) => {
    await markNotificationRead(notification._id)
    setShowNotifications(false)

    if (notification.type === 'payment') {
      navigate('/super-admin/transactions')
    }
  }

  const handleMarkAllRead = async () => {
    const unreadNotifications = notifications.filter((item) => !item.read)
    if (!unreadNotifications.length) return

    try {
      await Promise.all(unreadNotifications.map((item) => api.patch(`/notifications/${item._id}/read`)))
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })))
    } catch (requestError) {
      setNotificationsError(requestError.response?.data?.message || 'Failed to mark notifications as read')
    }
  }

  useEffect(() => {
    void refreshNotifications({ silent: true })

    const interval = window.setInterval(() => {
      void refreshNotifications({ silent: true })
    }, 30000)

    return () => {
      window.clearInterval(interval)
    }
  }, [token])

  useEffect(() => {
    function handleOutsideClick(event) {
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [])

  return (
    <header className="sticky top-0 z-30 border-b border-[#e8edf3] bg-white/90 px-8 py-4 backdrop-blur">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-950">{title}</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative" ref={notificationMenuRef}>
            <button
              type="button"
              onClick={handleNotificationToggle}
              className="relative flex h-11 w-11 items-center justify-center rounded-lg border border-[#e8edf3] bg-slate-50 text-slate-600 transition hover:bg-white hover:text-primary"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-black text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              ) : null}
            </button>

            {showNotifications ? (
              <div className="absolute right-0 top-12 z-50 w-[360px] rounded-xl bg-white p-4 shadow-[0_20px_40px_rgba(15,23,42,0.18)] ring-1 ring-[#e8edf3]">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-black text-slate-950">Notifications</p>
                    <p className="mt-0.5 text-xs font-medium text-slate-500">{unreadCount} unread</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    disabled={unreadCount === 0}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <CheckCheck size={14} />
                    Read all
                  </button>
                </div>

                {notificationsLoading ? <p className="py-3 text-sm text-slate-500">Loading notifications...</p> : null}
                {notificationsError ? (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                    {notificationsError}
                  </p>
                ) : null}

                {!notificationsLoading && !notificationsError ? (
                  notifications.length === 0 ? (
                    <p className="py-3 text-sm text-slate-500">No notifications yet.</p>
                  ) : (
                    <div className="max-h-[340px] space-y-2 overflow-auto pr-1">
                      {notifications.map((notification) => (
                        <button
                          key={notification._id}
                          type="button"
                          onClick={() => handleNotificationClick(notification)}
                          className={`w-full rounded-lg px-3 py-3 text-left ring-1 transition ${
                            notification.read
                              ? 'bg-slate-50 text-slate-600 ring-transparent'
                              : 'bg-blue-50 text-slate-900 ring-blue-100'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-[13px] font-black">{notification.title}</p>
                            {!notification.read ? <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" /> : null}
                          </div>
                          <p className="mt-1 text-xs leading-5">{notification.message}</p>
                          <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
                            {formatNotificationTimestamp(notification.createdAt)}
                          </p>
                        </button>
                      ))}
                    </div>
                  )
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-[#e8edf3] bg-slate-50 px-3 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-black text-white">
              {(user?.name || 'S').slice(0, 1).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold leading-tight text-slate-900">{user?.name || 'Super Admin'}</p>
              <p className="text-xs text-slate-500">Full Access</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default SuperAdminNavbar
