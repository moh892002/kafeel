import { request, buildQuery } from '@/app/api/client'

export const faqApi = {
  faqs: (params) => request(`/faqs${buildQuery(params)}`),
  createFaq: (body) => request('/faqs', { method: 'POST', body: JSON.stringify(body) }),
  updateFaq: (id, body) => request(`/faqs/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteFaq: (id) => request(`/faqs/${id}`, { method: 'DELETE' }),
}
