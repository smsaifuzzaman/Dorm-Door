import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../../../api/client'
import { useAuth } from '../../../../context/AuthContext'
import { useLanguage } from '../../../../context/LanguageContext'
import { displayAvatarFor } from '../../../../utils/avatar'
import Icon from '../Icon'

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

function RoleAvatar({ symbol = 'A', image = '', className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={`flex items-center justify-center overflow-hidden rounded-full bg-[#e5edf9] font-extrabold text-[#0c56d0] ${className}`}
    >
      {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : symbol}
    </div>
  )
}

function Topbar({ searchPlaceholder = 'Search...', profileName = '', profileRole = 'Housing Authority', avatar: _avatar, brandText = '', showBrand = false, showSearch = false }) {
  const navigate = useNavigate()
  const { language, setLanguage } = useLanguage()
  const { token, user, logout } = useAuth()
  const avatar = displayAvatarFor(user, 'A')
  const isDemoUser = token === 'dormdoor_demo_token'
  const demoStorageKey = 'dormdoor_demo_admin_notifications'

  const [notifications, setNotifications] = useState([])
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [notificationsError, setNotificationsError] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const notificationMenuRef = useRef(null)
  const profileMenuRef = useRef(null)

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  )

  const parseDemoNotifications = (raw) => {
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : null
    } catch {
      return null
    }
  }

  const seedDemoNotifications = () => {
    return [
      {
        _id: 'demo-admin-notification-1',
        title: 'New Application Submitted',
        message: 'A student submitted a new room application.',
        read: false,
        createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
      },
      {
        _id: 'demo-admin-notification-2',
        title: 'Document Needs Review',
        message: 'A pending verification document is waiting in the queue.',
        read: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        _id: 'demo-admin-notification-3',
        title: 'Support Ticket Update',
        message: 'A support ticket was updated by a resident.',
        read: true,
        createdAt: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
      },
    ]
  }

  const persistDemoNotifications = (nextNotifications) => {
    localStorage.setItem(demoStorageKey, JSON.stringify(nextNotifications))
  }

  const refreshNotifications = async () => {
    setNotificationsLoading(true)
    setNotificationsError('')

    try {
      if (isDemoUser) {
        const stored = parseDemoNotifications(localStorage.getItem(demoStorageKey))
        if (stored) {
          setNotifications(stored)
        } else {
          const seed = seedDemoNotifications()
          persistDemoNotifications(seed)
          setNotifications(seed)
        }
        return
      }

      if (!token) {
        setNotifications([])
        return
      }

      const { data } = await api.get('/notifications')
      setNotifications(data.notifications || [])
    } catch (requestError) {
      setNotificationsError(requestError.response?.data?.message || 'Failed to load notifications')
    } finally {
      setNotificationsLoading(false)
    }
  }

  const handleNotificationToggle = () => {
    setShowProfileMenu(false)
    setShowNotifications((current) => {
      const nextOpen = !current
      if (nextOpen) {
        void refreshNotifications()
      }
      return nextOpen
    })
  }

  const handleMarkRead = async (notificationId) => {
    if (!notificationId) return
    const target = notifications.find((item) => item._id === notificationId)
    if (!target || target.read) return

    try {
      if (isDemoUser) {
        const next = notifications.map((item) => (item._id === notificationId ? { ...item, read: true } : item))
        setNotifications(next)
        persistDemoNotifications(next)
        return
      }

      await api.patch(`/notifications/${notificationId}/read`)
      setNotifications((prev) => prev.map((item) => (item._id === notificationId ? { ...item, read: true } : item)))
    } catch (requestError) {
      setNotificationsError(requestError.response?.data?.message || 'Failed to update notification status')
    }
  }

  const handleMarkAllRead = async () => {
    const unreadNotifications = notifications.filter((item) => !item.read)
    if (!unreadNotifications.length) return

    try {
      if (isDemoUser) {
        const next = notifications.map((item) => ({ ...item, read: true }))
        setNotifications(next)
        persistDemoNotifications(next)
        return
      }

      await Promise.all(unreadNotifications.map((item) => api.patch(`/notifications/${item._id}/read`)))
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })))
    } catch (requestError) {
      setNotificationsError(requestError.response?.data?.message || 'Failed to mark notifications as read')
    }
  }

  const goToSettings = () => {
    setShowNotifications(false)
    setShowProfileMenu(false)
    navigate('/admin/profile')
  }

  const handleProfileToggle = () => {
    setShowNotifications(false)
    setShowProfileMenu((current) => !current)
  }

  const signOutFromMenu = () => {
    setShowProfileMenu(false)
    logout()
    navigate('/login', { replace: true })
  }

  useEffect(() => {
    function handleOutsideClick(event) {
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target)) {
        setShowNotifications(false)
      }

      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [])

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#ece7e4] bg-white/75 px-8 py-4 backdrop-blur-xl">
      <div className="flex items-center gap-6">
        {showBrand && <h2 className="text-[18px] font-extrabold text-primaryDark">{brandText}</h2>}
        {showSearch ? (
          <div className="relative">
            <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              className="w-80 rounded-full border-none bg-[#f1ecea] py-3 pl-11 pr-4 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:bg-white focus:shadow-sm"
            />
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-4">
        <div data-no-translate="true" className="hidden items-center gap-2 text-xs font-bold tracking-widest text-secondary md:flex">
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`transition hover:text-primary ${language === 'en' ? 'text-primary' : ''}`}
          >
            EN
          </button>
          <span>|</span>
          <button
            type="button"
            onClick={() => setLanguage('bn')}
            className={`transition hover:text-primary ${language === 'bn' ? 'text-primary' : ''}`}
          >
            BN
          </button>
        </div>

        <div className="relative" ref={notificationMenuRef}>
          <button type="button" onClick={handleNotificationToggle} className="relative rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100">
            <Icon name="notifications" />
            {unreadCount > 0 ? <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" /> : null}
          </button>

          {showNotifications ? (
            <div className="absolute right-0 top-11 z-50 w-[360px] rounded-2xl bg-white p-4 shadow-[0_20px_40px_rgba(0,0,0,0.15)] ring-1 ring-[#efebea]">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-extrabold tracking-[-0.03em]">Notifications</p>
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={unreadCount === 0}
                  className="text-xs font-bold text-primary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Mark all read
                </button>
              </div>

              {notificationsLoading ? <p className="py-3 text-sm text-[#6b7280]">Loading notifications...</p> : null}
              {notificationsError ? <p className="rounded-lg bg-[#ffe9ec] px-3 py-2 text-xs font-semibold text-[#c73535]">{notificationsError}</p> : null}

              {!notificationsLoading && !notificationsError ? (
                notifications.length === 0 ? (
                  <p className="py-3 text-sm text-[#6b7280]">No notifications yet.</p>
                ) : (
                  <div className="max-h-[320px] space-y-2 overflow-auto pr-1">
                    {notifications.map((notification) => (
                      <button
                        key={notification._id}
                        type="button"
                        onClick={() => handleMarkRead(notification._id)}
                        className={`w-full rounded-xl px-3 py-3 text-left ring-1 transition ${
                          notification.read
                            ? 'bg-[#f7f4f3] text-[#58606b] ring-transparent'
                            : 'bg-[#eef3ff] text-[#1f2937] ring-[#d7e3ff]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-[13px] font-bold">{notification.title}</p>
                          {!notification.read ? <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" /> : null}
                        </div>
                        <p className="mt-1 text-[12px] leading-5">{notification.message}</p>
                        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7a818d]">
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
        <div className="relative" ref={profileMenuRef}>
          <button
            type="button"
            onClick={handleProfileToggle}
            className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100"
            aria-label="Profile"
            title="Profile"
          >
            <Icon name="person" />
          </button>

          {showProfileMenu ? (
            <div className="absolute right-0 top-11 z-50 w-48 rounded-2xl bg-white p-2 shadow-[0_20px_40px_rgba(0,0,0,0.15)] ring-1 ring-[#efebea]">
              <button
                type="button"
                onClick={goToSettings}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-[#2d3748] transition hover:bg-[#f7f4f3]"
              >
                <Icon name="edit" className="text-[18px]" />
                Profile
              </button>
              <button
                type="button"
                onClick={signOutFromMenu}
                className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-[#d03030] transition hover:bg-[#fff1f1]"
              >
                <Icon name="logout" className="text-[18px]" />
                Sign Out
              </button>
            </div>
          ) : null}
        </div>
        <div className="mx-2 h-8 w-px bg-[#e8e1dc]" />
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold text-[#1b1b1b]">{user?.name || profileName || 'Dorm Admin'}</p>
            <p className="text-[11px] text-secondary">{profileRole}</p>
          </div>
          <RoleAvatar symbol={avatar.initials} image={avatar.image} className="h-10 w-10 text-base shadow-sm" />
        </div>
      </div>
    </header>
  )
}

export default Topbar
