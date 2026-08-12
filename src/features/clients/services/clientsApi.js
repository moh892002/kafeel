import { request, buildQuery } from '@/app/api/client'

export const clientsApi = {
  clients: (params) => request(`/clients${buildQuery(params)}`),
}
