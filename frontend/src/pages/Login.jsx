import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiArrowRight, FiShield } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { company } = await login(email, password);
      toast.success(company?.name ? `Welcome back to ${company.name}!` : 'Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {}
      <div className="hidden lg:flex flex-col justify-between bg-secondary text-white p-12 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/30 blur-3xl" />
        <div className="flex items-center gap-3 relative">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary font-extrabold text-xl">O</div>
          <div>
            <p className="font-extrabold text-lg">OMS Cloud</p>
            <p className="text-xs text-slate-400">Multi-Tenant Office Management</p>
          </div>
        </div>
        <div className="relative">
          <h1 className="text-4xl font-extrabold leading-tight">Run your company<br />from one place.</h1>
          <p className="mt-4 text-slate-300 max-w-md">
            Employees, teams, projects, clients, payroll, attendance and analytics — a
            private workspace for every company on the platform.
          </p>
        </div>
        <p className="relative text-xs text-slate-400">© {new Date().getFullYear()} OMS Cloud · Multi-Tenant SaaS Platform</p>
      </div>

      {}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <h2 className="text-2xl font-extrabold">Sign in</h2>
          <p className="text-sm text-slate-500 mt-1">Sign in to your company workspace.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <label className="label">Company Email</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input className="input pl-9" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input className="input pl-9" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
            </div>
            <button disabled={loading} className="btn-primary w-full">
              {loading ? 'Signing in…' : <>Sign in <FiArrowRight size={16} /></>}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-500 text-center">
            New here?{' '}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              Register your company
            </Link>
          </p>

          <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-5">
            <Link
              to="/super-admin/login"
              className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 hover:text-primary transition"
            >
              <FiShield size={14} /> Platform administrator sign in
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
