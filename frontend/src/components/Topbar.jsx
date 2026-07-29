import { useState } from 'react';
import { FiMenu, FiSearch, FiSun, FiMoon, FiBell, FiLogOut, FiChevronDown, FiShield } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Topbar({ onMenu }) {
  const { theme, toggle } = useTheme();
  const { user, company, isSuperAdmin, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur px-4">
      <button onClick={onMenu} className="lg:hidden text-slate-500 hover:text-slate-700">
        <FiMenu size={22} />
      </button>

      {/* Tenant indicator: makes it unambiguous whose data is on screen. */}
      {isSuperAdmin ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-white">
          <FiShield size={12} /> Platform Console
        </span>
      ) : company ? (
        <span className="hidden sm:inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary max-w-[240px]">
          <span className="truncate">{company.name}</span>
          <span className="font-mono text-[10px] opacity-70">{company.companyCode}</span>
        </span>
      ) : null}

      {!isSuperAdmin && (
        <div className="relative hidden md:block w-full max-w-xs">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            className="input pl-9"
            placeholder="Search employees, projects, clients…"
          />
        </div>
      )}

      <div className="ml-auto flex items-center gap-2">
        <button onClick={toggle} className="btn-ghost !px-2" title="Toggle theme">
          {theme === 'dark' ? <FiSun size={18} /> : <FiMoon size={18} />}
        </button>
        {!isSuperAdmin && (
          <button className="btn-ghost !px-2 relative" title="Notifications">
            <FiBell size={18} />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-danger" />
          </button>
        )}

        {}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <img
              src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'User')}`}
              alt="" className="h-8 w-8 rounded-full bg-slate-200 object-cover"
            />
            <div className="hidden md:block text-left leading-tight">
              <p className="text-sm font-semibold">{user?.fullName}</p>
              <p className="text-[11px] text-slate-400">{user?.role}</p>
            </div>
            <FiChevronDown className="text-slate-400" size={16} />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                className="absolute right-0 mt-2 w-52 card p-2"
              >
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-sm font-semibold">{user?.fullName}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                  <p className="mt-1 text-[11px] font-medium text-primary">
                    {isSuperAdmin ? 'Platform Super Admin' : `${user?.role} · ${company?.name || ''}`}
                  </p>
                </div>
                <button onClick={logout} className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger hover:bg-red-50 dark:hover:bg-red-900/20">
                  <FiLogOut size={16} /> Sign out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
