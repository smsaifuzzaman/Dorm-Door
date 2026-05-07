import { NavLink } from 'react-router-dom'
import Icon from '../Icon'
import { useAuth } from '../../../../context/AuthContext'

const navItems = [
  { key: 'overview', label: 'Overview', icon: 'dashboard', to: '/admin' },
  { key: 'dorms', label: 'Dorms', icon: 'domain', to: '/admin/dorms' },
  { key: 'applications', label: 'Applications', icon: 'assignment', to: '/admin/applications' },
  { key: 'documents', label: 'Documents', icon: 'description', to: '/admin/documents' },
  { key: 'transactions', label: 'Transactions', icon: 'payments', to: '/admin/transactions' },
  { key: 'availability', label: 'Availability', icon: 'event_available', to: '/admin/availability' },
  { key: 'support', label: 'Support', icon: 'contact_support', to: '/admin/support' },
]

function Sidebar({ activeKey = 'overview' }) {
  const { logout } = useAuth()

  const handleSignOut = () => {
    logout()
  }
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-[#ece7e4] bg-slate-50">
      <div className="px-6 py-8">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
            <Icon name="domain" filled />
          </div>
          <div>
            <h1 className="text-[18px] font-extrabold leading-tight text-primaryDark">Dorm Door</h1>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">
              Dorm Management
            </p>
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const active = item.key === activeKey
            return (
              <NavLink
                key={item.key}
                to={item.to}
                className={[
                  'flex items-center gap-3 rounded-lg px-4 py-3 text-[15px] font-medium transition-all',
                  active
                    ? 'translate-x-1 border-r-2 border-primary bg-blue-50/80 font-bold text-primary'
                    : 'text-slate-600 hover:bg-slate-200/50 hover:text-primary',
                ].join(' ')}
              >
                <Icon name={item.icon} filled={active} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </div>

      <div className="mt-auto space-y-1 px-6 py-8">
        <NavLink
          to="/admin/profile"
          className={({ isActive }) =>
            [
              'flex items-center gap-3 rounded-lg px-4 py-3 text-[15px] font-medium transition-all',
              isActive
                ? 'translate-x-1 border-r-2 border-primary bg-blue-50/80 font-bold text-primary'
                : 'text-slate-600 hover:bg-slate-200/50 hover:text-primary',
            ].join(' ')
          }
        >
          <Icon name="person" />
          <span>Profile</span>
        </NavLink>

        <button onClick={handleSignOut} className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-[15px] font-medium text-slate-600 transition-all hover:bg-slate-200/50 hover:text-red-600">
          <Icon name="logout" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar




