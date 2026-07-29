const MAP = {
  Active: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  Completed: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  Approved: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  Paid: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  Done: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  'In Progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  Planning: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  Probation: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'On Hold': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  Review: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'On Leave': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  Rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  Cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  Terminated: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  Expired: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  Critical: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  High: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  Medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  Low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  // Company lifecycle states
  Inactive: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  Blocked: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  'Company Admin': 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  'Super Admin': 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900',
};

export default function Badge({ value }) {
  const cls = MAP[value] || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
  return <span className={`badge ${cls}`}>{value ?? '—'}</span>;
}
