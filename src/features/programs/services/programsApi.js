import { request, buildQuery } from '@/app/api/client'

export const programsApi = {
  programs: (params) => request(`/programs${buildQuery(params)}`),
  createProgram: (body) => request('/programs', { method: 'POST', body: JSON.stringify(body) }),
  updateProgramStatus: (id, status) =>
    request(`/programs/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteProgram: (id) => request(`/programs/${id}`, { method: 'DELETE' }),
  enrollProgram: (id, body) =>
    request(`/programs/${id}/enrollments`, { method: 'POST', body: JSON.stringify(body) }),
  programEnrollments: (id) => request(`/programs/${id}/enrollments`),
  updateProgramEnrollmentStatus: (id, enrollmentId, status) =>
    request(`/programs/${id}/enrollments/${enrollmentId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  deleteProgramEnrollment: (id, enrollmentId) =>
    request(`/programs/${id}/enrollments/${enrollmentId}`, { method: 'DELETE' }),
}
