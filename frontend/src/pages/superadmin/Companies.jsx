import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiSearch, FiMoreVertical, FiCheckCircle, FiPauseCircle, FiSlash,
  FiTrash2, FiUsers, FiFolder, FiEye, FiAlertTriangle, FiRefreshCw,
} from 'react-icons/fi';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../../services/api.js';
import PageHeader from '../../components/PageHeader.jsx';
import Spinner from '../../components/Spinner.jsx';
import Badge from '../../components/Badge.jsx';
import Modal from '../../components/Modal.jsx';

const STATUSES = ['Active', 'Inactive', 'Blocked'];
const actionsFor = (status) => {
  const all = [
    { key: 'activate', label: 'Activate', icon: FiCheckCircle, tone: 'text-emerald-600', when: ['Inactive'] },
    { key: 'unblock', label: 'Unblock', icon: FiRefreshCw, tone: 'text-emerald-600', when: ['Blocked'] },
    { key: 'deactivate', label: 'Deactivate', icon: FiPauseCircle, tone: 'text-amber-600', when: ['Active'] },
    { key: 'block', label: 'Block', icon: FiSlash, tone: 'text-rose-600', when: ['Active', 'Inactive'] },
  ];
  return all.filter((a) => a.when.includes(status));
};

function RowMenu({ company, onAction, onInspect }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="btn-ghost !px-2"
        aria-label="Actions"
      >
        <FiMoreVertical size={16} />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-48 card p-1.5 shadow-soft">
          <button
            onMouseDown={() => onInspect(company)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <FiEye size={15} /> View details
          </button>
          {actionsFor(company.status).map((a) => (
            <button
              key={a.key}
              onMouseDown={() => onAction(company, a.key)}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 ${a.tone}`}
            >
              <a.icon size={15} /> {a.label}
            </button>
          ))}
          <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
          <button
            onMouseDown={() => onAction(company, 'delete')}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <FiTrash2 size={15} /> Delete company
          </button>
        </div>
      )}
    </div>
  );
}

export default function Companies() {
  const [params, setParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState(params.get('search') || '');
  const [status, setStatus] = useState(params.get('status') || '');
  const [page, setPage] = useState(1);

  const [pending, setPending] = useState(null);   
  const [reason, setReason] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);
  const [details, setDetails] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/super-admin/companies', {
        params: { search: search || undefined, status: status || undefined, page, limit: 20 },
      });
      setRows(r.data.data);
      setMeta(r.data.meta);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [search, status, page]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const next = {};
    if (search) next.search = search;
    if (status) next.status = status;
    setParams(next, { replace: true });
  }, [search, status, setParams]);

  const openAction = (company, action) => {
    if (action === 'block' || action === 'delete') {
      setPending({ company, action });
      setReason('');
      setConfirmText('');
      return;
    }
    runAction(company, action);
  };

  const runAction = async (company, action, extra = {}) => {
    setBusy(true);
    try {
      if (action === 'delete') {
        await api.delete(`/super-admin/companies/${company._id}`, {
          data: { confirm: extra.confirm },
        });
        toast.success(`${company.name} deleted`);
      } else {
        await api.patch(`/super-admin/companies/${company._id}/status`, {
          action, reason: extra.reason || '',
        });
        toast.success(`${company.name} ${action}d`);
      }
      setPending(null);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const inspect = async (company) => {
    setDetails({ loading: true, company });
    try {
      const r = await api.get(`/super-admin/companies/${company._id}`);
      setDetails({ loading: false, ...r.data.data });
    } catch (e) {
      toast.error(e.message);
      setDetails(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Companies"
        subtitle={`${meta.total} company${meta.total === 1 ? '' : 'ies'} registered on the platform`}
      />

      {/* Filters */}
      <div className="card p-4 mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            className="input pl-9"
            placeholder="Search by name, owner, email or code…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="input !w-auto"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={load} className="btn-ghost" title="Refresh">
          <FiRefreshCw size={16} />
        </button>
      </div>

      {loading ? (
        <Spinner label="Loading companies…" />
      ) : rows.length === 0 ? (
        <div className="card p-12 text-center text-slate-500">
          No companies match your filters.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-left">
                <tr className="text-[11px] uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3 font-bold">Company</th>
                  <th className="px-4 py-3 font-bold">Admin</th>
                  <th className="px-4 py-3 font-bold">Industry</th>
                  <th className="px-4 py-3 font-bold text-center">Employees</th>
                  <th className="px-4 py-3 font-bold text-center">Projects</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold">Registered</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((c, i) => (
                  <motion.tr
                    key={c._id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {c.logo
                          ? <img src={c.logo} alt="" className="h-9 w-9 rounded-lg object-cover bg-slate-100" />
                          : <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary font-bold">
                              {c.name.charAt(0).toUpperCase()}
                            </div>}
                        <div className="leading-tight min-w-0">
                          <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">{c.name}</p>
                          <p className="text-xs text-slate-400 font-mono">{c.companyCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-700 dark:text-slate-200">
                        {c.admin?.fullName || c.ownerName}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{c.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{c.industry}</td>
                    <td className="px-4 py-3 text-center font-semibold">{c.employeeCount}</td>
                    <td className="px-4 py-3 text-center font-semibold">{c.projectCount}</td>
                    <td className="px-4 py-3"><Badge value={c.status} /></td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {c.createdAt ? format(new Date(c.createdAt), 'dd MMM yyyy') : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <RowMenu company={c} onAction={openAction} onInspect={inspect} />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta.pages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-4 py-3 text-sm">
              <span className="text-slate-500">Page {meta.page} of {meta.pages}</span>
              <div className="flex gap-2">
                <button
                  className="btn-ghost" disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >Previous</button>
                <button
                  className="btn-ghost" disabled={page >= meta.pages}
                  onClick={() => setPage((p) => p + 1)}
                >Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {}
      <Modal
        open={Boolean(pending)}
        onClose={() => setPending(null)}
        title={pending?.action === 'delete' ? 'Delete company' : 'Block company'}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setPending(null)}>Cancel</button>
            <button
              className="btn-danger"
              disabled={busy || (pending?.action === 'delete' && confirmText !== pending?.company?.name)}
              onClick={() => runAction(pending.company, pending.action, { reason, confirm: confirmText })}
            >
              {busy ? 'Working…' : pending?.action === 'delete' ? 'Delete permanently' : 'Block company'}
            </button>
          </>
        }
      >
        {pending?.action === 'delete' ? (
          <div className="space-y-4">
            <div className="flex gap-3 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-300">
              <FiAlertTriangle className="shrink-0 mt-0.5" size={18} />
              <p>
                This permanently deletes <strong>{pending.company.name}</strong> and every record
                belonging to it — employees, teams, projects, attendance, payroll and contracts.
                This cannot be undone.
              </p>
            </div>
            <div>
              <label className="label">
                Type <span className="font-mono text-slate-700 dark:text-slate-200">{pending.company.name}</span> to confirm
              </label>
              <input
                className="input" value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={pending.company.name}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Blocking <strong>{pending?.company?.name}</strong> immediately prevents everyone at
              that company from signing in. Their data is preserved and you can unblock at any time.
            </p>
            <div>
              <label className="label">Reason (shown to the company)</label>
              <textarea
                className="input" rows={3} value={reason} maxLength={300}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Payment overdue"
              />
            </div>
          </div>
        )}
      </Modal>

      {}
      <Modal
        open={Boolean(details)}
        onClose={() => setDetails(null)}
        title={details?.company?.name || 'Company details'}
        footer={<button className="btn-ghost" onClick={() => setDetails(null)}>Close</button>}
      >
        {details?.loading ? <Spinner label="Loading…" /> : details && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Company ID', details.company.companyCode],
                ['Status', details.company.status],
                ['Owner', details.company.ownerName],
                ['Email', details.company.email],
                ['Phone', details.company.phone || '—'],
                ['Industry', details.company.industry],
                ['Address', details.company.address || '—'],
                ['Registered', details.company.createdAt
                  ? format(new Date(details.company.createdAt), 'dd MMM yyyy') : '—'],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">{k}</p>
                  <p className="font-medium text-slate-700 dark:text-slate-200 break-words">{v}</p>
                </div>
              ))}
            </div>

            {details.company.blockedReason && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-300">
                <strong>Blocked:</strong> {details.company.blockedReason}
              </div>
            )}

            <div>
              <p className="label mb-2">Workspace contents</p>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(details.stats).map(([k, v]) => (
                  <div key={k} className="rounded-lg bg-slate-50 dark:bg-slate-800/50 px-3 py-2 text-center">
                    <p className="text-lg font-extrabold text-slate-800 dark:text-slate-100">{v}</p>
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">{k}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
