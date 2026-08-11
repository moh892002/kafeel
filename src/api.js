/** Thin fetch client for the Kafeel backend (proxied via vite: /api → :8080). */

const BASE = '/api'

export const TOKEN_KEY = 'kafeel.token'

function authHeaders() {
  const token = localStorage.getItem(TOKEN_KEY)
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : undefined),
      ...authHeaders(),
    },
    ...options,
  })
  if (!res.ok) {
    let detail = `طلب فشل (${res.status})`
    try {
      const body = await res.json()
      if (body?.message) detail = body.message
    } catch {
      /* non-JSON error body */
    }
    // Attach the HTTP status so callers can branch on 404 etc. — the backend's
    // Arabic messages never contain the code, so string-matching them won't work.
    const err = new Error(detail)
    err.status = res.status
    // Expired/invalid session: drop the token and let the auth provider redirect
    // to the login page (login itself excluded — a wrong password must not bounce).
    if (res.status === 401 && !path.startsWith('/auth/login')) {
      localStorage.removeItem(TOKEN_KEY)
      window.dispatchEvent(new Event('kafeel:unauthorized'))
    }
    throw err
  }
  if (res.status === 204) return null
  return res.json()
}

const buildQuery = (params) => {
  const q = new URLSearchParams()
  Object.entries(params ?? {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.set(k, v)
  })
  const s = q.toString()
  return s ? `?${s}` : ''
}

export const api = {
  /* ---------- Dashboard ---------- */
  dashboard: () => request('/dashboard'),

  /* ---------- Clients ---------- */
  clients: (params) => request(`/clients${buildQuery(params)}`),

  /* ---------- Specialists ---------- */
  specialists: (params) => request(`/specialists${buildQuery(params)}`),
  specialistDetail: (id) => request(`/specialists/${id}/detail`),
  createSpecialist: (body) => request('/specialists', { method: 'POST', body: JSON.stringify(body) }),
  updateSpecialist: (id, body) => request(`/specialists/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  updateSpecialistStatus: (id, status) =>
    request(`/specialists/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteSpecialist: (id) => request(`/specialists/${id}`, { method: 'DELETE' }),

  /* ---------- Sessions ---------- */
  sessions: (params) => request(`/sessions${buildQuery(params)}`),
  createSession: (body) => request('/sessions', { method: 'POST', body: JSON.stringify(body) }),
  updateSessionStatus: (id, status) =>
    request(`/sessions/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteSession: (id) => request(`/sessions/${id}`, { method: 'DELETE' }),

  /* ---------- Courses ---------- */
  courses: (params) => request(`/courses${buildQuery(params)}`),
  course: (id) => request(`/courses/${id}`),
  createCourse: (body) => request('/courses', { method: 'POST', body: JSON.stringify(body) }),
  updateCourse: (id, body) => request(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  updateCourseStatus: (id, status) =>
    request(`/courses/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteCourse: (id) => request(`/courses/${id}`, { method: 'DELETE' }),
  addLesson: (id, body) => request(`/courses/${id}/lessons`, { method: 'POST', body: JSON.stringify(body) }),
  updateLesson: (id, lessonId, body) =>
    request(`/courses/${id}/lessons/${lessonId}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteLesson: (id, lessonId) => request(`/courses/${id}/lessons/${lessonId}`, { method: 'DELETE' }),
  enrollCourse: (id, body) =>
    request(`/courses/${id}/enrollments`, { method: 'POST', body: JSON.stringify(body) }),
  updateCourseEnrollmentStatus: (id, enrollmentId, status) =>
    request(`/courses/${id}/enrollments/${enrollmentId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteCourseEnrollment: (id, enrollmentId) =>
    request(`/courses/${id}/enrollments/${enrollmentId}`, { method: 'DELETE' }),

  /* ---------- Earnings ---------- */
  earningsSummary: (period) => request(`/earnings/summary${period ? `?period=${period}` : ''}`),

  /* ---------- Transactions ---------- */
  transactions: (params) => request(`/transactions${buildQuery(params)}`),
  createTransaction: (body) => request('/transactions', { method: 'POST', body: JSON.stringify(body) }),
  updateTransaction: (id, body) => request(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  updateTransactionStatus: (id, status) =>
    request(`/transactions/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteTransaction: (id) => request(`/transactions/${id}`, { method: 'DELETE' }),

  /* ---------- Meetings ---------- */
  meetings: (params) => request(`/meetings${buildQuery(params)}`),
  createMeeting: (body) => request('/meetings', { method: 'POST', body: JSON.stringify(body) }),
  updateMeetingStatus: (id, status) =>
    request(`/meetings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteMeeting: (id) => request(`/meetings/${id}`, { method: 'DELETE' }),

  /* ---------- Conversations ---------- */
  conversations: (params) => request(`/conversations${buildQuery(params)}`),
  conversation: (id) => request(`/conversations/${id}`),
  createConversation: (body) => request('/conversations', { method: 'POST', body: JSON.stringify(body) }),
  sendMessage: (id, text) =>
    request(`/conversations/${id}/messages`, { method: 'POST', body: JSON.stringify({ text }) }),
  markConversationRead: (id) => request(`/conversations/${id}/read`, { method: 'PATCH' }),

  /* ---------- Notifications ---------- */
  notifications: (params) => request(`/notifications${buildQuery(params)}`),
  markNotificationRead: (id, read) =>
    request(`/notifications/${id}/read`, { method: 'PATCH', body: JSON.stringify({ read }) }),
  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'PATCH' }),
  deleteNotification: (id) => request(`/notifications/${id}`, { method: 'DELETE' }),

  /* ---------- FAQ ---------- */
  faqs: (params) => request(`/faqs${buildQuery(params)}`),
  createFaq: (body) => request('/faqs', { method: 'POST', body: JSON.stringify(body) }),
  updateFaq: (id, body) => request(`/faqs/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteFaq: (id) => request(`/faqs/${id}`, { method: 'DELETE' }),

  /* ---------- Programs ---------- */
  programs: (params) => request(`/programs${buildQuery(params)}`),
  createProgram: (body) => request('/programs', { method: 'POST', body: JSON.stringify(body) }),
  updateProgramStatus: (id, status) =>
    request(`/programs/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteProgram: (id) => request(`/programs/${id}`, { method: 'DELETE' }),
  enrollProgram: (id, body) =>
    request(`/programs/${id}/enrollments`, { method: 'POST', body: JSON.stringify(body) }),

  /* ---------- Settings (key/value store) ---------- */
  settings: () => request('/settings'),
  updateSettings: (values) => request('/settings', { method: 'PUT', body: JSON.stringify(values) }),

  /* ---------- Meta (enum labels) ---------- */
  meta: () => request('/meta'),

  /* ---------- Auth ---------- */
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => request('/auth/me'),
  changePassword: (currentPassword, newPassword) =>
    request('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }),
  loginSessions: () => request('/auth/sessions'),
  terminateSession: (id) => request(`/auth/sessions/${id}`, { method: 'DELETE' }),
}
