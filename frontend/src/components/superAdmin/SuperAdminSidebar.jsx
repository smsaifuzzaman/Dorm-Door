import {
  Building2,
  ClipboardList,
  FileCheck2,
  Home,
  LogOut,
  MessageSquare,
  ReceiptText,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const items = [
  { label: 'Dashboard', to: '/super-admin/dashboard', icon: Home },
  { label: 'Dorms', to: '/super-admin/dorms', icon: Building2 },
  { label: 'Dorm Admins', to: '/super-admin/dorm-admins', icon: ShieldCheck },
  { label: 'Students', to: '/super-admin/students', icon: Users },
  { label: 'Applications', to: '/super-admin/applications', icon: ClipboardList },
  { label: 'Transactions', to: '/super-admin/transactions', icon: ReceiptText },
  { label: 'Documents', to: '/super-admin/documents', icon: FileCheck2 },
  { label: 'Complaints', to: '/super-admin/complaints', icon: MessageSquare },
]

function SuperAdminSidebar() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-slate-800 bg-slate-950 text-white">
      <div className="px-6 py-7">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white">
            <Building2 size={21} />
          </div>
          <div>
            <h1 className="text-lg font-black">Dorm Door</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Super Admin</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-4 pb-4">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition',
                  isActive ? 'bg-white text-slate-950' : 'text-slate-300 hover:bg-slate-900 hover:text-white',
                ].join(' ')
              }
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-semibold text-red-200 transition hover:bg-red-500/10 hover:text-red-100"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}

export default SuperAdminSidebar
