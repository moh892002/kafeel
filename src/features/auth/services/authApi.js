import { request } from '@/app/api/client'

export const authApi = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => request('/auth/me'),
  changePassword: (currentPassword, newPassword) =>
    request('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }),
  updateProfile: (name, email) =>
    request('/auth/profile', { method: 'PUT', body: JSON.stringify({ name, email }) }),
  loginSessions: () => request('/auth/sessions'),
  terminateSession: (id) => request(`/auth/sessions/${id}`, { method: 'DELETE' }),
}
