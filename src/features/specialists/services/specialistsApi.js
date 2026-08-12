import { request, buildQuery } from '@/app/api/client'

export const specialistsApi = {
  specialists: (params) => request(`/specialists${buildQuery(params)}`),
  specialistDetail: (id) => request(`/specialists/${id}/detail`),
  createSpecialist: (body) => request('/specialists', { method: 'POST', body: JSON.stringify(body) }),
  updateSpecialist: (id, body) => request(`/specialists/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  updateSpecialistStatus: (id, status) =>
    request(`/specialists/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteSpecialist: (id) => request(`/specialists/${id}`, { method: 'DELETE' }),
}
