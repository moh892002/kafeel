import { request } from '@/app/api/client'

export const accountApi = {
  /* ---------- Settings (key/value store) ---------- */
  settings: () => request('/settings'),
  updateSettings: (values) => request('/settings', { method: 'PUT', body: JSON.stringify(values) }),
}
