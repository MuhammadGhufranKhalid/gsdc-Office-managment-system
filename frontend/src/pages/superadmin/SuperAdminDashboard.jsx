import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid, LineChart, Line,
} from 'recharts';
import {
  FiBriefcase, FiShield, FiUsers, FiUserPlus, FiFolder, FiCheckCircle,
  FiSlash, FiPauseCircle, FiUserCheck, FiDollarSign, FiArrowRight,
} from 'react-icons/fi';
import { format } from 'date-fns';
import api from '../../services/api.js';
import PageHeader from '../../components/PageHeader.jsx';
import Spinner from '../../components/Spinner.jsx';
import Badge from '../../components/Badge.jsx';

const COLORS = ['#2563EB', '#22C55E', '#F59E0B', '#EF4444', '#06B6D4', '#8B5CF6', '#EC4899', '#14B8A6'];

const money = (v) => `PKR ${Number(v || 0).toLocaleString()}`;

function StatCard({ icon: Icon, label, value, tint, delay = 0, to }) {
  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="card p-5 h-full transition hover:shadow-soft"
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-sm text-slate-500 truncate">{label}</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">{value}</p>
        </div>
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tint}`}>
          <Icon size={20} />
        </div>
      </div>
    </motion.div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

function Panel({ title, action, children, className = '' }) {
  return (
    <div className={`card p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-800 dark:text-slate-100">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/super-admin/stats')
      .then((r) => setStats(r.data.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Loading platform statistics…" />;
  if (error) return <p className="text-danger">{error}</p>;
  if (!stats) return <p className="text-slate-500">Could not load platform data.</p>;

  const c = stats.cards;

  const cards = [
    { icon: FiBriefcase, label: 'Total Companies', value: c.totalCompanies, to: '/super-admin/companies',
      tint: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300' },
    { icon: FiCheckCircle, label: 'Active', value: c.activeCompanies, to: '/super-admin/companies?status=Active',
      tint: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300' },
    { icon: FiPauseCircle, label: 'Inactive', value: c.inactiveCompanies, to: '/super-admin/companies?status=Inactive',
      tint: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300' },
    { icon: FiSlash, label: 'Blocked', value: c.blockedCompanies, to: '/super-admin/companies?status=Blocked',
      tint: 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300' },
    { icon: FiShield, label: 'Company Admins', value: c.totalAdmins, to: '/super-admin/admins',
      tint: 'bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300' },
    { icon: FiUsers, label: 'Total Employees', value: c.totalEmployees,
      tint: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-300' },
    { icon: FiUserPlus, label: 'Total Teams', value: c.totalTeams,
      tint: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300' },
    { icon: FiFolder, label: 'Total Projects', value: c.totalProjects,
      tint: 'bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-300' },
  ];

  return (
    <>
      <PageHeader
        title="Platform Overview"
        subtitle="Everything happening across every registered company."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((s, i) => <StatCard key={s.label} {...s} delay={i * 0.04} />)}
      </div>

      {/* Attendance + payroll summaries */}
      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <Panel title="Attendance (platform-wide)">
          <div className="flex items-center gap-4 mb-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
              <FiUserCheck size={22} />
            </div>
            <div>
              <p className="text-2xl font-extrabold">{stats.attendance.presentRate}%</p>
              <p className="text-xs text-slate-500">
                present rate · {stats.attendance.total.toLocaleString()} records
              </p>
            </div>
          </div>
          {stats.attendance.byStatus.length ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stats.attendance.byStatus}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {stats.attendance.byStatus.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-slate-400">No attendance records yet.</p>}
        </Panel>

        <Panel title="Payroll (platform-wide)">
          <div className="flex items-center gap-4 mb-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300">
              <FiDollarSign size={22} />
            </div>
            <div>
              <p className="text-2xl font-extrabold">{money(stats.payroll.totalNet)}</p>
              <p className="text-xs text-slate-500">
                net disbursed · {stats.payroll.totalRecords.toLocaleString()} payslips
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ['Basic', stats.payroll.totalBasic],
              ['Bonus', stats.payroll.totalBonus],
              ['Deductions', stats.payroll.totalDeductions],
              ['Net', stats.payroll.totalNet],
            ].map(([label, v]) => (
              <div key={label} className="rounded-lg bg-slate-50 dark:bg-slate-800/50 px-3 py-2">
                <p className="text-[11px] text-slate-500">{label}</p>
                <p className="font-bold text-slate-800 dark:text-slate-100">{money(v)}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {}
      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <Panel title="Registrations (last 6 months)" className="lg:col-span-2">
          {stats.registrationTrend.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={stats.registrationTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-slate-400">No registrations in this period.</p>}
        </Panel>

        <Panel title="By industry">
          {stats.byIndustry.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={stats.byIndustry} dataKey="count" nameKey="name"
                  innerRadius={45} outerRadius={80} paddingAngle={2}
                >
                  {stats.byIndustry.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-slate-400">No data yet.</p>}
        </Panel>
      </div>

      {}
      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <Panel
          title="Recent registrations"
          className="lg:col-span-2"
          action={
            <Link to="/super-admin/companies" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
              View all <FiArrowRight size={12} />
            </Link>
          }
        >
          {stats.recentRegistrations.length ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {stats.recentRegistrations.map((c2) => (
                <Link
                  key={c2._id}
                  to={`/super-admin/companies?search=${encodeURIComponent(c2.name)}`}
                  className="flex items-center gap-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 -mx-2 px-2 rounded-lg transition"
                >
                  {c2.logo
                    ? <img src={c2.logo} alt="" className="h-9 w-9 rounded-lg object-cover bg-slate-100" />
                    : <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary font-bold">
                        {c2.name.charAt(0).toUpperCase()}
                      </div>}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">{c2.name}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {c2.companyCode} · {c2.industry}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge value={c2.status} />
                    <p className="mt-1 text-[11px] text-slate-400">
                      {c2.createdAt ? format(new Date(c2.createdAt), 'dd MMM yyyy') : '—'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : <p className="text-sm text-slate-400">No companies registered yet.</p>}
        </Panel>

        <Panel title="Largest companies">
          {stats.topCompanies.length ? (
            <div className="space-y-3">
              {stats.topCompanies.map((t, i) => (
                <div key={t.companyCode} className="flex items-center gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-500">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{t.name}</p>
                    <p className="text-[11px] text-slate-400">{t.companyCode}</p>
                  </div>
                  <span className="text-sm font-bold text-primary shrink-0">{t.employees}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-slate-400">No data yet.</p>}
        </Panel>
      </div>
    </>
  );
}
