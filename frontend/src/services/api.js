import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gsdc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Request failed';
    if (error.response?.status === 401 && !location.pathname.includes('/login')) {
      localStorage.removeItem('gsdc_token');
    }
    return Promise.reject({ ...error, message });
  }
);

export const resource = (name) => ({
  list: (params) => api.get(`/${name}`, { params }).then((r) => r.data),
  get: (id) => api.get(`/${name}/${id}`).then((r) => r.data),
  create: (body) => api.post(`/${name}`, body).then((r) => r.data),
  update: (id, body) => api.put(`/${name}/${id}`, body).then((r) => r.data),
  remove: (id) => api.delete(`/${name}/${id}`).then((r) => r.data),
});

export default api;