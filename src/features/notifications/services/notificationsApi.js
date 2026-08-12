import { request, buildQuery } from '@/app/api/client'

export const notificationsApi = {
  notifications: (params) => request(`/notifications${buildQuery(params)}`),
  markNotificationRead: (id, read) =>
    request(`/notifications/${id}/read`, { method: 'PATCH', body: JSON.stringify({ read }) }),
  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'PATCH' }),
  deleteNotification: (id) => request(`/notifications/${id}`, { method: 'DELETE' }),
}
