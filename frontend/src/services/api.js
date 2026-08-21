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

const RETRY_DELAY_MS = 800;
// server.js now opens the port immediately rather than waiting on Mongo
// (see its comments), so this is defense-in-depth for whatever startup gap
// remains, not the primary fix — bounded well past what's actually expected.
const MAX_RETRY_WINDOW_MS = 15000;

// Two distinct failure shapes are both safe to retry transparently, because
// in both cases the request never reached a route handler — nothing was
// written, so there's no double-submit risk:
//
// 1. Gateway-level failure: no response at all, or a 502/503/504. Most
//    notably right after `npm run dev` starts both servers, in the moment
//    before the backend's port is listening — Vite's dev proxy turns that
//    into a 502 rather than a raw network error (confirmed by direct
//    measurement); a response-less error is the same failure one layer
//    earlier (e.g. this dev server itself isn't up yet).
// 2. The CSRF-priming race: the csrf-token cookie is only set once some
//    /api response actually completes (see server.js), and the app fires a
//    priming GET (/auth/me) on load to get one. During the same startup
//    window above, that GET can itself be delayed (retried, or queued
//    behind mongoose's connection buffering — see config/db.js) long enough
//    for a write to fire before it resolves, going out with no token and
//    getting a hard 403 `invalid csrf token` from doubleCsrfProtection —
//    rejected in middleware, before any route handler runs.
//
// A genuine app-level error (anything the app itself returned after
// actually processing the request, including a real 500 or any other 403)
// is never retried here. Keeps retrying the same failure until it succeeds
// or MAX_RETRY_WINDOW_MS has elapsed since the first attempt.
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error;
    const isGatewayFailure = !response || [502, 503, 504].includes(response.status);
    const isCsrfPrimingRace = response?.status === 403 && response.data?.message === 'invalid csrf token';
    if (!config || !(isGatewayFailure || isCsrfPrimingRace)) {
      return Promise.reject(error);
    }
    const startedAt = config._retryStartedAt || Date.now();
    if (Date.now() - startedAt >= MAX_RETRY_WINDOW_MS) {
      return Promise.reject(error);
    }
    config._retryStartedAt = startedAt;
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    return api(config);
  }
);

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
  share: (id) => api.post(`/cover-letters/${id}/share`),
  analytics: (id) => api.get(`/cover-letters/${id}/analytics`),
  regenerateThumbnail: (id) => api.post(`/cover-letters/${id}/thumbnail`),
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
  shareCoverLetter: (token) => api.get(`/public/share/cover-letter/${token}`),
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
