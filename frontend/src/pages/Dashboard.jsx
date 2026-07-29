import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from 'recharts';
import {
  FiUsers, FiFolder, FiBriefcase, FiCheckSquare, FiLayers, FiClipboard,
  FiUserPlus, FiUserCheck, FiDollarSign, FiFileText,
} from 'react-icons/fi';
import { format } from 'date-fns';
import api from '../services/api.js';
import PageHeader from '../components/PageHeader.jsx';
import Spinner from '../components/Spinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const CHART_COLORS = ['#2563EB', '#22C55E', '#F59E0B', '#EF4444', '#06B6D4', '#8B5CF6'];

function StatCard({ icon: Icon, label, value, tint, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="card p-5"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">{value}</p>
        </div>
        <div className={`grid h-11 w-11 place-items-center rounded-xl ${tint}`}>
          <Icon size={20} />
        </div>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { user, company } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats')
      .then((r) => setStats(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Loading dashboard…" />;
  if (!stats) return <p className="text-slate-500">Could not load dashboard data.</p>;

  const c = stats.cards;
  const money = (v) => `PKR ${Number(v || 0).toLocaleString()}`;

  const cards = [
    { icon: FiUsers, label: 'Total Employees', value: c.totalEmployees, tint: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300' },
    { icon: FiUserPlus, label: 'Teams', value: c.totalTeams, tint: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300' },
    { icon: FiLayers, label: 'Departments', value: c.totalDepartments, tint: 'bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300' },
    { icon: FiFolder, label: 'Active Projects', value: c.activeProjects, tint: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300' },
    { icon: FiBriefcase, label: 'Clients', value: c.totalClients, tint: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300' },
    { icon: FiCheckSquare, label: 'Tasks', value: c.totalTasks, tint: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-300' },
    { icon: FiUserCheck, label: 'Present Today', value: c.presentToday, tint: 'bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-300' },
    { icon: FiClipboard, label: 'Pending Leaves', value: c.pendingLeaves, tint: 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300' },
    { icon: FiFileText, label: 'Active Contracts', value: c.activeContracts, tint: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
    { icon: FiDollarSign, label: 'Payroll (net)', value: money(stats.payroll?.totalNet), tint: 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300' },
  ];

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user?.fullName?.split(' ')[0]} 👋`}
        subtitle={`Here's what's happening across ${company?.name || 'your company'} today.`}
      />

      {}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map((card, i) => <StatCard key={card.label} {...card} delay={i * 0.04} />)}
      </div>

      {/* Attendance + payroll breakdown */}
      <div className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-bold mb-4">Attendance</h3>
          <div className="flex items-center gap-4 mb-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
              <FiUserCheck size={22} />
            </div>
            <div>
              <p className="text-2xl font-extrabold">{stats.attendance?.presentRate ?? 0}%</p>
              <p className="text-xs text-slate-500">
                present rate · {(stats.attendance?.total ?? 0).toLocaleString()} records
              </p>
            </div>
          </div>
          {stats.attendance?.byStatus?.length ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stats.attendance.byStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {stats.attendance.byStatus.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-slate-400">No attendance records yet.</p>}
        </div>

        <div className="card p-5">
          <h3 className="font-bold mb-4">Payroll</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ['Basic', stats.payroll?.totalBasic],
              ['Bonus', stats.payroll?.totalBonus],
              ['Deductions', stats.payroll?.totalDeductions],
              ['Net paid', stats.payroll?.totalNet],
            ].map(([label, v]) => (
              <div key={label} className="rounded-lg bg-slate-50 dark:bg-slate-800/50 px-3 py-2.5">
                <p className="text-[11px] text-slate-500">{label}</p>
                <p className="font-bold text-slate-800 dark:text-slate-100">{money(v)}</p>
              </div>
            ))}
          </div>
          {stats.payroll?.byStatus?.length ? (
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={stats.payroll.byStatus} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3}>
                  {stats.payroll.byStatus.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="mt-4 text-sm text-slate-400">No payroll records yet.</p>}
        </div>
      </div>

      {}
      <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="card p-5 xl:col-span-2">
          <h3 className="font-bold mb-4">Employees by Team</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats.byTeam || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" height={70} interval={0} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#6366F1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="card p-5 xl:col-span-2">
          <h3 className="font-bold mb-4">Employees by Department</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.byDepartment}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" height={70} interval={0} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#2563EB" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="font-bold mb-4">Project Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={stats.projectStatus} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={85} label>
                {stats.projectStatus.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {}
      <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="card p-5">
          <h3 className="font-bold mb-4">Task Status</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={stats.taskStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3}>
                {stats.taskStatus.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5 xl:col-span-2">
          <h3 className="font-bold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {stats.recentActivity?.length ? stats.recentActivity.map((a) => (
              <div key={a._id} className="flex items-center gap-3 text-sm">
                <img
                  src={a.actor?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(a.actor?.fullName || 'System')}`}
                  alt="" className="h-8 w-8 rounded-full bg-slate-200 object-cover"
                />
                <div className="flex-1">
                  <span className="font-semibold">{a.actor?.fullName || 'System'}</span>
                  <span className="text-slate-500"> {a.action} a {a.entityType.toLowerCase()}</span>
                </div>
                <span className="text-xs text-slate-400">{format(new Date(a.createdAt), 'dd MMM, HH:mm')}</span>
              </div>
            )) : <p className="text-sm text-slate-400">No recent activity.</p>}
          </div>
        </div>
      </div>
    </>
  );
}
