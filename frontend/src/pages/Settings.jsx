import { useEffect, useState } from 'react';
import { FiSun, FiMoon, FiSave, FiEdit2 } from 'react-icons/fi';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader.jsx';
import Spinner from '../components/Spinner.jsx';
import Badge from '../components/Badge.jsx';
import api from '../services/api.js';
import { useTheme } from '../context/ThemeContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const INDUSTRIES = [
  'Software Development', 'Information Technology', 'Marketing & Advertising',
  'E-Commerce', 'Education', 'Healthcare', 'Finance & Banking', 'Manufacturing',
  'Construction', 'Retail', 'Logistics', 'Consulting', 'Media & Entertainment',
  'Telecommunications', 'Real Estate', 'Other',
];

export default function Settings() {
  const { theme, toggle } = useTheme();
  const { user, isCompanyAdmin, setCompany } = useAuth();

  const [company, setLocalCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    api.get('/company/me')
      .then((r) => {
        setLocalCompany(r.data.data);
        setForm(r.data.data);
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      const r = await api.put('/company/me', {
        name: form.name,
        ownerName: form.ownerName,
        phone: form.phone,
        address: form.address,
        industry: form.industry,
        logo: form.logo,
        website: form.website,
      });
      const updated = r.data.data;
      setLocalCompany(updated);
      setForm(updated);
      setCompany({
        _id: updated._id, companyCode: updated.companyCode, name: updated.name,
        slug: updated.slug, logo: updated.logo, industry: updated.industry,
        status: updated.status,
      });
      setEditing(false);
      toast.success('Company profile updated');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Preferences & company profile" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-bold mb-4">Appearance</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Theme</p>
              <p className="text-sm text-slate-500">Switch between light and dark mode.</p>
            </div>
            <button onClick={toggle} className="btn-ghost border border-slate-200 dark:border-slate-700">
              {theme === 'dark' ? <><FiSun size={16} /> Light</> : <><FiMoon size={16} /> Dark</>}
            </button>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-bold mb-4">My Profile</h3>
          <div className="flex items-center gap-4">
            <img
              src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'User')}`}
              alt="" className="h-16 w-16 rounded-full bg-slate-200 object-cover"
            />
            <div className="min-w-0">
              <p className="font-semibold text-lg truncate">{user?.fullName}</p>
              <p className="text-sm text-slate-500">{user?.designation} · {user?.role}</p>
              <p className="text-sm text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">Company</h3>
            {isCompanyAdmin && company && !editing && (
              <button onClick={() => setEditing(true)} className="btn-ghost">
                <FiEdit2 size={15} /> Edit
              </button>
            )}
            {editing && (
              <div className="flex gap-2">
                <button
                  className="btn-ghost"
                  onClick={() => { setForm(company); setEditing(false); }}
                >Cancel</button>
                <button className="btn-primary" onClick={save} disabled={saving}>
                  <FiSave size={15} /> {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <Spinner label="Loading company…" />
          ) : !company ? (
            <p className="text-sm text-slate-400">Company details unavailable.</p>
          ) : editing ? (
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Company Name</label>
                <input className="input" value={form.name || ''} onChange={set('name')} />
              </div>
              <div>
                <label className="label">Owner Name</label>
                <input className="input" value={form.ownerName || ''} onChange={set('ownerName')} />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" value={form.phone || ''} onChange={set('phone')} />
              </div>
              <div>
                <label className="label">Industry</label>
                <select className="input" value={form.industry || 'Other'} onChange={set('industry')}>
                  {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Website</label>
                <input className="input" value={form.website || ''} onChange={set('website')} />
              </div>
              <div>
                <label className="label">Logo URL</label>
                <input className="input" value={form.logo || ''} onChange={set('logo')} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Address</label>
                <input className="input" value={form.address || ''} onChange={set('address')} />
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 mb-5">
                {company.logo
                  ? <img src={company.logo} alt="" className="h-14 w-14 rounded-xl object-cover bg-slate-100" />
                  : <div className="grid h-14 w-14 place-items-center rounded-xl bg-primary/10 text-primary text-xl font-extrabold">
                      {company.name.charAt(0).toUpperCase()}
                    </div>}
                <div className="min-w-0">
                  <p className="font-semibold text-lg truncate">{company.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-xs text-slate-400">{company.companyCode}</span>
                    <Badge value={company.status} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                {[
                  ['Owner', company.ownerName],
                  ['Email', company.email],
                  ['Phone', company.phone || '—'],
                  ['Industry', company.industry],
                  ['Website', company.website || '—'],
                  ['Address', company.address || '—'],
                  ['Company ID', company.companyCode],
                  ['Registered', company.createdAt ? format(new Date(company.createdAt), 'dd MMM yyyy') : '—'],
                ].map(([k, v]) => (
                  <div key={k} className="min-w-0">
                    <p className="text-slate-400 text-xs">{k}</p>
                    <p className="font-medium break-words">{v}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
