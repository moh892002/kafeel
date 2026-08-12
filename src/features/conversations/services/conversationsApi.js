import { request, buildQuery } from '@/app/api/client'

export const conversationsApi = {
  conversations: (params) => request(`/conversations${buildQuery(params)}`),
  conversation: (id) => request(`/conversations/${id}`),
  createConversation: (body) => request('/conversations', { method: 'POST', body: JSON.stringify(body) }),
  sendMessage: (id, text) =>
    request(`/conversations/${id}/messages`, { method: 'POST', body: JSON.stringify({ text }) }),
  markConversationRead: (id) => request(`/conversations/${id}/read`, { method: 'PATCH' }),
}
