import { request, buildQuery } from '@/app/api/client'

export const financeApi = {
  /* ---------- Earnings ---------- */
  earningsSummary: (period) => request(`/earnings/summary${period ? `?period=${period}` : ''}`),

  /* ---------- Transactions ---------- */
  transactions: (params) => request(`/transactions${buildQuery(params)}`),
  createTransaction: (body) => request('/transactions', { method: 'POST', body: JSON.stringify(body) }),
  updateTransaction: (id, body) => request(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  updateTransactionStatus: (id, status) =>
    request(`/transactions/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteTransaction: (id) => request(`/transactions/${id}`, { method: 'DELETE' }),
}
