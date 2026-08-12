import { request, buildQuery } from '@/app/api/client'

export const meetingsApi = {
  meetings: (params) => request(`/meetings${buildQuery(params)}`),
  createMeeting: (body) => request('/meetings', { method: 'POST', body: JSON.stringify(body) }),
  updateMeetingStatus: (id, status) =>
    request(`/meetings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteMeeting: (id) => request(`/meetings/${id}`, { method: 'DELETE' }),
}
