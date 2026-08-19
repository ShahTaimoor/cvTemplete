import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  // Auth now rides on an httpOnly cookie the browser attaches automatically
  // — there is no token in JS for this client to read or send itself.
  withCredentials: true,
});

const getCookie = (name) => {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

// Double-submit CSRF: the backend issues a readable (non-httpOnly) cookie
// on every response; state-changing requests must echo its value back in
// this header so the backend can confirm the request came from a context
// that could read the cookie (same-origin), not a cross-site form/script.
// Harmless to attach on GETs too — the backend only checks it for
// POST/PUT/PATCH/DELETE.
api.interceptors.request.use((config) => {
  const csrfToken = getCookie('csrf-token');
  if (csrfToken) config.headers['x-csrf-token'] = csrfToken;
  return config;
});

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

export const templateAPI = {
  list: () => api.get('/templates'),
  get: (slug) => api.get(`/templates/${slug}`),
};

export const resumeAPI = {
  list: () => api.get('/resumes'),
  get: (id) => api.get(`/resumes/${id}`),
  create: (data) => api.post('/resumes', data),
  update: (id, data) => api.put(`/resumes/${id}`, data),
  remove: (id) => api.delete(`/resumes/${id}`),
  duplicate: (id, data) => api.post(`/resumes/${id}/duplicate`, data),
  versions: (id) => api.get(`/resumes/${id}/versions`),
  saveVersion: (id, data) => api.post(`/resumes/${id}/versions`, data),
  restoreVersion: (id, versionId) => api.post(`/resumes/${id}/versions/${versionId}/restore`),
  docx: (id) => api.post(`/resumes/${id}/docx`, {}, { responseType: 'blob' }),
  pdf: (id) => api.post(`/resumes/${id}/pdf`, {}, { responseType: 'blob' }),
  atsCheck: (id) => api.post(`/resumes/${id}/ats-check`),
  share: (id) => api.post(`/resumes/${id}/share`),
  trackDownload: (id, format) => api.post(`/resumes/${id}/track-download`, { format }),
  analytics: (id) => api.get(`/resumes/${id}/analytics`),
  regenerateThumbnail: (id) => api.post(`/resumes/${id}/thumbnail`),
  dashboardInsight: () => api.get('/resumes/dashboard-insight'),
};

export const coverLetterAPI = {
  list: () => api.get('/cover-letters'),
  get: (id) => api.get(`/cover-letters/${id}`),
  create: (data) => api.post('/cover-letters', data),
  update: (id, data) => api.put(`/cover-letters/${id}`, data),
  remove: (id) => api.delete(`/cover-letters/${id}`),
  duplicate: (id, data) => api.post(`/cover-letters/${id}/duplicate`, data),
  versions: (id) => api.get(`/cover-letters/${id}/versions`),
  saveVersion: (id, data) => api.post(`/cover-letters/${id}/versions`, data),
  restoreVersion: (id, versionId) => api.post(`/cover-letters/${id}/versions/${versionId}/restore`),
  docx: (id) => api.post(`/cover-letters/${id}/docx`, {}, { responseType: 'blob' }),
  pdf: (id) => api.post(`/cover-letters/${id}/pdf`, {}, { responseType: 'blob' }),
};

export const subscriptionAPI = {
  plans: () => api.get('/subscriptions/plans'),
  current: () => api.get('/subscriptions/current'),
  upgrade: (planId) => api.post('/subscriptions/upgrade', { planId }),
};

export const uploadAPI = {
  photo: (file) => {
    const form = new FormData();
    form.append('photo', file);
    return api.post('/upload/photo', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const publicAPI = {
  share: (token) => api.get(`/public/share/${token}`),
};

export const downloadBlob = (data, filename, mime) => {
  const url = URL.createObjectURL(new Blob([data], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export default api;
