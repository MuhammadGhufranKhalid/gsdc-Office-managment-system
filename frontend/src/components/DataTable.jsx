import { useEffect, useState, useCallback } from 'react';
import { FiSearch, FiChevronLeft, FiChevronRight, FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Spinner from './Spinner.jsx';
import { resource as resourceApi } from '../services/api.js';

export default function DataTable({ api, columns, searchable = true, filters = [], onCreate, onEdit, canWrite = true, title }) {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterState, setFilterState] = useState({});
  const [page, setPage] = useState(1);
  const [remoteFilterOptions, setRemoteFilterOptions] = useState({});

  useEffect(() => {
    const remote = filters.filter((f) => f.optionsFrom);
    if (!remote.length) return;

    let cancelled = false;
    Promise.all(
      remote.map((f) =>
        resourceApi(f.optionsFrom.resource)
          .list({ limit: 100, sort: f.optionsFrom.sort || 'name' })
          .then((r) => [f.key, r.data.map((row) => ({
            value: row._id,
            label: row[f.optionsFrom.labelKey || 'name'] || row.fullName || row._id,
          }))])
          .catch(() => [f.key, []])
      )
    ).then((entries) => {
      if (!cancelled) setRemoteFilterOptions(Object.fromEntries(entries));
    });

    return () => { cancelled = true; };
  }, [filters]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10, ...filterState };
      if (search) params.search = search;
      const res = await api.list(params);
      setRows(res.data);
      setMeta(res.meta || { page: 1, pages: 1, total: res.data.length });
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [api, page, search, filterState]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (row) => {
    if (!confirm('Delete this record? This cannot be undone.')) return;
    try {
      await api.remove(row._id);
      toast.success('Deleted');
      load();
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="card overflow-hidden">
      {}
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 dark:border-slate-800 p-4">
        {searchable && (
          <div className="relative flex-1 min-w-[200px]">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              value={search}
              onChange={(e) => { setPage(1); setSearch(e.target.value); }}
              className="input pl-9" placeholder="Search…"
            />
          </div>
        )}
        {filters.map((f) => (
          <select
            key={f.key}
            className="input w-auto"
            value={filterState[f.key] || ''}
            onChange={(e) => { setPage(1); setFilterState((s) => ({ ...s, [f.key]: e.target.value })); }}
          >
            <option value="">All {f.label}</option>
            {(f.optionsFrom ? (remoteFilterOptions[f.key] || []) : (f.options || []))
              .map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ))}
        {canWrite && onCreate && (
          <button onClick={onCreate} className="btn-primary ml-auto">
            <FiPlus size={16} /> New
          </button>
        )}
      </div>

      {}
      {loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <div className="py-16 text-center text-slate-400">No records found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-left text-xs uppercase tracking-wide text-slate-400">
                {columns.map((c) => <th key={c.key} className="px-4 py-3 font-semibold">{c.label}</th>)}
                {canWrite && <th className="px-4 py-3 text-right font-semibold">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <motion.tr
                  key={row._id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                >
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3 text-slate-700 dark:text-slate-200">
                      {c.render ? c.render(row) : (row[c.key] ?? '—')}
                    </td>
                  ))}
                  {canWrite && (
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {onEdit && (
                          <button onClick={() => onEdit(row)} className="btn-ghost !px-2" title="Edit">
                            <FiEdit2 size={15} />
                          </button>
                        )}
                        <button onClick={() => handleDelete(row)} className="btn-ghost !px-2 text-danger" title="Delete">
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </td>
                  )}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {}
      <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-4 py-3 text-sm text-slate-500">
        <span>{meta.total} records · page {meta.page} of {meta.pages}</span>
        <div className="flex gap-1">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-ghost !px-2 disabled:opacity-40">
            <FiChevronLeft size={16} />
          </button>
          <button disabled={page >= meta.pages} onClick={() => setPage((p) => p + 1)} className="btn-ghost !px-2 disabled:opacity-40">
            <FiChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
