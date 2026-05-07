import { Link, NavLink } from 'react-router-dom'
import { useLanguage } from '../../../context/LanguageContext'
import { useAuth } from '../../../context/AuthContext'
import { displayAvatarFor } from '../../../utils/avatar'

const links = [
  { to: '/', label: 'Home' },
  { to: '/browse-dorms', label: 'Browse Dorms' },
]

function Navbar({ buttonLabel = 'Login', buttonTo = '/login' }) {
  const { language, setLanguage } = useLanguage()
  const { isAuthenticated, user } = useAuth()
  const avatar = displayAvatarFor(user, 'U')
  const dashboardTo = user?.role === 'admin' ? '/admin' : user?.role === 'superAdmin' ? '/super-admin/dashboard' : '/student'

  return (
    <nav className="fixed top-0 z-50 w-full bg-[#fcf9f8]/70 backdrop-blur-xl shadow-soft">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 md:px-8">
        <Link to="/" className="text-2xl font-black tracking-tighter text-on-surface">
          Dorm Door
        </Link>

        <div className="hidden items-center space-x-8 text-sm font-medium md:flex">
          {links.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              className={({ isActive }) =>
                isActive
                  ? 'border-b-2 border-primary pb-1 font-bold text-primary'
                  : 'text-secondary transition hover:text-on-surface'
              }
            >
              {link.label}
            </NavLink>
          ))}
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

          {isAuthenticated ? (
            <Link
              to={dashboardTo}
              className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-[#e5edf9] text-sm font-black text-[#0c56d0] ring-2 ring-white transition hover:scale-105"
              aria-label="Open dashboard"
              title={user?.name || 'Open dashboard'}
            >
              {avatar.image ? <img src={avatar.image} alt="" className="h-full w-full object-cover" /> : avatar.initials}
            </Link>
          ) : (
            <Link
              to={buttonTo}
              className="rounded-lg bg-gradient-to-br from-primary to-primary-container px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:scale-105"
            >
              {buttonLabel}
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
