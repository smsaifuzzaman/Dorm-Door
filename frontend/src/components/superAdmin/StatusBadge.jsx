const toneMap = {
  Pending: 'bg-amber-50 text-amber-700 ring-amber-700/10',
  Approved: 'bg-emerald-50 text-emerald-700 ring-emerald-700/10',
  Paid: 'bg-emerald-50 text-emerald-700 ring-emerald-700/10',
  Verified: 'bg-emerald-50 text-emerald-700 ring-emerald-700/10',
  Solved: 'bg-emerald-50 text-emerald-700 ring-emerald-700/10',
  Resolved: 'bg-emerald-50 text-emerald-700 ring-emerald-700/10',
  Active: 'bg-emerald-50 text-emerald-700 ring-emerald-700/10',
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-700/10',
  Open: 'bg-sky-50 text-sky-700 ring-sky-700/10',
  Available: 'bg-emerald-50 text-emerald-700 ring-emerald-700/10',
  Rejected: 'bg-red-50 text-red-700 ring-red-700/10',
  Blocked: 'bg-red-50 text-red-700 ring-red-700/10',
  blocked: 'bg-red-50 text-red-700 ring-red-700/10',
  Inactive: 'bg-slate-100 text-slate-700 ring-slate-700/10',
  inactive: 'bg-slate-100 text-slate-700 ring-slate-700/10',
  Unavailable: 'bg-slate-100 text-slate-700 ring-slate-700/10',
  Maintenance: 'bg-slate-100 text-slate-700 ring-slate-700/10',
  Waitlisted: 'bg-violet-50 text-violet-700 ring-violet-700/10',
  Cancelled: 'bg-slate-100 text-slate-700 ring-slate-700/10',
}

function StatusBadge({ status = 'Pending' }) {
  const tone = toneMap[status] || 'bg-slate-100 text-slate-700 ring-slate-700/10'

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ${tone}`}>
      {status}
    </span>
  )
}

export default StatusBadge
