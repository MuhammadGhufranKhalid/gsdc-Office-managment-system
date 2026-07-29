import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiArrowRight, FiShield, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';


export default function SuperAdminLogin() {
  const { superAdminLogin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await superAdminLogin(email, password);
      toast.success('Signed in to the platform console');
      navigate('/super-admin');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-secondary p-6 relative overflow-hidden">
      <div className="absolute -top-32 -left-32 h-[28rem] w-[28rem] rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -bottom-40 -right-24 h-[26rem] w-[26rem] rounded-full bg-info/10 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-sm"
      >
        <div className="flex flex-col items-center text-center text-white">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary shadow-soft">
            <FiShield size={26} />
          </div>
          <h1 className="mt-5 text-2xl font-extrabold">Super Admin Console</h1>
          <p className="mt-1 text-sm text-slate-400">
            Platform-level access. Manage every registered company.
          </p>
        </div>

        <div className="mt-8 rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-soft">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  className="input pl-9" type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="superadmin@oms.com" required autoFocus
                />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  className="input pl-9" type="password" value={password}
                  onChange={(e) => setPassword(e.target.value)} required
                />
              </div>
            </div>
            <button disabled={loading} className="btn-primary w-full">
              {loading ? 'Signing in…' : <>Enter console <FiArrowRight size={16} /></>}
            </button>
          </form>
        </div>

        <Link
          to="/login"
          className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-white transition"
        >
          <FiArrowLeft size={14} /> Back to company sign in
        </Link>
      </motion.div>
    </div>
  );
}
