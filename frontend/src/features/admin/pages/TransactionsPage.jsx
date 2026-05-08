import { useEffect, useMemo, useState } from 'react'
import { Eye, ReceiptText, RefreshCw } from 'lucide-react'
import AdminLayout from '../components/layout/AdminLayout'
import { topbarAvatars } from '../data/dashboardData'
import { api } from '../../../api/client'
import { toSafeExternalUrl } from '../../../utils/url'

function formatDateTime(value) {
  if (!value) return 'N/A'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'N/A'
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatMoney(value) {
  return `BDT ${Number(value || 0).toLocaleString()}`
}

function statusClass(status) {
  if (status === 'Approved') return 'bg-emerald-50 text-emerald-700 ring-emerald-700/10'
  if (status === 'Rejected') return 'bg-red-50 text-red-700 ring-red-700/10'
  return 'bg-amber-50 text-amber-700 ring-amber-700/10'
}

function referenceId(transaction) {
  const applicationId =
    typeof transaction.application === 'string'
      ? transaction.application
      : transaction.application?._id
  return applicationId ? String(applicationId).slice(-8).toUpperCase() : String(transaction._id || '').slice(-8).toUpperCase()
}

function TransactionsPage() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [statusFilter, setStatusFilter] = useState('All')

  const loadTransactions = async () => {
    setLoading(true)
    setError('')

    try {
      const { data } = await api.get('/transactions')
      setTransactions(data.transactions || [])
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTransactions()
  }, [])

  const filteredTransactions = useMemo(() => {
    if (statusFilter === 'All') return transactions
    return transactions.filter((transaction) => transaction.status === statusFilter)
  }, [statusFilter, transactions])

  const stats = useMemo(() => {
    const approvedTransactions = transactions.filter((transaction) => transaction.status === 'Approved')
    return {
      total: transactions.length,
      approved: approvedTransactions.length,
      amount: approvedTransactions.reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0),
    }
  }, [transactions])

  return (
    <AdminLayout
      activeKey="transactions"
      topbarProps={{
        searchPlaceholder: 'Search transactions...',
        profileName: 'Dorm Admin',
        profileRole: 'Payment Monitor',
        avatar: topbarAvatars.admin,
      }}
      contentClassName="p-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-primary">Payment Monitoring</p>
            <h1 className="text-5xl font-black tracking-tighter">Transactions</h1>
            <p className="mt-3 max-w-2xl text-[18px] leading-8 text-secondary">
              Review student payments after super admin approval and keep dorm-level payment records up to date.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={loadTransactions}
              className="inline-flex items-center gap-2 rounded-xl border border-[#ece7e4] bg-white px-5 py-3 text-sm font-bold text-slate-700"
            >
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </div>

        {error ? <p className="mb-6 rounded-xl bg-[#ffe9ec] px-4 py-3 text-sm font-semibold text-[#c73535]">{error}</p> : null}

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          {[
            ['Total Approved Records', stats.total, 'bg-white'],
            ['Approved Payments', stats.approved, 'bg-emerald-50'],
            ['Approved Amount', formatMoney(stats.amount), 'bg-blue-50'],
          ].map(([label, value, tone]) => (
            <div key={label} className={`rounded-xl border border-[#ece7e4] p-6 ${tone}`}>
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
                <ReceiptText size={20} />
              </div>
              <p className="text-sm font-semibold text-secondary">{label}</p>
              <p className="mt-1 text-3xl font-black text-[#1c1b1b]">{loading ? '...' : value}</p>
            </div>
          ))}
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {['All', 'Approved'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                statusFilter === status ? 'bg-primary text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-[1.5rem] border border-[#ece7e4] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left">
              <thead className="bg-[#faf7f6]">
                <tr>
                  {['Reference ID', 'Student', 'Dorm', 'Amount', 'Method', 'Transaction ID', 'Date', 'Status', 'Actions'].map((head) => (
                    <th key={head} className="px-5 py-5 text-[11px] font-black uppercase tracking-[0.18em] text-secondary">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="px-5 py-10 text-center text-sm text-secondary">Loading transactions...</td></tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr><td colSpan={9} className="px-5 py-10 text-center text-sm text-secondary">No transactions found.</td></tr>
                ) : filteredTransactions.map((transaction) => (
                  <tr key={transaction._id} className="border-t border-[#f0ebea]">
                    <td className="px-5 py-5 text-sm font-black text-slate-900">{referenceId(transaction)}</td>
                    <td className="px-5 py-5">
                      <p className="text-sm font-bold text-slate-950">{transaction.student?.name || 'Unknown Student'}</p>
                      <p className="text-xs text-secondary">{transaction.student?.email || 'No email'}</p>
                    </td>
                    <td className="px-5 py-5 text-sm">{transaction.dorm?.name || 'N/A'}</td>
                    <td className="px-5 py-5 text-sm font-bold">{formatMoney(transaction.amount)}</td>
                    <td className="px-5 py-5 text-sm">{transaction.paymentMethod || 'N/A'}</td>
                    <td className="px-5 py-5 text-sm">{transaction.transactionId || 'N/A'}</td>
                    <td className="px-5 py-5 text-sm text-secondary">{formatDateTime(transaction.createdAt)}</td>
                    <td className="px-5 py-5">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${statusClass(transaction.status)}`}>
                        {transaction.status || 'Pending'}
                      </span>
                    </td>
                    <td className="px-5 py-5">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setSelectedTransaction(transaction)} className="rounded-lg p-2 text-primary hover:bg-blue-50" title="View">
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedTransaction ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-extrabold">Transaction Details</h3>
                <p className="mt-1 text-sm text-secondary">{referenceId(selectedTransaction)}</p>
              </div>
              <button type="button" onClick={() => setSelectedTransaction(null)} className="rounded-lg px-3 py-2 text-sm font-semibold text-secondary hover:bg-[#f2efee]">
                Close
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <p><span className="font-bold">Student:</span> {selectedTransaction.student?.name || 'N/A'}</p>
              <p><span className="font-bold">Email:</span> {selectedTransaction.student?.email || 'N/A'}</p>
              <p><span className="font-bold">Dorm:</span> {selectedTransaction.dorm?.name || 'N/A'}</p>
              <p><span className="font-bold">Room:</span> {selectedTransaction.room?.roomNumber || selectedTransaction.room?.type || 'N/A'}</p>
              <p><span className="font-bold">Amount:</span> {formatMoney(selectedTransaction.amount)}</p>
              <p><span className="font-bold">Method:</span> {selectedTransaction.paymentMethod || 'N/A'}</p>
              <p><span className="font-bold">Transaction ID:</span> {selectedTransaction.transactionId || 'N/A'}</p>
              <p><span className="font-bold">Status:</span> {selectedTransaction.status || 'Pending'}</p>
              <p><span className="font-bold">Submitted:</span> {formatDateTime(selectedTransaction.createdAt)}</p>
              <p><span className="font-bold">Approved By:</span> {selectedTransaction.approvedBy?.name || 'Not approved yet'}</p>
              {toSafeExternalUrl(selectedTransaction.receiptUrl) ? (
                <p className="sm:col-span-2">
                  <span className="font-bold">Receipt:</span>{' '}
                  <a href={toSafeExternalUrl(selectedTransaction.receiptUrl)} target="_blank" rel="noreferrer" className="font-bold text-primary underline">
                    Open receipt
                  </a>
                </p>
              ) : null}
              {selectedTransaction.rejectionReason ? (
                <p className="sm:col-span-2"><span className="font-bold">Rejection Reason:</span> {selectedTransaction.rejectionReason}</p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  )
}

export default TransactionsPage
