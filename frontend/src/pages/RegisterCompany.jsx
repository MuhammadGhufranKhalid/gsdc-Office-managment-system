import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiMail, FiLock, FiArrowRight, FiBriefcase, FiUser, FiPhone,
  FiMapPin, FiImage, FiCheck,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';

const INDUSTRIES = [
  'Software Development', 'Information Technology', 'Marketing & Advertising',
  'E-Commerce', 'Education', 'Healthcare', 'Finance & Banking', 'Manufacturing',
  'Construction', 'Retail', 'Logistics', 'Consulting', 'Media & Entertainment',
  'Telecommunications', 'Real Estate', 'Other',
];

const Field = ({ label, icon: Icon, required, children, hint }) => (
  <div>
    <label className="label">
      {label} {required && <span className="text-danger">*</span>}
    </label>
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />}
      {children}
    </div>
    {hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
  </div>
);

export default function RegisterCompany() {
  const { registerCompany } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    companyName: '', ownerName: '', email: '', password: '', confirmPassword: '',
    phone: '', address: '', industry: 'Software Development', logo: '',
  });

  // Real-Time Regex Input Filter Validation
  const set = (k) => (e) => {
    let value = e.target.value;

    if (k === 'ownerName') {
      // Sirf characters aur spaces allowed (No numbers/special characters)
      value = value.replace(/[^a-zA-Z\s]/g, "");
    } else if (k === 'phone') {
      // Sirf numbers allowed (No characters/special symbols except optional +)
      value = value.replace(/[^0-9+]/g, "");
    } else if (k === 'companyName') {
      // Both characters and numbers allowed (No special symbols)
      value = value.replace(/[^a-zA-Z0-9\s]/g, "");
    }

    setForm((f) => ({ ...f, [k]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const { company } = await registerCompany({
        companyName: form.companyName.trim(),
        ownerName: form.ownerName.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim(),
        address: form.address.trim(),
        industry: form.industry,
        logo: form.logo.trim(),
      });
      toast.success(`Welcome, ${company?.name || 'there'}! Your workspace is ready.`);
      navigate('/');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between bg-secondary text-white p-12 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-info/20 blur-3xl" />

        <div className="flex items-center gap-3 relative">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary font-extrabold text-xl">O</div>
          <div>
            <p className="font-extrabold text-lg">OMS Cloud</p>
            <p className="text-xs text-slate-400">Multi-Tenant Office Management</p>
          </div>
        </div>

        <div className="relative">
          <h1 className="text-4xl font-extrabold leading-tight">
            Your company,<br />your private workspace.
          </h1>
          <p className="mt-4 text-slate-300 max-w-md">
            Register once and get an isolated workspace with employees, teams, projects,
            attendance, payroll and analytics — visible only to you.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-slate-300">
            {[
              'Unlimited teams and employees',
              'Your data is never shared with other companies',
              'Ready to use the moment you sign up',
            ].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-success/20 text-success">
                  <FiCheck size={12} />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-slate-400">
          © {new Date().getFullYear()} OMS Cloud · Multi-Tenant SaaS Platform
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-10 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg py-6"
        >
          <h2 className="text-2xl font-extrabold">Register your company</h2>
          <p className="text-sm text-slate-500 mt-1">
            This creates your company and its administrator account.
          </p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <Field label="Company Name" icon={FiBriefcase} required>
              <input className="input pl-9" value={form.companyName}
                onChange={set('companyName')} placeholder="Acme Solutions" required
                minLength={2} maxLength={120} />
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Owner / Admin Name" icon={FiUser} required>
                <input className="input pl-9" value={form.ownerName}
                  onChange={set('ownerName')} placeholder="Jane Doe" required
                  minLength={2} maxLength={80} />
              </Field>
              <Field label="Phone Number" icon={FiPhone}>
                <input className="input pl-9" value={form.phone}
                  onChange={set('phone')} placeholder="+92 300 1234567" />
              </Field>
            </div>

            <Field label="Admin Email" icon={FiMail} required
              hint="You'll sign in with this address.">
              <input className="input pl-9" type="email" value={form.email}
                onChange={set('email')} placeholder="admin@acme.com" 
                required
                autoComplete="new-email"
                 />
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Password" icon={FiLock} required>
                <input className="input pl-9" type="password" value={form.password}
                  onChange={set('password')} required minLength={6} placeholder="At least 6 characters" />
              </Field>
              <Field label="Confirm Password" icon={FiLock} required>
                <input className="input pl-9" type="password" value={form.confirmPassword}
                  onChange={set('confirmPassword')} required minLength={6} placeholder="Repeat password"
                  autoComplete="new-password" />
              </Field>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Industry</label>
                <select className="input" value={form.industry} onChange={set('industry')}>
                  {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <Field label="Company Logo URL" icon={FiImage} hint="Optional.">
                <input className="input pl-9" value={form.logo}
                  onChange={set('logo')} placeholder="https://…" />
              </Field>
            </div>

            <Field label="Address" icon={FiMapPin}>
              <input className="input pl-9" value={form.address}
                onChange={set('address')} placeholder="City, Country" maxLength={250} />
            </Field>

            <button disabled={loading} className="btn-primary w-full !mt-6">
              {loading ? 'Creating your workspace…' : <>Create company <FiArrowRight size={16} /></>}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-500 text-center">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-primary hover:underline">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
