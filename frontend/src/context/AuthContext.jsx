import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../services/api.js';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const COMPANY_ADMIN_ROLES = ['Company Admin', 'Super Admin', 'CEO'];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [scope, setScope] = useState(null);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback((data) => {
    setUser(data.user);
    setCompany(data.company || null);
    setScope(data.scope || 'company');
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem('gsdc_token');
    setUser(null);
    setCompany(null);
    setScope(null);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('gsdc_token');
    if (!token) { setLoading(false); return; }
    api.get('/auth/me')
      .then((r) => applySession(r.data.data))
      .catch(() => clearSession())
      .finally(() => setLoading(false));
  }, [applySession, clearSession]);

  const login = async (email, password) => {
    const r = await api.post('/auth/login', { email, password });
    const data = r.data.data;
    localStorage.setItem('gsdc_token', data.token);
    applySession(data);
    return data;
  };
  const superAdminLogin = async (email, password) => {
    const r = await api.post('/auth/super-admin/login', { email, password });
    const data = r.data.data;
    localStorage.setItem('gsdc_token', data.token);
    applySession(data);
    return data;
  };

  const registerCompany = async (payload) => {
    const r = await api.post('/auth/register-company', payload);
    const data = r.data.data;
    localStorage.setItem('gsdc_token', data.token);
    applySession(data);
    return data;
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    clearSession();
  };

  const isSuperAdmin = scope === 'super';
  const isCompanyAdmin = scope === 'company' && COMPANY_ADMIN_ROLES.includes(user?.role);

  return (
    <AuthContext.Provider
      value={{
        user, company, scope, loading,
        isSuperAdmin, isCompanyAdmin,
        login, superAdminLogin, registerCompany, logout,
        setCompany,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
