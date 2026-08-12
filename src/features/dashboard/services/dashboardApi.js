import { request } from '@/app/api/client'

export const dashboardApi = {
  dashboard: () => request('/dashboard'),
}
