import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { FiDownload } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../services/api.js';
import PageHeader from '../components/PageHeader.jsx';
import Spinner from '../components/Spinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const COLORS = ['#2563EB', '#22C55E', '#F59E0B', '#EF4444', '#06B6D4', '#8B5CF6'];

export default function Reports() {
  const { company } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats').then((r) => setStats(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const exportCsv = () => {
    if (!stats) return;
    const rows = [['Department', 'Employees'], ...stats.byDepartment.map((d) => [d.name, d.count])];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const slug = (company?.name || 'company').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    a.href = url; a.download = `${slug}-department-report.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported');
  };

  if (loading) return <Spinner label="Building reports…" />;
  if (!stats) return <p className="text-slate-500">No report data.</p>;

  const c = stats.cards;
  const summary = [
    { label: 'Total Employees', value: c.totalEmployees },
    { label: 'Active Employees', value: c.activeEmployees },
    { label: 'Total Projects', value: c.totalProjects },
    { label: 'Completed Projects', value: c.completedProjects },
  ];

  return (
    <>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Company-wide insights"
        action={<button onClick={exportCsv} className="btn-primary"><FiDownload size={16} /> Export CSV</button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summary.map((s) => (
          <div key={s.label} className="card p-5">
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className="mt-1 text-3xl font-extrabold text-primary">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-bold mb-4">Headcount by Department</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={stats.byDepartment} layout="vertical" margin={{ left: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
              <Tooltip />
              <Bar dataKey="count" fill="#2563EB" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="font-bold mb-4">Projects vs Tasks Distribution</h3>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie data={stats.projectStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label>
                {stats.projectStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}
