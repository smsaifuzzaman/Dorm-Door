import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Eye, RefreshCw, XCircle } from 'lucide-react'
import DataTable from '../../components/superAdmin/DataTable'
import SimpleModal from '../../components/superAdmin/SimpleModal'
import StatusBadge from '../../components/superAdmin/StatusBadge'
import SuperAdminLayout from '../../components/superAdmin/SuperAdminLayout'
import {
  approveTransaction,
  getTransactions,
  rejectTransaction,
} from '../../services/superAdminApi'
import { formatDate, formatDateTime, money, referenceId } from './pageUtils'
import { toSafeExternalUrl } from '../../utils/url'

function TransactionManagement() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const loadTransactions = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true)
      setError('')
    }

    try {
      const { data } = await getTransactions()
      setTransactions(data.transactions || [])
      setLastUpdated(new Date())
    } catch (requestError) {
      if (!silent) {
        setError(requestError.response?.data?.message || 'Failed to load transactions')
      }
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    void loadTransactions()

    const interval = window.setInterval(() => {
      void loadTransactions({ silent: true })
    }, 10000)

    return () => {
      window.clearInterval(interval)
    }
  }, [])

  const handleApprove = async (transaction) => {
    if (!window.confirm(`Approve transaction ${transaction.transactionId}?`)) return
    try {
      await approveTransaction(transaction._id)
      await loadTransactions()
      setMessage('Transaction approved. Student payment status was updated.')
    } catch (requestError) {
      setMessage(requestError.response?.data?.message || 'Failed to approve transaction.')
    }
  }

  const handleReject = async (transaction) => {
    const reason = window.prompt('Enter rejection reason:')
    if (!reason) return

    try {
      await rejectTransaction(transaction._id, reason)
      await loadTransactions()
      setMessage('Transaction rejected. The reason was saved for the student.')
    } catch (requestError) {
      setMessage(requestError.response?.data?.message || 'Failed to reject transaction.')
    }
  }

  const columns = useMemo(
    () => [
      { key: 'reference', label: 'Reference ID', render: (row) => referenceId(row.application || row) },
      { key: 'student', label: 'Student Name', render: (row) => row.student?.name || 'Unknown Student' },
      { key: 'dorm', label: 'Dorm Name', render: (row) => row.dorm?.name || 'N/A' },
      { key: 'amount', label: 'Amount', render: (row) => money(row.amount) },
      { key: 'paymentMethod', label: 'Payment Method' },
      { key: 'transactionId', label: 'Transaction ID' },
      { key: 'date', label: 'Date', render: (row) => formatDate(row.createdAt) },
      { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
      {
        key: 'actions',
        label: 'Actions',
        render: (row) => (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setSelectedTransaction(row)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" title="View">
              <Eye size={16} />
            </button>
            {row.status === 'Pending' ? (
              <>
                <button type="button" onClick={() => handleApprove(row)} className="rounded-lg p-2 text-emerald-700 hover:bg-emerald-50" title="Approve">
                  <CheckCircle2 size={16} />
                </button>
                <button type="button" onClick={() => handleReject(row)} className="rounded-lg p-2 text-red-600 hover:bg-red-50" title="Reject">
                  <XCircle size={16} />
                </button>
              </>
            ) : null}
          </div>
        ),
      },
    ],
    [],
  )

  return (
    <SuperAdminLayout title="Transactions" subtitle="Approve or reject student payments manually.">
      <section className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-800">
        Student payments enter this table as Pending. Only approving here updates the application payment status.
      </section>

      {error ? <p className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
      {message ? <p className="mb-5 rounded-lg bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">{message}</p> : null}

      <div className="mb-5 flex flex-col justify-between gap-3 rounded-xl border border-[#e8edf3] bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center">
        <p className="text-sm font-semibold text-slate-600">
          {lastUpdated ? `Last updated ${lastUpdated.toLocaleTimeString()}` : 'Waiting for first refresh'}
        </p>
        <button
          type="button"
          onClick={() => loadTransactions()}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition hover:brightness-110"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <DataTable columns={columns} rows={transactions} loading={loading} emptyMessage="No transactions found." />

      {selectedTransaction ? (
        <SimpleModal title="Transaction Details" onClose={() => setSelectedTransaction(null)}>
          <div className="grid gap-4 text-sm text-slate-700 sm:grid-cols-2">
            <p><strong>Reference ID:</strong> {referenceId(selectedTransaction.application || selectedTransaction)}</p>
            <p><strong>Student:</strong> {selectedTransaction.student?.name || 'N/A'}</p>
            <p><strong>Email:</strong> {selectedTransaction.student?.email || 'N/A'}</p>
            <p><strong>Dorm:</strong> {selectedTransaction.dorm?.name || 'N/A'}</p>
            <p><strong>Room:</strong> {selectedTransaction.room?.roomNumber || selectedTransaction.room?.type || 'N/A'}</p>
            <p><strong>Amount:</strong> {money(selectedTransaction.amount)}</p>
            <p><strong>Payment Method:</strong> {selectedTransaction.paymentMethod}</p>
            <p><strong>Transaction ID:</strong> {selectedTransaction.transactionId}</p>
            <p><strong>Submitted:</strong> {formatDateTime(selectedTransaction.createdAt)}</p>
            <p><strong>Status:</strong> {selectedTransaction.status}</p>
            {toSafeExternalUrl(selectedTransaction.receiptUrl) ? (
              <p className="sm:col-span-2">
                <strong>Receipt:</strong>{' '}
                <a href={toSafeExternalUrl(selectedTransaction.receiptUrl)} target="_blank" rel="noreferrer" className="font-bold text-primary underline">
                  Open receipt
                </a>
              </p>
            ) : null}
            {selectedTransaction.rejectionReason ? (
              <p className="sm:col-span-2"><strong>Rejection Reason:</strong> {selectedTransaction.rejectionReason}</p>
            ) : null}
          </div>
        </SimpleModal>
      ) : null}
    </SuperAdminLayout>
  )
}

export default TransactionManagement
