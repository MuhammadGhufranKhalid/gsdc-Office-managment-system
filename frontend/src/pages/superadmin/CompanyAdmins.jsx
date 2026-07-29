import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiMail, FiPhone, FiRefreshCw } from 'react-icons/fi';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../../services/api.js';
import PageHeader from '../../components/PageHeader.jsx';
import Spinner from '../../components/Spinner.jsx';
import Badge from '../../components/Badge.jsx';

export default function CompanyAdmins() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/super-admin/admins', {
        params: { search: search || undefined, page, limit: 20 },
      });
      setRows(r.data.data);
      setMeta(r.data.meta);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <PageHeader
        title="Company Admins"
        subtitle={`${meta.total} administrator${meta.total === 1 ? '' : 's'} across all companies`}
      />

      <div className="card p-4 mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            className="input pl-9"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <button onClick={load} className="btn-ghost" title="Refresh">
          <FiRefreshCw size={16} />
        </button>
      </div>

      {loading ? (
        <Spinner label="Loading administrators…" />
      ) : rows.length === 0 ? (
        <div className="card p-12 text-center text-slate-500">No administrators found.</div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {rows.map((a, i) => (
              <motion.div
                key={a._id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="card p-5"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={a.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(a.fullName)}`}
                    alt="" className="h-11 w-11 rounded-full bg-slate-200 object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-800 dark:text-slate-100 truncate">{a.fullName}</p>
                    <p className="text-xs text-slate-400 truncate">{a.designation}</p>
                  </div>
                  <Badge value={a.role} />
                </div>

                <div className="mt-4 space-y-1.5 text-sm">
                  <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300 min-w-0">
                    <FiMail size={14} className="shrink-0 text-slate-400" />
                    <span className="truncate">{a.email}</span>
                  </p>
                  {a.phone && (
                    <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <FiPhone size={14} className="shrink-0 text-slate-400" /> {a.phone}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">Company</p>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
                      {a.companyId?.name || '—'}
                    </p>
                  </div>
                  <div className="text-right shrink-0 pl-3">
                    {a.companyId?.status && <Badge value={a.companyId.status} />}
                    <p className="mt-1 text-[11px] text-slate-400">
                      {a.createdAt ? format(new Date(a.createdAt), 'dd MMM yyyy') : '—'}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {meta.pages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-slate-500">Page {meta.page} of {meta.pages}</span>
              <div className="flex gap-2">
                <button className="btn-ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </button>
                <button className="btn-ghost" disabled={page >= meta.pages} onClick={() => setPage((p) => p + 1)}>
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
