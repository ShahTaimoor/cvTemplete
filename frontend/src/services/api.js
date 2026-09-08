import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  // Auth now rides on an httpOnly cookie the browser attaches automatically
  // — there is no token in JS for this client to read or send itself.
  withCredentials: true,
});

// Double-submit CSRF. The backend still sets a csrf-token cookie and still
// compares it against the x-csrf-token header on writes — but this app may be
// served from a different subdomain than the API (cv.* vs apicv.*), where
// document.cookie can't see that cookie at all. So instead of reading the
// cookie, we fetch the token once from GET /csrf-token and keep it in memory;
// the cookie itself still rides along automatically on credentialed requests,
// which is all the backend's check needs. Re-fetched on a 403 (see below).
let csrfToken = null;
let csrfPrimePromise = null;

const primeCsrfToken = () => {
  if (!csrfPrimePromise) {
    csrfPrimePromise = api
      .get('/csrf-token')
      .then(({ data }) => {
        csrfToken = data?.csrfToken || null;
      })
      .catch(() => {
        csrfToken = null;
      })
      .finally(() => {
        csrfPrimePromise = null;
      });
  }
  return csrfPrimePromise;
};

const WRITE_METHODS = ['post', 'put', 'patch', 'delete'];

api.interceptors.request.use(async (config) => {
  const isWrite = WRITE_METHODS.includes((config.method || 'get').toLowerCase());
  // The prime call is a GET, so it never re-enters this branch.
  if (isWrite && !csrfToken) await primeCsrfToken();
  if (csrfToken) config.headers['x-csrf-token'] = csrfToken;
  return config;
});

const RETRY_DELAY_MS = 800;
// server.js now opens the port immediately rather than waiting on Mongo
// (see its comments), so this is defense-in-depth for whatever startup gap
// remains, not the primary fix — bounded well past what's actually expected.
const MAX_RETRY_WINDOW_MS = 15000;

// Two failure shapes are retried transparently — in both cases the request
// never reached (or never mutated) a route handler, so there's no double-submit
// risk from replaying it:
//
// 1. Gateway-level failure: no response at all, or a 502/503/504 — e.g. right
//    after startup, before the backend's port is listening. Retried after a
//    fixed delay.
// 2. A 403 `invalid csrf token`: the in-memory token is missing or stale (the
//    backend rotated its secret, or this tab outlived the cookie). Drop it,
//    fetch a fresh one from /csrf-token, and retry straight away.
//
// Any other error — including a real 500 or any other 403 — is passed through.
// Both paths are bounded by MAX_RETRY_WINDOW_MS from the first attempt.
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error;
    const isGatewayFailure = !response || [502, 503, 504].includes(response.status);
    const isCsrfFailure = response?.status === 403 && response.data?.message === 'invalid csrf token';
    if (!config || !(isGatewayFailure || isCsrfFailure)) {
      return Promise.reject(error);
    }
    const startedAt = config._retryStartedAt || Date.now();
    if (Date.now() - startedAt >= MAX_RETRY_WINDOW_MS) {
      return Promise.reject(error);
    }
    config._retryStartedAt = startedAt;
    if (isCsrfFailure) {
      csrfToken = null;
      await primeCsrfToken();
    } else {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
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
