import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'

const MENU = [
  { key: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { key: 'applications', label: 'Room Applications', icon: 'domain' },
  { key: 'maintenance', label: 'Maintenance', icon: 'build' },
  { key: 'documents', label: 'Documents', icon: 'description' },
  { key: 'reviews', label: 'Reviews', icon: 'rate_review' },
  { key: 'profile', label: 'Profile', icon: 'person' },
]

const PAGE_TO_PATH = {
  dashboard: '/student',
  applications: '/student/applications',
  maintenance: '/student/maintenance',
  documents: '/student/documents',
  reviews: '/student/reviews',
  profile: '/student/profile',
  support: '/student/support',
}

function pathToPage(pathname) {
  const entry = Object.entries(PAGE_TO_PATH).find(([, path]) => path === pathname)
  return entry ? entry[0] : 'dashboard'
}

function Icon({ name, filled = false, className = '' }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={filled ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" } : undefined}
    >
      {name}
    </span>
  )
}

function Avatar({ src, alt = 'avatar', className = '' }) {
  return <img src={src} alt={alt} className={`rounded-full object-cover ${className}`} />
}

function Sidebar({ activePage, setActivePage, onSignOut }) {
  const supportActive = activePage === 'support'

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[250px] flex-col border-r border-[#ece8e6] bg-[#fcf9f8] px-4 py-7">
      <div className="mb-8 px-3">
        <h1 className="text-[17px] font-extrabold tracking-[-0.04em] text-[#171717]">Dorm Door</h1>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6b7280]">Student Portal</p>
      </div>

      <nav className="space-y-2">
        {MENU.map((item) => {
          const active = activePage === item.key
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setActivePage(item.key)}
              className={`sidebar-item flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-left text-[14px] transition ${
                active
                  ? 'bg-white font-bold text-[#0c56d0] shadow-[0_2px_10px_rgba(0,0,0,0.04)] ring-1 ring-[#efebea]'
                  : 'text-[#5f6772] hover:bg-[#f3efed]'
              }`}
            >
              <Icon name={item.icon} filled={active} className="text-[17px]" />
              <span>{item.label}</span>
              {active ? <span className="ml-auto h-8 w-[4px] rounded-full bg-[#0c56d0]" /> : null}
            </button>
          )
        })}
      </nav>
      <div className="mt-auto space-y-2 border-t border-[#ebe6e3] px-2 pt-8">
        <button
          type="button"
          onClick={() => setActivePage('support')}
          className={`flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-left text-[13px] transition ${
            supportActive
              ? 'bg-white font-bold text-[#0c56d0] shadow-[0_2px_10px_rgba(0,0,0,0.04)] ring-1 ring-[#efebea]'
              : 'text-[#5f6772] hover:bg-[#f3efed]'
          }`}
        >
          <Icon name="help" filled={supportActive} className="text-[17px]" />
          <span>Support</span>
          {supportActive ? <span className="ml-auto h-8 w-[4px] rounded-full bg-[#0c56d0]" /> : null}
        </button>
        <button
          type="button"
          onClick={onSignOut}
          className="flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-left text-[13px] text-[#d03030] transition hover:bg-[#fff1f1]"
        >
          <Icon name="logout" className="text-[17px]" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}

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

function Topbar({ placeholder = 'Search portal...' }) {
  const navigate = useNavigate()
  const { language, setLanguage } = useLanguage()
  const { token, user, logout } = useAuth()
  const isDemoUser = token === 'dormdoor_demo_token'
  const demoStorageKey = 'dormdoor_demo_student_notifications'

  const [notifications, setNotifications] = useState([])
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [notificationsError, setNotificationsError] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const notificationMenuRef = useRef(null)
  const settingsMenuRef = useRef(null)

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
        _id: 'demo-notification-1',
        title: 'Application Updated',
        message: 'Your latest room application is now under review.',
        type: 'application',
        read: false,
        createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      },
      {
        _id: 'demo-notification-2',
        title: 'Document Review',
        message: 'Passport photo has been verified successfully.',
        type: 'document',
        read: false,
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      },
      {
        _id: 'demo-notification-3',
        title: 'Support Reply Received',
        message: 'Dorm admin responded to your support ticket.',
        type: 'support',
        read: true,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
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
    setShowSettings(false)
    setShowNotifications((current) => {
      const nextOpen = !current
      if (nextOpen) {
        void refreshNotifications()
      }
      return nextOpen
    })
  }

  const handleSettingsToggle = () => {
    setShowNotifications(false)
    setShowSettings((current) => !current)
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

  const goToProfile = () => {
    setShowSettings(false)
    navigate('/student/profile')
  }

  const signOutFromMenu = () => {
    setShowSettings(false)
    logout()
    navigate('/login', { replace: true })
  }

  useEffect(() => {
    function handleOutsideClick(event) {
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target)) {
        setShowNotifications(false)
      }

      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target)) {
        setShowSettings(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [])

  return (
    <header className="fixed left-[250px] right-0 top-0 z-30 border-b border-[#ece8e6] bg-[#fcf9f8]/90 px-8 py-4 backdrop-blur">
      <div className="flex items-center justify-between gap-6">
        <div className="fade-in w-full max-w-[410px] rounded-full bg-[#f4f1f0] px-5 py-3.5 text-[#9096a1] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-3">
            <Icon name="search" className="text-[17px] text-[#8f96a3]" />
            <input className="w-full border-none bg-transparent outline-none placeholder:text-[#9198a5]" placeholder={placeholder} />
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div data-no-translate="true" className="hidden items-center gap-2 text-xs font-bold tracking-widest text-secondary md:flex">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`transition hover:text-[#0c56d0] ${language === 'en' ? 'text-[#0c56d0]' : ''}`}
            >
              EN
            </button>
            <span>|</span>
            <button
              type="button"
              onClick={() => setLanguage('bn')}
              className={`transition hover:text-[#0c56d0] ${language === 'bn' ? 'text-[#0c56d0]' : ''}`}
            >
              BN
            </button>
          </div>

          <div className="relative" ref={notificationMenuRef}>
            <button type="button" onClick={handleNotificationToggle} className="relative text-[#626b77]">
              <Icon name="notifications" className="text-[20px]" />
              {unreadCount > 0 ? <span className="pulse-dot absolute -right-1 top-0 h-2 w-2 rounded-full bg-[#e11d48]" /> : null}
            </button>

            {showNotifications ? (
              <div className="absolute right-0 top-11 z-50 w-[360px] rounded-2xl bg-white p-4 shadow-[0_20px_40px_rgba(0,0,0,0.15)] ring-1 ring-[#efebea]">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-extrabold tracking-[-0.03em]">Notifications</p>
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    disabled={unreadCount === 0}
                    className="text-xs font-bold text-[#0c56d0] disabled:cursor-not-allowed disabled:opacity-40"
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
                            {!notification.read ? <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#0c56d0]" /> : null}
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

          <div className="relative" ref={settingsMenuRef}>
            <button type="button" onClick={handleSettingsToggle} className="text-[#626b77]">
              <Icon name="settings" className="text-[20px]" />
            </button>

            {showSettings ? (
              <div className="absolute right-0 top-11 z-50 w-48 rounded-2xl bg-white p-2 shadow-[0_20px_40px_rgba(0,0,0,0.15)] ring-1 ring-[#efebea]">
                <button
                  type="button"
                  onClick={goToProfile}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-[#2d3748] transition hover:bg-[#f7f4f3]"
                >
                  <Icon name="edit" className="text-[18px]" />
                  Edit Profile
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

          <button
            type="button"
            onClick={goToProfile}
            className="rounded-full transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#0c56d0] focus:ring-offset-2"
            aria-label="Go to profile"
            title="Go to profile"
          >
            <Avatar
              src={user?.profileImage || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80'}
              className="h-11 w-11 ring-2 ring-white"
            />
          </button>
        </div>
      </div>
    </header>
  )
}

function PageFrame({ children, placeholder }) {
  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b]">
      <Topbar placeholder={placeholder} />
      <main className="ml-[250px] px-10 pb-10 pt-[102px]">{children}</main>
    </div>
  )
}

function StatBox({ icon, label, value, chip, chipClass = 'bg-[#dceaf3] text-[#46606d]' }) {
  return (
    <div className="card-hover rounded-[28px] bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] ring-1 ring-[#eeebea]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef3f7] text-[#3e5663]">
          <Icon name={icon} className="text-[20px]" />
        </div>
        <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${chipClass}`}>{chip}</span>
      </div>
      <p className="mt-5 text-[13px] uppercase tracking-[0.18em] text-[#6b7280]">{label}</p>
      <h3 className="mt-1 text-[18px] font-extrabold tracking-[-0.04em]">{value}</h3>
    </div>
  )
}

function DashboardPage({ setActivePage }) {
  const { token, user } = useAuth()
  const isDemoUser = token === 'dormdoor_demo_token'
  const [overview, setOverview] = useState(null)
  const [profile, setProfile] = useState(() => mapUserToProfileForm(user || {}))
  const [documents, setDocuments] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    async function loadDashboard() {
      setLoading(true)
      setError('')

      try {
        if (isDemoUser) {
          const demoProfile = mapUserToProfileForm(user || {})
          const demoOverview = {
            applications: 2,
            documents: 2,
            maintenanceTickets: 1,
            supportTickets: 1,
            reviews: 1,
            unreadNotifications: 2,
            recentApplications: [
              {
                _id: 'demo-app-1',
                dorm: { name: 'The Zenith Suite', block: 'Block A' },
                room: { roomNumber: '402-A', type: 'Premium Studio' },
                status: 'Under Review',
                createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
              },
            ],
          }
          const demoDocuments = [
            {
              _id: 'demo-doc-1',
              category: 'Student ID',
              fileName: 'student-id-card.pdf',
              status: 'Verified',
              updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              _id: 'demo-doc-2',
              category: 'Passport Photo',
              fileName: 'passport-photo.jpg',
              status: 'Pending',
              updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            },
          ]
          const demoNotifications = [
            {
              _id: 'demo-notification-1',
              title: 'Application Updated',
              message: 'Your latest room application is now under review.',
              createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            },
            {
              _id: 'demo-notification-2',
              title: 'Document Review',
              message: 'Passport photo has been verified successfully.',
              createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
            },
          ]

          if (!mounted) return
          setProfile(demoProfile)
          setOverview(demoOverview)
          setDocuments(demoDocuments)
          setNotifications(demoNotifications)
          return
        }

        const [{ data: overviewData }, { data: profileData }, { data: documentData }, { data: notificationData }] =
          await Promise.all([
            api.get('/dashboard/student'),
            api.get('/profile'),
            api.get('/documents'),
            api.get('/notifications'),
          ])

        if (!mounted) return
        setOverview(overviewData.overview || null)
        setProfile(mapUserToProfileForm(profileData.user || {}))
        setDocuments(documentData.documents || [])
        setNotifications((notificationData.notifications || []).slice(0, 4))
      } catch (requestError) {
        if (!mounted) return
        setError(requestError.response?.data?.message || 'Failed to load dashboard data')
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadDashboard()
    return () => {
      mounted = false
    }
  }, [isDemoUser, token, user])

  const recentApplication = overview?.recentApplications?.[0] || null
  const applicationStatus = recentApplication?.status || 'No application yet'
  const applicationDormName = recentApplication?.dorm?.name || 'No dorm selected'
  const applicationBlock = recentApplication?.dorm?.block || 'No block yet'
  const roomType = recentApplication?.room?.type || 'Room pending'
  const submittedDate = recentApplication?.createdAt
    ? new Date(recentApplication.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Submit your first application to begin'

  const requiredDocuments = [
    'Student ID',
    'Passport Photo',
    'Admission Certificate',
  ].map((category) => {
    const matchingDocument = documents.find((item) => item.category === category)
    return {
      key: category,
      title: category,
      item: matchingDocument || null,
      done: matchingDocument ? matchingDocument.status === 'Verified' : false,
    }
  })

  const verifiedDocumentCount = requiredDocuments.filter((item) => item.done).length
  const pendingDocumentCount = requiredDocuments.filter((item) => !item.item || item.item.status !== 'Verified').length

  const recentActivity = []
  if (recentApplication) {
    recentActivity.push({
      key: `application-${recentApplication._id}`,
      title: `Application ${recentApplication.status?.toLowerCase() || 'created'}`,
      time: recentApplication.createdAt,
    })
  }
  notifications.slice(0, 2).forEach((notification) => {
    recentActivity.push({
      key: `notification-${notification._id}`,
      title: notification.title,
      time: notification.createdAt,
    })
  })

  const formatShortDate = (value) => {
    if (!value) return 'Recently'
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return 'Recently'
    return parsed.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <PageFrame placeholder="Search resources...">
      {error ? <p className="mb-6 rounded-xl bg-[#ffe9ec] px-4 py-3 text-sm font-semibold text-[#c73535]">{error}</p> : null}

      <div className="grid grid-cols-4 gap-5">
        <StatBox
          icon="inventory_2"
          label="Application"
          value={loading ? 'Loading...' : applicationStatus}
          chip={`${overview?.applications ?? 0} Total`}
          chipClass="bg-[#eef0ff] text-[#4a5fd2]"
        />
        <StatBox
          icon="apartment"
          label="Dorm"
          value={loading ? 'Loading...' : applicationDormName}
          chip={applicationBlock}
        />
        <StatBox
          icon="description"
          label="Documents"
          value={loading ? 'Loading...' : `${verifiedDocumentCount}/3 Verified`}
          chip={pendingDocumentCount > 0 ? `${pendingDocumentCount} Pending` : 'Complete'}
        />
        <StatBox
          icon="notifications_active"
          label="Alerts"
          value={loading ? 'Loading...' : `${overview?.unreadNotifications ?? 0} Unread`}
          chip={notifications[0]?.title || 'Up to date'}
          chipClass="bg-[#ffe8e8] text-[#c93131]"
        />
      </div>

      <div className="mt-8 grid grid-cols-[1.8fr_0.9fr] gap-8">
        <div>
          <section className="fade-in rounded-[28px] bg-[#0c56d0] p-8 text-white shadow-[0_20px_40px_rgba(12,86,208,0.18)]">
            <div className="grid grid-cols-[1.5fr_0.9fr] gap-8">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.25em] text-white/70">Current Application</p>
                <h2 className="mt-4 text-[44px] font-extrabold leading-[1.02] tracking-[-0.06em]">{loading ? 'Loading...' : applicationDormName}</h2>
                <div className="mt-4 flex gap-3 text-[12px] font-bold uppercase tracking-[0.12em]">
                  <span className="rounded-full bg-white/15 px-4 py-2">{applicationBlock}</span>
                  <span className="rounded-full bg-white/15 px-4 py-2">{roomType}</span>
                </div>
                <div className="mt-8 flex items-center gap-5">
                  <div className="rounded-2xl bg-white/15 px-5 py-3 text-[24px] font-bold tracking-[-0.04em]">{applicationStatus}</div>
                  <p className="text-[14px] text-white/75">{submittedDate}</p>
                </div>
              </div>

              <div className="rounded-[24px] bg-white/10 p-6 ring-1 ring-white/12">
                <p className="text-[12px] font-bold uppercase tracking-[0.22em] text-white/75">Assigned Room</p>
                <div className="mt-4 rounded-[22px] border border-dashed border-white/20 px-4 py-10 text-center text-white/65">
                  <Icon name="meeting_room" className="text-[36px]" />
                  <p className="mt-4 text-[14px]">{recentApplication?.room?.roomNumber || 'Pending assignment'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePage('applications')}
                  className="mt-5 w-full rounded-2xl bg-white py-3.5 font-bold text-[#0c56d0]"
                >
                  View Timeline
                </button>
              </div>
            </div>
          </section>

          <section className="mt-8 rounded-[28px] bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] ring-1 ring-[#eeebea]">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-[17px] font-extrabold tracking-[-0.04em]">Required Documents</h3>
              <button
                type="button"
                onClick={() => setActivePage('documents')}
                className="rounded-full bg-[#f1efee] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#6b7280] transition hover:bg-[#e8e2df]"
              >
                Open Documents
              </button>
            </div>
            <div className="space-y-4">
              {requiredDocuments.map(({ key, title, item, done }) => (
                <div key={key} className={`flex items-center gap-4 rounded-[22px] px-5 py-5 ${done ? 'bg-[#fbfbfb]' : 'bg-[#fff4f4]'}`}>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${done ? 'bg-[#eef3ff] text-[#0c56d0]' : 'bg-[#ffe6e6] text-[#d33434]'}`}>
                    <Icon name={done ? 'badge' : 'description'} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[14px] font-bold">{title}</p>
                    <p className={`text-[13px] ${done ? 'text-[#7b818c]' : 'text-[#c73535]'}`}>
                      {item ? `${item.status || 'Pending'} • ${item.fileName}` : 'Missing digital copy'}
                    </p>
                  </div>
                  {done ? (
                    <span className="rounded-full bg-[#eef5ff] px-4 py-2 text-[12px] font-bold text-[#0c56d0]">Verified</span>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="text-[13px] font-bold text-[#d33434]">PENDING</span>
                      <button type="button" onClick={() => setActivePage('documents')} className="rounded-full bg-[#0c56d0] px-5 py-2 text-[13px] font-bold text-white">Upload</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="card-hover rounded-[28px] bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] ring-1 ring-[#eeebea]">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-[17px] font-extrabold tracking-[-0.04em]">Student Profile</h3>
              <button type="button" onClick={() => setActivePage('profile')} className="text-[12px] font-bold text-[#0c56d0]">EDIT</button>
            </div>
            <div className="text-center">
              <Avatar
                src={user?.profileImage || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80'}
                className="mx-auto h-24 w-24 ring-4 ring-[#f0edec]"
              />
              <h4 className="mt-4 text-[17px] font-extrabold tracking-[-0.04em]">{profile.name || user?.name || 'New Student'}</h4>
              <p className="mt-1 text-[13px] font-semibold text-[#0c56d0]">ID: {profile.studentId || 'Not assigned yet'}</p>
            </div>
            <div className="mt-6 space-y-3 border-t border-[#efebea] pt-5 text-[13px]">
              <div className="flex justify-between"><span className="text-[#7b818c]">Department</span><span className="font-semibold">{profile.department || 'Add in profile'}</span></div>
              <div className="flex justify-between"><span className="text-[#7b818c]">Phone</span><span className="font-semibold">{profile.phone || 'Add in profile'}</span></div>
              <div className="flex justify-between"><span className="text-[#7b818c]">Email</span><span className="font-semibold">{profile.email || user?.email || 'No email'}</span></div>
            </div>
          </section>

          <section className="card-hover rounded-[28px] bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] ring-1 ring-[#eeebea]">
            <h3 className="text-[17px] font-extrabold tracking-[-0.04em]">Recent Activity</h3>
            <div className="mt-5 space-y-5 text-[13px]">
              {recentActivity.length === 0 ? (
                <div className="flex gap-4">
                  <span className="mt-2 h-2.5 w-2.5 rounded-full bg-[#9ca3af]" />
                  <div>
                    <p className="font-bold">No recent activity yet</p>
                    <p className="text-[#7b818c]">Create your first application or upload documents to get started.</p>
                  </div>
                </div>
              ) : (
                recentActivity.map((item, index) => (
                  <div key={item.key} className="flex gap-4">
                    <span className={`mt-2 h-2.5 w-2.5 rounded-full ${index === 0 ? 'bg-[#0c56d0]' : 'bg-[#9ca3af]'}`} />
                    <div>
                      <p className="font-bold">{item.title}</p>
                      <p className="text-[#7b818c]">{formatShortDate(item.time)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[28px] bg-[#274b5a] p-6 text-white shadow-[0_12px_24px_rgba(39,75,90,0.18)]">
            <h3 className="text-[17px] font-extrabold tracking-[-0.04em]">Need Support?</h3>
            <p className="mt-3 text-[13px] leading-6 text-white/75">Our team is available 24/7 for any housing assistance.</p>
            <button type="button" onClick={() => setActivePage('support')} className="mt-5 w-full rounded-2xl bg-white py-3.5 font-bold text-[#274b5a]">Chat Support</button>
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-[12px] font-semibold text-white/80">
              <Icon name="schedule" className="text-[16px]" />
              <span>Typical response time: under 30 minutes</span>
            </div>
          </section>
        </div>
      </div>

      <p className="mt-10 text-center text-[11px] uppercase tracking-[0.35em] text-[#7a8088]">© 2024 Dorm Door Student Housing</p>
    </PageFrame>
  )
}

function RoomApplicationsPage() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const [applications, setApplications] = useState([])
  const [expandedApplicationId, setExpandedApplicationId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const isDemoUser = token === 'dormdoor_demo_token'
  const demoStorageKey = 'dormdoor_demo_student_applications'

  const parseDemoApplications = (raw) => {
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : null
    } catch {
      return null
    }
  }

  useEffect(() => {
    async function fetchApplications() {
      setLoading(true)
      setError('')

      if (isDemoUser) {
        const stored = parseDemoApplications(localStorage.getItem(demoStorageKey))
        if (stored) {
          setApplications(stored)
          setLoading(false)
          return
        }

        const seed = [
          {
            _id: 'demo-app-1',
            dorm: { name: 'The Zenith Suite', block: 'Block A' },
            room: { roomNumber: '402-A', type: 'Premium Studio' },
            status: 'Under Review',
            createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            preferences: { moveInDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString() },
          },
          {
            _id: 'demo-app-2',
            dorm: { name: 'Scholar Haven', block: 'Block B' },
            room: { roomNumber: '205-C', type: 'Single Room' },
            status: 'Approved',
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            preferences: { moveInDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
          },
        ]

        localStorage.setItem(demoStorageKey, JSON.stringify(seed))
        setApplications(seed)
        setLoading(false)
        return
      }

      try {
        const { data } = await api.get('/applications')
        setApplications(data.applications || [])
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Failed to load applications')
      } finally {
        setLoading(false)
      }
    }

    fetchApplications()
  }, [isDemoUser, token])

  const activeApplications = useMemo(() => {
    const statuses = new Set(['Pending', 'Under Review', 'Re-upload Requested'])
    return applications.filter((item) => statuses.has(item.status))
  }, [applications])

  const historicalApplications = useMemo(() => {
    const statuses = new Set(['Approved', 'Rejected'])
    return applications.filter((item) => statuses.has(item.status))
  }, [applications])

  const nextMoveIn = useMemo(() => {
    const upcoming = applications
      .map((item) => item.preferences?.moveInDate)
      .filter(Boolean)
      .map((date) => new Date(date))
      .filter((date) => !Number.isNaN(date.getTime()) && date.getTime() >= Date.now())
      .sort((a, b) => a.getTime() - b.getTime())

    return upcoming[0] || null
  }, [applications])

  const pendingCount = useMemo(
    () => applications.filter((item) => item.status === 'Pending' || item.status === 'Under Review').length,
    [applications],
  )

  const createDemoApplication = () => {
    const createdAt = new Date()
    const newItem = {
      _id: `demo-app-${createdAt.getTime()}`,
      dorm: { name: 'New Demo Dorm', block: 'Block C' },
      room: { roomNumber: 'TBD', type: 'Single Room' },
      status: 'Pending',
      createdAt: createdAt.toISOString(),
      preferences: {},
    }

    const next = [newItem, ...applications]
    setApplications(next)
    localStorage.setItem(demoStorageKey, JSON.stringify(next))
  }

  const handleNewApplication = () => {
    if (isDemoUser) {
      createDemoApplication()
      return
    }
    navigate('/apply-now')
  }

  const statusClasses = (status) => {
    if (status === 'Pending') return 'bg-[#fff2de] text-[#b7791f]'
    if (status === 'Under Review' || status === 'Re-upload Requested') return 'bg-[#e8f0f7] text-[#4e6875]'
    if (status === 'Approved') return 'bg-[#ecf7ef] text-[#23945b]'
    return 'bg-[#feecef] text-[#d33434]'
  }

  const formatDate = (value) => {
    if (!value) return 'Not available'
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return 'Not available'
    return parsed.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    })
  }

  const formatDateTime = (value) => {
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

  const Row = ({ item, faded = false }) => {
    const dormName = item.dorm?.name || 'Dorm not assigned'
    const roomType = item.room?.type || item.preferences?.preferredRoomType || 'Not specified'
    const statusText = item.status || 'Pending'
    const block = item.dorm?.block ? ` - ${item.dorm.block}` : ''
    const isExpanded = expandedApplicationId === item._id

    return (
      <div className={`space-y-3 ${faded ? 'opacity-65' : ''}`}>
        <div
          className={`grid grid-cols-[110px_1.2fr_1fr_1fr_180px_56px] items-center gap-6 rounded-[26px] bg-white px-6 py-6 ring-1 ring-[#efebea] transition ${
            isExpanded ? 'ring-[#cdd9e6] shadow-[0_8px_22px_rgba(0,0,0,0.05)]' : ''
          }`}
        >
          <img src="https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=300&q=80" alt={dormName} className="h-24 w-24 rounded-2xl object-cover" />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7b818c]">Dorm Name</p>
            <p className="mt-2 text-[15px] font-extrabold tracking-[-0.03em]">{dormName}{block}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7b818c]">Room Type</p>
            <p className="mt-2 text-[14px]">{roomType}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7b818c]">Submitted</p>
            <p className="mt-2 text-[14px]">{formatDate(item.createdAt)}</p>
          </div>
          <div>
            <span className={`inline-flex rounded-full px-4 py-2 text-[13px] font-bold ${statusClasses(statusText)}`}>
              {statusText}
            </span>
          </div>
          <button
            type="button"
            aria-label={isExpanded ? 'Hide request details' : 'Show request details'}
            aria-expanded={isExpanded}
            onClick={() => setExpandedApplicationId((current) => (current === item._id ? null : item._id))}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f5f2f1] text-[#333] transition hover:bg-[#ebe6e4]"
          >
            <span className={`transition ${isExpanded ? 'rotate-90' : ''}`}>
              <Icon name="chevron_right" />
            </span>
          </button>
        </div>

        {isExpanded ? (
          <div className="rounded-[22px] border border-[#e6e1df] bg-[#fdfcfc] p-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7b818c]">Application</p>
                <div className="mt-3 space-y-2 text-[14px]">
                  <p><span className="font-bold">Request ID:</span> {item._id ? String(item._id).slice(-8).toUpperCase() : 'Not available'}</p>
                  <p><span className="font-bold">Room Number:</span> {item.room?.roomNumber || 'To be assigned'}</p>
                  <p><span className="font-bold">Monthly Fee:</span> {item.room?.priceMonthly ? `BDT ${item.room.priceMonthly}` : 'Not available'}</p>
                  <p><span className="font-bold">Move-In Preference:</span> {formatDate(item.preferences?.moveInDate)}</p>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7b818c]">Applicant Info</p>
                <div className="mt-3 space-y-2 text-[14px]">
                  <p><span className="font-bold">Name:</span> {item.personalInfo?.fullName || 'Not provided'}</p>
                  <p><span className="font-bold">Email:</span> {item.personalInfo?.email || 'Not provided'}</p>
                  <p><span className="font-bold">Phone:</span> {item.personalInfo?.phone || 'Not provided'}</p>
                  <p><span className="font-bold">Department:</span> {item.personalInfo?.department || 'Not provided'}</p>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7b818c]">Preferences & Notes</p>
                <div className="mt-3 space-y-2 text-[14px]">
                  <p><span className="font-bold">Block Preference:</span> {item.preferences?.blockPreference || 'Not set'}</p>
                  <p><span className="font-bold">Special Request:</span> {item.preferences?.specialRequests || 'None'}</p>
                  <p><span className="font-bold">Emergency Contact:</span> {item.emergencyContact?.name || 'Not provided'} ({item.emergencyContact?.phone || 'N/A'})</p>
                  <p><span className="font-bold">Admin Note:</span> {item.adminNote || 'No admin note yet.'}</p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-[#ece7e4] pt-5 text-[13px] text-[#5e6772]">
              <span className="rounded-full bg-white px-3 py-1 ring-1 ring-[#ece7e4]">Submitted: {formatDateTime(item.createdAt)}</span>
              <span className="rounded-full bg-white px-3 py-1 ring-1 ring-[#ece7e4]">Last Update: {formatDateTime(item.updatedAt || item.createdAt)}</span>
              {statusText === 'Re-upload Requested' ? (
                <button
                  type="button"
                  onClick={() => navigate('/student/documents')}
                  className="rounded-full bg-[#0c56d0] px-4 py-2 font-bold text-white"
                >
                  Upload Updated Documents
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <PageFrame placeholder="Search applications...">
      <div className="flex items-start justify-between gap-8">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-[0.28em] text-[#6b7280]">Housing Portal</p>
          <h1 className="mt-3 text-[48px] font-extrabold leading-none tracking-[-0.06em]">Room Applications</h1>
          <p className="mt-4 max-w-[760px] text-[16px] leading-8 text-[#546067]">
            Track your submitted applications, monitor status updates, and start a new request.
          </p>
        </div>
        <button type="button" onClick={handleNewApplication} className="interactive mt-6 rounded-[22px] bg-[#0c56d0] px-8 py-5 text-[16px] font-bold text-white shadow-[0_14px_24px_rgba(12,86,208,0.16)]">
          + New Application
        </button>
      </div>

      {isDemoUser ? (
        <p className="mt-6 rounded-xl bg-[#eef3ff] px-4 py-3 text-sm font-semibold text-[#325ca8]">
          Demo mode: new applications are stored locally in this browser.
        </p>
      ) : null}

      <div className="mt-10 grid grid-cols-[260px_260px_1fr] gap-6">
        <div className="card-hover rounded-[28px] bg-white p-6 ring-1 ring-[#efebea]">
          <p className="text-[13px] uppercase tracking-[0.2em] text-[#6b7280]">Total Active</p>
          <h3 className="mt-5 text-[52px] font-extrabold leading-none text-[#0c56d0]">{activeApplications.length}</h3>
        </div>
        <div className="card-hover rounded-[28px] bg-white p-6 ring-1 ring-[#efebea]">
          <p className="text-[13px] uppercase tracking-[0.2em] text-[#6b7280]">Pending Review</p>
          <h3 className="mt-5 text-[52px] font-extrabold leading-none text-[#b7791f]">{pendingCount}</h3>
        </div>
        <div className="card-hover rounded-[28px] bg-white p-6 ring-1 ring-[#efebea]">
          <p className="text-[13px] uppercase tracking-[0.2em] text-[#6b7280]">Next Move-In Date</p>
          <h3 className="mt-5 text-[30px] font-extrabold tracking-[-0.04em]">
            {nextMoveIn ? nextMoveIn.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Not set'}
          </h3>
          <p className="mt-2 text-[16px] text-[#546067]">Based on your submitted preferences</p>
        </div>
      </div>

      {loading ? (
        <p className="mt-10 text-[16px] font-semibold text-[#546067]">Loading applications...</p>
      ) : null}

      {error ? (
        <p className="mt-6 rounded-xl bg-[#ffe9ec] px-4 py-3 text-sm font-semibold text-[#c73535]">{error}</p>
      ) : null}

      {!loading && !error ? (
        <>
          <section className="mt-12">
            <div className="mb-6 flex items-center gap-5">
              <h2 className="text-[18px] font-extrabold tracking-[-0.04em]">Active Inquiries</h2>
              <div className="h-px flex-1 bg-[#e7e2df]" />
            </div>

            {activeApplications.length === 0 ? (
              <div className="rounded-[24px] bg-white px-6 py-8 text-[15px] text-[#546067] ring-1 ring-[#efebea]">
                No active applications found.
              </div>
            ) : (
              <div className="space-y-5">{activeApplications.map((item) => <Row key={item._id} item={item} />)}</div>
            )}
          </section>

          <section className="mt-12">
            <div className="mb-6 flex items-center gap-5">
              <h2 className="text-[18px] font-extrabold tracking-[-0.04em]">Historical Records</h2>
              <div className="h-px flex-1 bg-[#e7e2df]" />
            </div>

            {historicalApplications.length === 0 ? (
              <div className="rounded-[24px] bg-white px-6 py-8 text-[15px] text-[#546067] ring-1 ring-[#efebea]">
                No historical applications yet.
              </div>
            ) : (
              <div className="space-y-5">{historicalApplications.map((item) => <Row key={item._id} item={item} faded />)}</div>
            )}
          </section>
        </>
      ) : null}
    </PageFrame>
  )
}

function MaintenancePage() {
  const { token } = useAuth()
  const isDemoUser = token === 'dormdoor_demo_token'
  const demoStorageKey = 'dormdoor_demo_student_maintenance'

  const initialForm = {
    title: '',
    description: '',
    priority: 'Medium',
  }

  const [tickets, setTickets] = useState([])
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const parseDemoTickets = () => {
    try {
      const raw = localStorage.getItem(demoStorageKey)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : null
    } catch {
      return null
    }
  }

  const fetchTickets = async () => {
    setLoading(true)
    setError('')

    try {
      if (isDemoUser) {
        const stored = parseDemoTickets()
        if (stored) {
          setTickets(stored)
          return
        }

        const seed = [
          {
            _id: 'demo-maint-1',
            title: 'Bathroom Sink Clog',
            description: 'Water drains slowly in the ensuite bathroom sink.',
            priority: 'High',
            status: 'Pending',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            _id: 'demo-maint-2',
            title: 'Flickering Desk Lamp',
            description: 'Desk lamp flickers intermittently at night.',
            priority: 'Medium',
            status: 'Scheduled',
            createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            _id: 'demo-maint-3',
            title: 'Loose Desk Drawer',
            description: 'Right drawer rail needs alignment.',
            priority: 'Low',
            status: 'Resolved',
            createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ]

        localStorage.setItem(demoStorageKey, JSON.stringify(seed))
        setTickets(seed)
        return
      }

      const { data } = await api.get('/maintenance')
      setTickets(data.tickets || [])
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to load maintenance tickets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [isDemoUser, token])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.title.trim() || !form.description.trim()) {
      setError('Title and description are required.')
      return
    }

    setSaving(true)
    setMessage('')
    setError('')

    try {
      if (isDemoUser) {
        const created = {
          _id: `demo-maint-${Date.now()}`,
          title: form.title.trim(),
          description: form.description.trim(),
          priority: form.priority,
          status: 'Pending',
          createdAt: new Date().toISOString(),
        }

        const next = [created, ...tickets]
        setTickets(next)
        localStorage.setItem(demoStorageKey, JSON.stringify(next))
      } else {
        await api.post('/maintenance', {
          title: form.title.trim(),
          description: form.description.trim(),
          priority: form.priority,
        })
        await fetchTickets()
      }

      setForm(initialForm)
      setMessage('Maintenance request submitted successfully.')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to submit maintenance request')
    } finally {
      setSaving(false)
    }
  }

  const statusCounts = useMemo(() => {
    return {
      pending: tickets.filter((item) => item.status === 'Pending').length,
      scheduled: tickets.filter((item) => item.status === 'Scheduled').length,
      resolved: tickets.filter((item) => item.status === 'Resolved').length,
    }
  }, [tickets])

  const formatDate = (value) => {
    if (!value) return 'N/A'
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return 'N/A'
    return parsed.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
  }

  const statusClass = (status) => {
    if (status === 'Pending') return 'bg-[#fff2de] text-[#b7791f]'
    if (status === 'Scheduled') return 'bg-[#e9f0ff] text-[#4775d6]'
    if (status === 'Resolved') return 'bg-[#ecf7ef] text-[#23945b]'
    return 'bg-[#eef1f4] text-[#5f6772]'
  }

  return (
    <PageFrame placeholder="Search maintenance requests...">
      <div className="flex items-start justify-between gap-8">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-[0.28em] text-[#6b7280]">Service Center</p>
          <h1 className="mt-3 text-[44px] font-extrabold leading-none tracking-[-0.06em]">Maintenance Requests</h1>
          <p className="mt-4 max-w-[850px] text-[16px] leading-8 text-[#546067]">
            Report room issues and track status updates from the housing maintenance team.
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-[24px] bg-white p-6 ring-1 ring-[#efebea]">
          <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#6b7280]">Pending</p>
          <p className="mt-3 text-[34px] font-extrabold tracking-[-0.05em]">{statusCounts.pending}</p>
        </div>
        <div className="rounded-[24px] bg-white p-6 ring-1 ring-[#efebea]">
          <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#6b7280]">Scheduled</p>
          <p className="mt-3 text-[34px] font-extrabold tracking-[-0.05em]">{statusCounts.scheduled}</p>
        </div>
        <div className="rounded-[24px] bg-white p-6 ring-1 ring-[#efebea]">
          <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#6b7280]">Resolved</p>
          <p className="mt-3 text-[34px] font-extrabold tracking-[-0.05em]">{statusCounts.resolved}</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[1fr_1.4fr]">
        <section className="rounded-[28px] bg-white p-8 ring-1 ring-[#efebea]">
          <h2 className="text-[24px] font-extrabold tracking-[-0.04em]">Report New Issue</h2>
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">
              Title
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border-none bg-[#f1ecea] px-4 py-3 text-sm"
                required
              />
            </label>

            <label className="block text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">
              Description
              <textarea
                name="description"
                rows="4"
                value={form.description}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border-none bg-[#f1ecea] px-4 py-3 text-sm"
                required
              />
            </label>

            <label className="block text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">
              Priority
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border-none bg-[#f1ecea] px-4 py-3 text-sm"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </label>

            <button
              type="submit"
              disabled={saving}
              className="rounded-[18px] bg-[#0c56d0] px-7 py-3 text-[15px] font-bold text-white disabled:opacity-70"
            >
              {saving ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>

          {message ? <p className="mt-4 rounded-lg bg-[#ecf7ef] px-4 py-3 text-sm font-semibold text-[#23945b]">{message}</p> : null}
          {error ? <p className="mt-4 rounded-lg bg-[#ffe9ec] px-4 py-3 text-sm font-semibold text-[#c73535]">{error}</p> : null}
        </section>

        <section className="rounded-[28px] bg-white p-8 ring-1 ring-[#efebea]">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-[24px] font-extrabold tracking-[-0.04em]">My Tickets</h2>
            {loading ? <span className="text-sm text-[#6b7280]">Loading...</span> : null}
          </div>

          {!loading && tickets.length === 0 ? (
            <p className="rounded-xl bg-[#f7f4f3] px-4 py-4 text-sm text-[#546067]">No maintenance tickets yet.</p>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div key={ticket._id} className="rounded-[20px] bg-[#f7f4f3] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[16px] font-bold">{ticket.title}</p>
                      <p className="mt-1 text-[13px] text-[#6b7280]">{ticket.description}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[12px] font-bold ${statusClass(ticket.status)}`}>
                      {ticket.status}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3 text-[12px] font-semibold text-[#6b7280]">
                    <span>Priority: {ticket.priority || 'Medium'}</span>
                    <span className="h-1 w-1 rounded-full bg-[#9aa3ae]" />
                    <span>Created: {formatDate(ticket.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </PageFrame>
  )
}

function DocumentsPage() {
  const { token } = useAuth()
  const isDemoUser = token === 'dormdoor_demo_token'
  const demoStorageKey = 'dormdoor_demo_student_documents'

  const initialForm = {
    category: 'Student ID',
    fileName: '',
    fileUrl: '',
  }

  const [documents, setDocuments] = useState([])
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const parseDemoDocuments = () => {
    try {
      const raw = localStorage.getItem(demoStorageKey)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : null
    } catch {
      return null
    }
  }

  const fetchDocuments = async () => {
    setLoading(true)
    setError('')

    try {
      if (isDemoUser) {
        const stored = parseDemoDocuments()
        if (stored) {
          setDocuments(stored)
          return
        }

        const seed = [
          {
            _id: 'demo-doc-1',
            category: 'Student ID',
            fileName: 'student-id-card.pdf',
            fileUrl: 'https://example.com/student-id-card.pdf',
            status: 'Verified',
            updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            _id: 'demo-doc-2',
            category: 'Passport Photo',
            fileName: 'passport-photo.jpg',
            fileUrl: 'https://example.com/passport-photo.jpg',
            status: 'Pending',
            updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ]

        localStorage.setItem(demoStorageKey, JSON.stringify(seed))
        setDocuments(seed)
        return
      }

      const { data } = await api.get('/documents')
      setDocuments(data.documents || [])
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [isDemoUser, token])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.fileName.trim() || !form.fileUrl.trim()) {
      setError('File name and file URL are required.')
      return
    }

    setSaving(true)
    setMessage('')
    setError('')

    try {
      if (isDemoUser) {
        const created = {
          _id: `demo-doc-${Date.now()}`,
          category: form.category,
          fileName: form.fileName.trim(),
          fileUrl: form.fileUrl.trim(),
          status: 'Pending',
          updatedAt: new Date().toISOString(),
        }

        const next = [created, ...documents]
        setDocuments(next)
        localStorage.setItem(demoStorageKey, JSON.stringify(next))
      } else {
        await api.post('/documents', {
          category: form.category,
          fileName: form.fileName.trim(),
          fileUrl: form.fileUrl.trim(),
        })
        await fetchDocuments()
      }

      setForm(initialForm)
      setMessage('Document metadata submitted successfully.')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to submit document')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (value) => {
    if (!value) return 'N/A'
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return 'N/A'
    return parsed.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
  }

  const statusClass = (status) => {
    if (status === 'Verified') return 'bg-[#e9f6ed] text-[#24925e]'
    if (status === 'Rejected' || status === 'Needs Update') return 'bg-[#ffe9ec] text-[#c73535]'
    return 'bg-[#eef0ff] text-[#4a5fd2]'
  }

  return (
    <PageFrame placeholder="Search documents...">
      <p className="text-[12px] font-bold uppercase tracking-[0.28em] text-[#6b7280]">Registry and Verification</p>
      <h1 className="mt-3 text-[44px] font-extrabold leading-none tracking-[-0.06em]">Academic Credentials</h1>
      <p className="mt-4 max-w-[900px] text-[16px] leading-8 text-[#546067]">
        Upload document metadata for verification and track review status.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[1fr_1.4fr]">
        <section className="rounded-[28px] bg-white p-8 ring-1 ring-[#efebea]">
          <h2 className="text-[24px] font-extrabold tracking-[-0.04em]">Add Document</h2>
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">
              Category
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border-none bg-[#f1ecea] px-4 py-3 text-sm"
              >
                <option value="Student ID">Student ID</option>
                <option value="Passport Photo">Passport Photo</option>
                <option value="Admission Certificate">Admission Certificate</option>
                <option value="Health Document">Health Document</option>
                <option value="Other">Other</option>
              </select>
            </label>

            <label className="block text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">
              File Name
              <input
                name="fileName"
                value={form.fileName}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border-none bg-[#f1ecea] px-4 py-3 text-sm"
                required
              />
            </label>

            <label className="block text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">
              File URL
              <input
                name="fileUrl"
                value={form.fileUrl}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border-none bg-[#f1ecea] px-4 py-3 text-sm"
                required
              />
            </label>

            <button
              type="submit"
              disabled={saving}
              className="rounded-[18px] bg-[#0c56d0] px-7 py-3 text-[15px] font-bold text-white disabled:opacity-70"
            >
              {saving ? 'Uploading...' : 'Submit Document'}
            </button>
          </form>

          {message ? <p className="mt-4 rounded-lg bg-[#ecf7ef] px-4 py-3 text-sm font-semibold text-[#23945b]">{message}</p> : null}
          {error ? <p className="mt-4 rounded-lg bg-[#ffe9ec] px-4 py-3 text-sm font-semibold text-[#c73535]">{error}</p> : null}
        </section>

        <section className="rounded-[28px] bg-white p-8 ring-1 ring-[#efebea]">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-[24px] font-extrabold tracking-[-0.04em]">My Documents</h2>
            {loading ? <span className="text-sm text-[#6b7280]">Loading...</span> : null}
          </div>

          {!loading && documents.length === 0 ? (
            <p className="rounded-xl bg-[#f7f4f3] px-4 py-4 text-sm text-[#546067]">No documents uploaded yet.</p>
          ) : (
            <div className="space-y-4">
              {documents.map((item) => (
                <div key={item._id} className="rounded-[20px] bg-[#f7f4f3] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[16px] font-bold">{item.fileName}</p>
                      <p className="mt-1 text-[13px] text-[#6b7280]">{item.category || 'Document'}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[12px] font-bold ${statusClass(item.status)}`}>
                      {item.status || 'Pending'}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3 text-[12px] font-semibold text-[#6b7280]">
                    <a href={item.fileUrl} target="_blank" rel="noreferrer" className="text-[#0c56d0] underline">
                      Open File
                    </a>
                    <span className="h-1 w-1 rounded-full bg-[#9aa3ae]" />
                    <span>Updated: {formatDate(item.updatedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </PageFrame>
  )
}

function ReviewsPage() {
  const { token } = useAuth()
  const [dorms, setDorms] = useState([])
  const [rooms, setRooms] = useState([])
  const [myReviews, setMyReviews] = useState([])
  const [publishedReviews, setPublishedReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    dorm: '',
    room: '',
    overall: 4,
    cleanliness: 4,
    security: 4,
    internet: 4,
    maintenance: 4,
    comment: '',
    anonymous: false,
  })

  const isDemoUser = token === 'dormdoor_demo_token'
  const demoStorageKey = 'dormdoor_demo_student_reviews'

  const parseDemoReviews = (raw) => {
    if (!raw) return []
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  const fetchMyReviews = async () => {
    if (isDemoUser) {
      const parsed = parseDemoReviews(localStorage.getItem(demoStorageKey))
      setMyReviews(parsed)
      return
    }

    const { data } = await api.get('/reviews/mine')
    setMyReviews(data.reviews || [])
  }

  const fetchPublishedReviews = async (dormId = '') => {
    const params = dormId ? { dormId } : {}
    const { data } = await api.get('/reviews', { params })
    setPublishedReviews(data.reviews || [])
  }

  useEffect(() => {
    async function bootstrap() {
      setLoading(true)
      setError('')

      try {
        const [{ data: dormData }] = await Promise.all([api.get('/dorms')])
        const dormList = dormData.dorms || []
        setDorms(dormList)

        await Promise.all([fetchMyReviews(), fetchPublishedReviews()])
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Failed to load review data')
      } finally {
        setLoading(false)
      }
    }

    bootstrap()
  }, [isDemoUser, token])

  useEffect(() => {
    async function loadRooms() {
      if (!form.dorm) {
        setRooms([])
        return
      }

      try {
        const { data } = await api.get('/rooms', { params: { dormId: form.dorm } })
        setRooms(data.rooms || [])
      } catch {
        setRooms([])
      }
    }

    loadRooms()
  }, [form.dorm])

  useEffect(() => {
    fetchPublishedReviews(form.dorm).catch(() => {
      setPublishedReviews([])
    })
  }, [form.dorm])

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.dorm || !form.comment.trim()) {
      setError('Dorm and review comment are required')
      return
    }

    setSubmitting(true)
    setError('')
    setMessage('')

    const payload = {
      dorm: form.dorm,
      room: form.room || undefined,
      rating: {
        overall: Number(form.overall),
        cleanliness: Number(form.cleanliness),
        security: Number(form.security),
        internet: Number(form.internet),
        maintenance: Number(form.maintenance),
      },
      comment: form.comment.trim(),
      anonymous: form.anonymous,
      photos: [],
    }

    try {
      if (isDemoUser) {
        const dormName = dorms.find((dorm) => dorm._id === form.dorm)?.name || 'Demo Dorm'
        const roomName = rooms.find((room) => room._id === form.room)?.roomNumber || 'N/A'
        const created = {
          _id: `demo-review-${Date.now()}`,
          dorm: { name: dormName },
          room: { roomNumber: roomName },
          rating: payload.rating,
          comment: payload.comment,
          anonymous: payload.anonymous,
          status: 'Published',
          createdAt: new Date().toISOString(),
        }

        const next = [created, ...myReviews]
        setMyReviews(next)
        localStorage.setItem(demoStorageKey, JSON.stringify(next))
      } else {
        await api.post('/reviews', payload)
        await Promise.all([fetchMyReviews(), fetchPublishedReviews(form.dorm)])
      }

      setMessage('Review submitted successfully')
      setForm((prev) => ({
        ...prev,
        room: '',
        overall: 4,
        cleanliness: 4,
        security: 4,
        internet: 4,
        maintenance: 4,
        comment: '',
        anonymous: false,
      }))
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  const averageOverall = useMemo(() => {
    if (!publishedReviews.length) return 0
    const total = publishedReviews.reduce((sum, item) => sum + (item.rating?.overall || 0), 0)
    return (total / publishedReviews.length).toFixed(1)
  }, [publishedReviews])

  const renderRatingField = (label, key) => (
    <label className="block text-[13px] font-semibold text-[#546067]">
      {label}
      <input
        type="range"
        min="1"
        max="5"
        step="1"
        name={key}
        value={form[key]}
        onChange={handleChange}
        className="mt-2 w-full accent-[#0c56d0]"
      />
      <span className="text-[12px] text-[#0c56d0]">{form[key]}/5</span>
    </label>
  )

  return (
    <PageFrame placeholder="Search reviews...">
      <p className="text-[12px] font-bold uppercase tracking-[0.28em] text-[#0c56d0]">Residential Feedback</p>
      <h1 className="mt-3 text-[48px] font-extrabold leading-none tracking-[-0.06em]">Share Your Experience</h1>
      <p className="mt-4 max-w-[880px] text-[16px] leading-8 text-[#546067]">
        Submit a room review and help other students make better housing decisions.
      </p>

      {loading ? <p className="mt-8 text-[16px] font-semibold text-[#546067]">Loading review tools...</p> : null}
      {error ? <p className="mt-6 rounded-xl bg-[#ffe9ec] px-4 py-3 text-sm font-semibold text-[#c73535]">{error}</p> : null}
      {message ? <p className="mt-6 rounded-xl bg-[#ecf7ef] px-4 py-3 text-sm font-semibold text-[#23945b]">{message}</p> : null}

      <div className="mt-10 grid grid-cols-[1.1fr_1fr] gap-8">
        <section className="rounded-[28px] bg-white p-8 ring-1 ring-[#efebea]">
          <h3 className="text-[24px] font-extrabold tracking-[-0.04em]">Submit Review</h3>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">
                Dorm
                <select name="dorm" value={form.dorm} onChange={handleChange} className="mt-2 w-full rounded-xl border-none bg-[#f1ecea] px-4 py-3 text-sm" required>
                  <option value="">Select dorm</option>
                  {dorms.map((dorm) => (
                    <option key={dorm._id} value={dorm._id}>{dorm.name}</option>
                  ))}
                </select>
              </label>

              <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">
                Room
                <select name="room" value={form.room} onChange={handleChange} className="mt-2 w-full rounded-xl border-none bg-[#f1ecea] px-4 py-3 text-sm">
                  <option value="">Optional</option>
                  {rooms.map((room) => (
                    <option key={room._id} value={room._id}>{room.roomNumber} - {room.type}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {renderRatingField('Overall', 'overall')}
              {renderRatingField('Cleanliness', 'cleanliness')}
              {renderRatingField('Security', 'security')}
              {renderRatingField('Internet', 'internet')}
              {renderRatingField('Maintenance', 'maintenance')}
            </div>

            <label className="block text-[13px] font-semibold text-[#546067]">
              Comment
              <textarea
                rows="5"
                name="comment"
                value={form.comment}
                onChange={handleChange}
                placeholder="Describe your real experience with this dorm and room"
                className="mt-2 w-full rounded-[18px] bg-[#f4f1f0] p-4 text-[15px] outline-none"
                required
              />
            </label>

            <label className="flex items-center gap-3 text-[15px] text-[#546067]">
              <input type="checkbox" name="anonymous" checked={form.anonymous} onChange={handleChange} className="h-5 w-5" />
              Post review anonymously
            </label>

            <button type="submit" disabled={submitting} className="rounded-[18px] bg-[#0c56d0] px-8 py-3 text-[16px] font-bold text-white disabled:opacity-70">
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </section>

        <div className="space-y-6">
          <section className="rounded-[28px] bg-[#0c56d0] p-6 text-white shadow-[0_12px_24px_rgba(12,86,208,0.18)]">
            <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-white/70">Published Reviews</p>
            <h3 className="mt-4 text-[42px] font-extrabold leading-none">{publishedReviews.length}</h3>
            <p className="mt-2 text-[15px] text-white/85">Average overall rating: {averageOverall || '0.0'}/5</p>
          </section>

          <section className="rounded-[28px] bg-white p-6 ring-1 ring-[#efebea]">
            <h3 className="text-[18px] font-extrabold">My Recent Reviews</h3>
            <div className="mt-4 space-y-4">
              {myReviews.length === 0 ? (
                <p className="text-[14px] text-[#6b7280]">You have not submitted any reviews yet.</p>
              ) : (
                myReviews.slice(0, 5).map((item) => (
                  <div key={item._id} className="rounded-[18px] bg-[#f7f4f3] p-4">
                    <p className="text-[15px] font-bold">{item.dorm?.name || 'Dorm'}</p>
                    <p className="mt-1 text-[13px] text-[#6b7280]">Overall: {item.rating?.overall || '-'} / 5</p>
                    <p className="mt-2 text-[14px] text-[#546067]">{item.comment}</p>
                    <p className="mt-2 text-[12px] font-semibold text-[#7b818c]">{item.status || 'Published'} • {new Date(item.createdAt).toLocaleDateString()}</p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </PageFrame>
  )
}

const PROFILE_TABS = [
  { key: 'personal', label: 'Personal' },
  { key: 'contact', label: 'Contact' },
  { key: 'security', label: 'Security' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'privacy', label: 'Privacy' },
]

const DEMO_PROFILE_STORAGE_KEY = 'dormdoor_demo_student_profile'

function mapUserToProfileForm(profileUser = {}) {
  return {
    name: profileUser.name || '',
    studentId: profileUser.studentId || '',
    email: profileUser.email || '',
    department: profileUser.department || '',
    university: profileUser.university || '',
    phone: profileUser.phone || '',
    address: profileUser.address || '',
    emergencyContact: {
      name: profileUser.emergencyContact?.name || '',
      relation: profileUser.emergencyContact?.relation || '',
      phone: profileUser.emergencyContact?.phone || '',
    },
    settings: {
      emailNotifications: profileUser.settings?.emailNotifications ?? true,
      pushNotifications: profileUser.settings?.pushNotifications ?? true,
      smsNotifications: profileUser.settings?.smsNotifications ?? false,
    },
  }
}

function normalizeProfilePayload(form) {
  return {
    name: String(form.name || '').trim(),
    phone: String(form.phone || '').trim(),
    department: String(form.department || '').trim(),
    university: String(form.university || '').trim(),
    address: String(form.address || '').trim(),
    emergencyContact: {
      name: String(form.emergencyContact?.name || '').trim(),
      relation: String(form.emergencyContact?.relation || '').trim(),
      phone: String(form.emergencyContact?.phone || '').trim(),
    },
    settings: {
      emailNotifications: Boolean(form.settings?.emailNotifications),
      pushNotifications: Boolean(form.settings?.pushNotifications),
      smsNotifications: Boolean(form.settings?.smsNotifications),
    },
    studentId: String(form.studentId || '').trim(),
    email: String(form.email || '').trim(),
  }
}

function cacheAuthUserProfile(form) {
  const raw = localStorage.getItem('dormdoor_user')
  if (!raw) return

  try {
    const parsed = JSON.parse(raw)
    const next = {
      ...parsed,
      name: form.name,
      studentId: form.studentId || parsed.studentId,
      email: form.email || parsed.email,
      phone: form.phone,
      department: form.department,
      university: form.university,
      address: form.address,
      emergencyContact: form.emergencyContact,
      settings: form.settings,
    }
    localStorage.setItem('dormdoor_user', JSON.stringify(next))
  } catch {
    // Ignore malformed local cache and keep runtime state stable.
  }
}

function ProfilePage() {
  const { token, user } = useAuth()
  const isDemoUser = token === 'dormdoor_demo_token'
  const [activeTab, setActiveTab] = useState('personal')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(() => mapUserToProfileForm(user || {}))
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')

  useEffect(() => {
    let mounted = true

    async function loadProfile() {
      setLoading(true)
      setError('')

      if (!token) {
        if (mounted) {
          setForm(mapUserToProfileForm(user || {}))
          setLoading(false)
        }
        return
      }

      if (isDemoUser) {
        let cached = null
        try {
          cached = JSON.parse(localStorage.getItem(DEMO_PROFILE_STORAGE_KEY))
        } catch {
          cached = null
        }

        const baseProfile = mapUserToProfileForm(user || {})
        const nextProfile = cached && typeof cached === 'object' ? { ...baseProfile, ...cached } : baseProfile

        if (!cached) {
          localStorage.setItem(DEMO_PROFILE_STORAGE_KEY, JSON.stringify(nextProfile))
        }

        if (mounted) {
          setForm(normalizeProfilePayload(nextProfile))
          setLoading(false)
        }
        return
      }

      try {
        const { data } = await api.get('/profile')
        if (!mounted) return

        const nextProfile = mapUserToProfileForm(data.user || {})
        setForm(nextProfile)
      } catch (requestError) {
        if (!mounted) return
        setError(requestError.response?.data?.message || 'Failed to load profile')
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadProfile()
    return () => {
      mounted = false
    }
  }, [isDemoUser, token, user])

  useEffect(() => {
    setMessage('')
    setError('')
    setPasswordMessage('')
    setPasswordError('')
  }, [activeTab])

  const textInputClass =
    'mt-2 w-full rounded-xl border-none bg-[#f1ecea] px-4 py-3 text-sm text-[#1c1b1b] placeholder:text-[#9d9a98] focus:ring-2 focus:ring-primary'

  const handleFieldChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleEmergencyChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact,
        [name]: value,
      },
    }))
  }

  const handleSettingChange = (event) => {
    const { name, checked } = event.target
    setForm((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        [name]: checked,
      },
    }))
  }

  const saveProfile = async (successText = 'Profile updated successfully.') => {
    const payload = normalizeProfilePayload(form)
    setSaving(true)
    setMessage('')
    setError('')

    try {
      if (isDemoUser) {
        localStorage.setItem(DEMO_PROFILE_STORAGE_KEY, JSON.stringify(payload))
        cacheAuthUserProfile(payload)
        setForm(payload)
        setMessage(successText)
        return
      }

      const { data } = await api.patch('/profile', payload)
      const nextProfile = mapUserToProfileForm(data.user || payload)
      setForm(nextProfile)
      cacheAuthUserProfile(nextProfile)
      setMessage(data.message || successText)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = (event) => {
    const { name, value } = event.target
    setPasswordForm((prev) => ({ ...prev, [name]: value }))
  }

  const handlePasswordSubmit = async (event) => {
    event.preventDefault()
    setPasswordError('')
    setPasswordMessage('')

    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('Please fill all password fields.')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirmation do not match.')
      return
    }

    setPasswordSaving(true)
    try {
      if (isDemoUser) {
        const demoPassword = user?.role === 'admin' ? 'Admin123!' : 'Student123!'
        if (passwordForm.oldPassword !== demoPassword) {
          throw new Error('Old password is incorrect')
        }

        setPasswordMessage('Password updated for demo account.')
      } else {
        const { data } = await api.patch('/profile/password', {
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword,
        })
        setPasswordMessage(data.message || 'Password updated successfully.')
      }

      setPasswordForm({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (requestError) {
      setPasswordError(requestError.response?.data?.message || requestError.message || 'Failed to update password')
    } finally {
      setPasswordSaving(false)
    }
  }

  const exportProfileData = () => {
    const data = normalizeProfilePayload(form)
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'dormdoor-profile-export.json'
    anchor.click()
    URL.revokeObjectURL(url)
    setMessage('Profile export downloaded.')
  }

  const showDeactivateNotice = () => {
    setError('Account deactivation is not enabled yet. Please contact support.')
  }

  return (
    <PageFrame placeholder="Search profile settings...">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[36px] font-extrabold tracking-[-0.05em]">Student Profile</h1>
          <p className="mt-2 text-[16px] text-[#546067]">Manage your personal data, security, and notification preferences.</p>
        </div>
        {loading ? <span className="rounded-full bg-[#eef1f4] px-4 py-2 text-[12px] font-bold text-[#5f6772]">Loading...</span> : null}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {PROFILE_TABS.map((tab) => {
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-full px-5 py-2.5 text-[13px] font-bold transition ${
                isActive ? 'bg-[#0c56d0] text-white shadow-[0_8px_18px_rgba(12,86,208,0.2)]' : 'bg-[#f1ecea] text-[#5f6772] hover:bg-[#e9e3e1]'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {message ? <p className="mt-5 rounded-xl bg-[#ecf7ef] px-4 py-3 text-sm font-semibold text-[#1f7a49]">{message}</p> : null}
      {error ? <p className="mt-5 rounded-xl bg-[#feecef] px-4 py-3 text-sm font-semibold text-[#c52424]">{error}</p> : null}

      <section className="mt-8 rounded-[28px] bg-white p-8 ring-1 ring-[#efebea]">
        {loading ? <p className="text-[15px] text-[#6b7280]">Loading profile details...</p> : null}

        {!loading && activeTab === 'personal' ? (
          <div>
            <h2 className="text-[28px] font-extrabold tracking-[-0.04em]">Personal Information</h2>
            <p className="mt-2 text-[15px] text-[#546067]">Keep your core academic profile details up to date.</p>
            <div className="mt-7 grid grid-cols-1 gap-5 md:grid-cols-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">
                Full Name
                <input name="name" value={form.name} onChange={handleFieldChange} className={textInputClass} />
              </label>

              <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">
                Student ID
                <input name="studentId" value={form.studentId} readOnly className={`${textInputClass} cursor-not-allowed opacity-80`} />
              </label>

              <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">
                Department
                <input name="department" value={form.department} onChange={handleFieldChange} className={textInputClass} />
              </label>

              <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">
                University
                <input name="university" value={form.university} onChange={handleFieldChange} className={textInputClass} />
              </label>
            </div>

            <button
              type="button"
              onClick={() => saveProfile('Personal details updated.')}
              disabled={saving}
              className="mt-7 rounded-xl bg-[#0c56d0] px-6 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? 'Saving...' : 'Save Personal Info'}
            </button>
          </div>
        ) : null}

        {!loading && activeTab === 'contact' ? (
          <div>
            <h2 className="text-[28px] font-extrabold tracking-[-0.04em]">Contact Information</h2>
            <p className="mt-2 text-[15px] text-[#546067]">Update your primary contact and emergency details.</p>
            <div className="mt-7 grid grid-cols-1 gap-5 md:grid-cols-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">
                Email
                <input name="email" value={form.email} readOnly className={`${textInputClass} cursor-not-allowed opacity-80`} />
              </label>

              <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">
                Phone
                <input name="phone" value={form.phone} onChange={handleFieldChange} className={textInputClass} />
              </label>

              <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-secondary md:col-span-2">
                Address
                <textarea name="address" rows="3" value={form.address} onChange={handleFieldChange} className={textInputClass} />
              </label>

              <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">
                Emergency Contact Name
                <input name="name" value={form.emergencyContact.name} onChange={handleEmergencyChange} className={textInputClass} />
              </label>

              <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">
                Emergency Contact Relation
                <input name="relation" value={form.emergencyContact.relation} onChange={handleEmergencyChange} className={textInputClass} />
              </label>

              <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">
                Emergency Contact Phone
                <input name="phone" value={form.emergencyContact.phone} onChange={handleEmergencyChange} className={textInputClass} />
              </label>
            </div>

            <button
              type="button"
              onClick={() => saveProfile('Contact information updated.')}
              disabled={saving}
              className="mt-7 rounded-xl bg-[#0c56d0] px-6 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? 'Saving...' : 'Save Contact Info'}
            </button>
          </div>
        ) : null}

        {!loading && activeTab === 'security' ? (
          <div>
            <h2 className="text-[28px] font-extrabold tracking-[-0.04em]">Security</h2>
            <p className="mt-2 text-[15px] text-[#546067]">Change your account password to keep your profile protected.</p>

            <form className="mt-7 grid grid-cols-1 gap-5 md:grid-cols-2" onSubmit={handlePasswordSubmit}>
              <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-secondary md:col-span-2">
                Current Password
                <input
                  type="password"
                  name="oldPassword"
                  value={passwordForm.oldPassword}
                  onChange={handlePasswordChange}
                  className={textInputClass}
                  required
                />
              </label>

              <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">
                New Password
                <input
                  type="password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  className={textInputClass}
                  required
                />
              </label>

              <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">
                Confirm New Password
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  className={textInputClass}
                  required
                />
              </label>

              <button
                type="submit"
                disabled={passwordSaving}
                className="rounded-xl bg-[#0c56d0] px-6 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-70 md:col-span-2 md:w-fit"
              >
                {passwordSaving ? 'Updating...' : 'Update Password'}
              </button>
            </form>

            {passwordMessage ? <p className="mt-5 rounded-xl bg-[#ecf7ef] px-4 py-3 text-sm font-semibold text-[#1f7a49]">{passwordMessage}</p> : null}
            {passwordError ? <p className="mt-5 rounded-xl bg-[#feecef] px-4 py-3 text-sm font-semibold text-[#c52424]">{passwordError}</p> : null}
          </div>
        ) : null}

        {!loading && activeTab === 'notifications' ? (
          <div>
            <h2 className="text-[28px] font-extrabold tracking-[-0.04em]">Notification Preferences</h2>
            <p className="mt-2 text-[15px] text-[#546067]">Choose how we should notify you about applications and support updates.</p>

            <div className="mt-7 space-y-4">
              {[
                ['emailNotifications', 'Email Notifications'],
                ['pushNotifications', 'Push Notifications'],
                ['smsNotifications', 'SMS Alerts'],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center justify-between rounded-[18px] bg-[#f7f4f3] px-5 py-4">
                  <span className="text-[15px] font-semibold text-[#2a2a2a]">{label}</span>
                  <input type="checkbox" name={key} checked={Boolean(form.settings[key])} onChange={handleSettingChange} className="h-5 w-5 accent-[#0c56d0]" />
                </label>
              ))}
            </div>

            <button
              type="button"
              onClick={() => saveProfile('Notification preferences updated.')}
              disabled={saving}
              className="mt-7 rounded-xl bg-[#0c56d0] px-6 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? 'Saving...' : 'Save Notification Preferences'}
            </button>
          </div>
        ) : null}

        {!loading && activeTab === 'privacy' ? (
          <div>
            <h2 className="text-[28px] font-extrabold tracking-[-0.04em]">Privacy &amp; Data</h2>
            <p className="mt-2 text-[15px] text-[#546067]">Export your profile information or request account actions.</p>

            <div className="mt-7 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={exportProfileData}
                className="rounded-xl border border-[#cfd6df] bg-white px-6 py-3 text-sm font-bold text-[#2a2a2a] transition hover:bg-[#f7f4f3]"
              >
                Export Profile Data
              </button>
              <button
                type="button"
                onClick={showDeactivateNotice}
                className="rounded-xl bg-[#f9dede] px-6 py-3 text-sm font-bold text-[#c52424] transition hover:bg-[#f7cccc]"
              >
                Request Deactivation
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </PageFrame>
  )
}

function SupportPage() {
  const { token } = useAuth()
  const isDemoUser = token === 'dormdoor_demo_token'
  const demoStorageKey = 'dormdoor_demo_student_support'

  const initialTicket = {
    subject: '',
    description: '',
    priority: 'Medium',
  }

  const [tickets, setTickets] = useState([])
  const [ticketForm, setTicketForm] = useState(initialTicket)
  const [activeTicketId, setActiveTicketId] = useState('')
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [sendingReply, setSendingReply] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const parseDemoTickets = () => {
    try {
      const raw = localStorage.getItem(demoStorageKey)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : null
    } catch {
      return null
    }
  }

  const seedDemoTickets = () => {
    return [
      {
        _id: 'demo-support-1',
        subject: 'Leaking pipe in Room 402B',
        description: 'Leak under bathroom sink started this morning.',
        priority: 'High',
        status: 'Open',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        messages: [
          {
            sender: { name: 'Demo Student', role: 'student' },
            text: 'Leak under bathroom sink started this morning.',
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          },
          {
            sender: { name: 'Dorm Admin', role: 'admin' },
            text: 'Thanks for reporting. Maintenance staff will visit shortly.',
            createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          },
        ],
      },
      {
        _id: 'demo-support-2',
        subject: 'WiFi signal strength issues',
        description: 'Signal drops every evening near study desk.',
        priority: 'Medium',
        status: 'Open',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        messages: [
          {
            sender: { name: 'Demo Student', role: 'student' },
            text: 'Signal drops every evening near study desk.',
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ],
      },
    ]
  }

  const fetchTickets = async () => {
    setLoading(true)
    setError('')

    try {
      if (isDemoUser) {
        const stored = parseDemoTickets()
        const next = stored || seedDemoTickets()
        if (!stored) {
          localStorage.setItem(demoStorageKey, JSON.stringify(next))
        }
        setTickets(next)
        if (next.length && !activeTicketId) {
          setActiveTicketId(next[0]._id)
        }
        return
      }

      const { data } = await api.get('/support')
      const list = data.tickets || []
      setTickets(list)
      if (list.length && !activeTicketId) {
        setActiveTicketId(list[0]._id)
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to load support tickets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [isDemoUser, token])

  const activeTicket = useMemo(() => {
    if (!tickets.length) return null
    return tickets.find((ticket) => ticket._id === activeTicketId) || tickets[0]
  }, [tickets, activeTicketId])

  const handleTicketChange = (event) => {
    const { name, value } = event.target
    setTicketForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleCreateTicket = async (event) => {
    event.preventDefault()
    if (!ticketForm.subject.trim() || !ticketForm.description.trim()) {
      setError('Subject and description are required.')
      return
    }

    setSubmitting(true)
    setMessage('')
    setError('')

    try {
      if (isDemoUser) {
        const now = new Date().toISOString()
        const created = {
          _id: `demo-support-${Date.now()}`,
          subject: ticketForm.subject.trim(),
          description: ticketForm.description.trim(),
          priority: ticketForm.priority,
          status: 'Open',
          createdAt: now,
          updatedAt: now,
          messages: [
            {
              sender: { name: 'Demo Student', role: 'student' },
              text: ticketForm.description.trim(),
              createdAt: now,
            },
          ],
        }

        const next = [created, ...tickets]
        setTickets(next)
        setActiveTicketId(created._id)
        localStorage.setItem(demoStorageKey, JSON.stringify(next))
      } else {
        await api.post('/support', {
          subject: ticketForm.subject.trim(),
          description: ticketForm.description.trim(),
          priority: ticketForm.priority,
        })
        await fetchTickets()
      }

      setTicketForm(initialTicket)
      setMessage('Support ticket created successfully.')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to create support ticket')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSendReply = async (event) => {
    event.preventDefault()
    if (!activeTicket?._id || !reply.trim()) {
      return
    }

    setSendingReply(true)
    setMessage('')
    setError('')

    try {
      if (isDemoUser) {
        const now = new Date().toISOString()
        const next = tickets.map((ticket) => {
          if (ticket._id !== activeTicket._id) return ticket
          return {
            ...ticket,
            updatedAt: now,
            messages: [
              ...(ticket.messages || []),
              {
                sender: { name: 'Demo Student', role: 'student' },
                text: reply.trim(),
                createdAt: now,
              },
            ],
          }
        })

        setTickets(next)
        localStorage.setItem(demoStorageKey, JSON.stringify(next))
      } else {
        await api.post(`/support/${activeTicket._id}/messages`, { text: reply.trim() })
        await fetchTickets()
      }

      setReply('')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to send reply')
    } finally {
      setSendingReply(false)
    }
  }

  const statusClass = (status) => {
    if (status === 'Resolved') return 'bg-[#eaf7ee] text-[#23945b]'
    if (status === 'Open') return 'bg-[#eef0ff] text-[#4a5fd2]'
    return 'bg-[#fff2de] text-[#b7791f]'
  }

  const formatDateTime = (value) => {
    if (!value) return 'N/A'
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return 'N/A'
    return parsed.toLocaleString()
  }

  return (
    <PageFrame placeholder="Search support tickets...">
      <h1 className="text-[42px] font-extrabold tracking-[-0.06em]">Support Center</h1>
      <p className="mt-3 max-w-[880px] text-[16px] leading-8 text-[#546067]">
        Open a support ticket and chat directly with the housing administration team.
      </p>

      {message ? <p className="mt-6 rounded-lg bg-[#ecf7ef] px-4 py-3 text-sm font-semibold text-[#23945b]">{message}</p> : null}
      {error ? <p className="mt-6 rounded-lg bg-[#ffe9ec] px-4 py-3 text-sm font-semibold text-[#c73535]">{error}</p> : null}

      <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[28px] bg-white p-8 ring-1 ring-[#efebea]">
          <h2 className="text-[24px] font-extrabold tracking-[-0.04em]">Create Ticket</h2>
          <form className="mt-6 space-y-4" onSubmit={handleCreateTicket}>
            <label className="block text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">
              Subject
              <input
                name="subject"
                value={ticketForm.subject}
                onChange={handleTicketChange}
                className="mt-2 w-full rounded-xl border-none bg-[#f1ecea] px-4 py-3 text-sm"
                required
              />
            </label>

            <label className="block text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">
              Description
              <textarea
                name="description"
                rows="4"
                value={ticketForm.description}
                onChange={handleTicketChange}
                className="mt-2 w-full rounded-xl border-none bg-[#f1ecea] px-4 py-3 text-sm"
                required
              />
            </label>

            <label className="block text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">
              Priority
              <select
                name="priority"
                value={ticketForm.priority}
                onChange={handleTicketChange}
                className="mt-2 w-full rounded-xl border-none bg-[#f1ecea] px-4 py-3 text-sm"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-[18px] bg-[#0c56d0] px-7 py-3 text-[15px] font-bold text-white disabled:opacity-70"
            >
              {submitting ? 'Opening...' : 'Open Ticket'}
            </button>
          </form>

          <div className="mt-8 border-t border-[#efebea] pt-6">
            <h3 className="text-[18px] font-extrabold">My Tickets</h3>
            {loading ? (
              <p className="mt-3 text-sm text-[#6b7280]">Loading tickets...</p>
            ) : tickets.length === 0 ? (
              <p className="mt-3 rounded-xl bg-[#f7f4f3] px-4 py-4 text-sm text-[#546067]">No tickets available.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {tickets.map((ticket) => (
                  <button
                    key={ticket._id}
                    type="button"
                    onClick={() => setActiveTicketId(ticket._id)}
                    className={`w-full rounded-[18px] p-4 text-left ring-1 transition ${
                      activeTicket?._id === ticket._id
                        ? 'bg-[#eef3ff] ring-[#c9d8ff]'
                        : 'bg-[#f7f4f3] ring-transparent hover:ring-[#efebea]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-[15px] font-bold">{ticket.subject}</p>
                      <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${statusClass(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </div>
                    <p className="mt-2 text-[12px] text-[#6b7280]">Priority: {ticket.priority} - Updated: {formatDateTime(ticket.updatedAt || ticket.createdAt)}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[28px] bg-white p-8 ring-1 ring-[#efebea]">
          <h2 className="text-[24px] font-extrabold tracking-[-0.04em]">Conversation</h2>
          {!activeTicket ? (
            <p className="mt-5 rounded-xl bg-[#f7f4f3] px-4 py-4 text-sm text-[#546067]">Select a ticket to view details.</p>
          ) : (
            <>
              <div className="mt-5 rounded-[20px] bg-[#f7f4f3] p-5">
                <p className="text-[18px] font-extrabold">{activeTicket.subject}</p>
                <p className="mt-2 text-[14px] text-[#546067]">{activeTicket.description}</p>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-[12px] font-semibold text-[#6b7280]">
                  <span className={`rounded-full px-3 py-1 ${statusClass(activeTicket.status)}`}>{activeTicket.status}</span>
                  <span>Priority: {activeTicket.priority}</span>
                </div>
              </div>

              <div className="mt-6 max-h-[340px] space-y-4 overflow-auto pr-2">
                {(activeTicket.messages || []).map((item, index) => {
                  const isAdmin = item.sender?.role === 'admin'
                  return (
                    <div
                      key={`${item.createdAt || index}-${index}`}
                      className={`max-w-[92%] rounded-[18px] px-4 py-3 ${
                        isAdmin ? 'bg-[#eaf2ff] text-[#1f4cb7]' : 'ml-auto bg-[#f1ecea] text-[#2f2f2f]'
                      }`}
                    >
                      <p className="text-[12px] font-bold uppercase tracking-[0.08em]">
                        {item.sender?.name || (isAdmin ? 'Admin' : 'Student')}
                      </p>
                      <p className="mt-2 text-[14px] leading-7">{item.text}</p>
                      <p className="mt-2 text-[11px] opacity-75">{formatDateTime(item.createdAt)}</p>
                    </div>
                  )
                })}
              </div>

              <form className="mt-6" onSubmit={handleSendReply}>
                <textarea
                  rows="4"
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  placeholder="Type your reply here..."
                  className="w-full resize-none rounded-[18px] bg-[#f5f2f1] p-4 text-[15px] outline-none"
                />
                <button
                  type="submit"
                  disabled={sendingReply || !reply.trim()}
                  className="mt-4 rounded-[18px] bg-[#0c56d0] px-7 py-3 text-[15px] font-bold text-white disabled:opacity-70"
                >
                  {sendingReply ? 'Sending...' : 'Send Reply'}
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </PageFrame>
  )
}

export default function StudentPortal() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [activePage, setActivePage] = useState(pathToPage(location.pathname))

  useEffect(() => {
    setActivePage(pathToPage(location.pathname))
  }, [location.pathname])

  const handlePageChange = (key) => {
    const target = PAGE_TO_PATH[key] || PAGE_TO_PATH.dashboard
    setActivePage(key)
    if (location.pathname !== target) {
      navigate(target)
    }
  }

  const handleSignOut = () => {
    logout()
    navigate('/login')
  }

  const page = useMemo(() => {
    switch (activePage) {
      case 'applications':
        return <RoomApplicationsPage />
      case 'maintenance':
        return <MaintenancePage />
      case 'documents':
        return <DocumentsPage />
      case 'reviews':
        return <ReviewsPage />
      case 'profile':
        return <ProfilePage />
      case 'support':
        return <SupportPage />
      default:
        return <DashboardPage setActivePage={handlePageChange} />
    }
  }, [activePage])

  return (
    <div>
      <Sidebar activePage={activePage} setActivePage={handlePageChange} onSignOut={handleSignOut} />
      {page}
    </div>
  )
}







