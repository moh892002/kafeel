import { request, buildQuery } from '@/app/api/client'

export const coursesApi = {
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
}
