import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import { navSections, superAdminNavSections } from './nav.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Sidebar({ open, onClose }) {
  const { company, isSuperAdmin } = useAuth();

  // The sidebar serves both workspaces: platform navigation for the Super
  // Admin, the full module list for a company.
  const sections = isSuperAdmin ? superAdminNavSections : navSections;
  const brandName = isSuperAdmin ? 'Platform' : (company?.name || 'Workspace');
  const brandSub = isSuperAdmin ? 'Super Admin Console' : (company?.companyCode || 'Office Management');
  const initial = (isSuperAdmin ? 'P' : (company?.name || 'W')).trim().charAt(0).toUpperCase();

  const content = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-200 dark:border-slate-800">
        {company?.logo ? (
          <img src={company.logo} alt="" className="h-9 w-9 rounded-lg object-cover bg-slate-100" />
        ) : (
          <div className={`grid h-9 w-9 place-items-center rounded-lg text-white font-extrabold ${isSuperAdmin ? 'bg-secondary' : 'bg-primary'}`}>
            {initial}
          </div>
        )}
        <div className="leading-tight min-w-0">
          <p className="font-extrabold text-slate-900 dark:text-white truncate" title={brandName}>{brandName}</p>
          <p className="text-[11px] text-slate-400 truncate">{brandSub}</p>
        </div>
        <button onClick={onClose} className="ml-auto lg:hidden text-slate-400 hover:text-slate-600">
          <FiX size={20} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {sections.map((sec) => (
          <div key={sec.title}>
            <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">{sec.title}</p>
            <div className="space-y-0.5">
              {sec.items.map((item) => (
                <NavLink
                  key={item.key}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      isActive
                        ? 'bg-primary/10 text-primary dark:bg-primary/20'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`
                  }
                >
                  <item.icon size={18} />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-200 dark:border-slate-800 p-4 text-[11px] text-slate-400">
        v2.0 · Multi-Tenant OMS · © {new Date().getFullYear()}
      </div>
    </div>
  );

  return (
    <>
      {}
      <aside className="hidden lg:block w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        {content}
      </aside>

      {}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 lg:hidden"
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'tween', duration: 0.25 }}
            >
              {content}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
