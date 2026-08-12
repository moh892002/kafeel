import { request, buildQuery } from '@/app/api/client'

export const sessionsApi = {
  sessions: (params) => request(`/sessions${buildQuery(params)}`),
  createSession: (body) => request('/sessions', { method: 'POST', body: JSON.stringify(body) }),
  updateSessionStatus: (id, status) =>
    request(`/sessions/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteSession: (id) => request(`/sessions/${id}`, { method: 'DELETE' }),
}
