import { useEffect, useState } from 'react'
import {
  Building2,
  ClipboardCheck,
  ClipboardList,
  FileClock,
  FileText,
  ReceiptText,
  Users,
} from 'lucide-react'
import SuperAdminLayout from '../../components/superAdmin/SuperAdminLayout'
import StatCard from '../../components/superAdmin/StatCard'
import { getDashboardStats } from '../../services/superAdminApi'

const fallbackStats = {
  totalDorms: 0,
  totalDormAdmins: 0,
  totalStudents: 0,
  totalApplications: 0,
  pendingApplications: 0,
  approvedApplications: 0,
  totalRooms: 0,
  availableRooms: 0,
  pendingTransactions: 0,
  approvedTransactions: 0,
  pendingDocuments: 0,
  totalComplaints: 0,
}

function SuperAdminDashboard() {
  const [stats, setStats] = useState(fallbackStats)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    async function loadStats() {
      setLoading(true)
      setError('')

      try {
        const { data } = await getDashboardStats()
        if (mounted) setStats({ ...fallbackStats, ...(data.stats || {}) })
      } catch (requestError) {
        if (mounted) setError(requestError.response?.data?.message || 'Failed to load dashboard stats')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadStats()

    return () => {
      mounted = false
    }
  }, [])

  const cards = [
    ['Total Dorms', stats.totalDorms, Building2],
    ['Total Dorm Admins', stats.totalDormAdmins, Users],
    ['Total Students', stats.totalStudents, Users],
    ['Total Applications', stats.totalApplications, ClipboardList],
    ['Pending Applications', stats.pendingApplications, ClipboardList],
    ['Approved Applications', stats.approvedApplications, ClipboardCheck],
    ['Pending Transactions', stats.pendingTransactions, ReceiptText],
    ['Approved Transactions', stats.approvedTransactions, ReceiptText],
    ['Pending Documents', stats.pendingDocuments, FileClock],
    ['Total Complaints', stats.totalComplaints, FileText],
  ]

  return (
    <SuperAdminLayout title="Dashboard" subtitle="Quick summary of Dorm Door operations.">
      {error ? <p className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value, Icon]) => (
          <StatCard key={label} label={label} value={loading ? '...' : value} icon={Icon} />
        ))}
      </div>

      <section className="mt-8 rounded-xl border border-[#e8edf3] bg-white p-6 shadow-sm">
        <h3 className="text-xl font-black text-slate-950">Payment Review Rule</h3>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
          Student-submitted payments stay pending until a super admin approves or rejects them from the
          Transactions page. Application approval and payment approval remain separate decisions.
        </p>
      </section>
    </SuperAdminLayout>
  )
}

export default SuperAdminDashboard
