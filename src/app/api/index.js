/**
 * The single public api surface for the app: feature slices (and the app-level
 * slice) reassembled into one object. Components import `{ api }` from here —
 * never from individual slices — so the helper set stays discoverable and the
 * dead-code guard in api.usage.test.js has one place to audit.
 */
import { appApi } from './appApi'
import { authApi } from '@/features/auth/services/authApi'
import { dashboardApi } from '@/features/dashboard/services/dashboardApi'
import { clientsApi } from '@/features/clients/services/clientsApi'
import { specialistsApi } from '@/features/specialists/services/specialistsApi'
import { sessionsApi } from '@/features/sessions/services/sessionsApi'
import { coursesApi } from '@/features/courses/services/coursesApi'
import { financeApi } from '@/features/finance/services/financeApi'
import { meetingsApi } from '@/features/meetings/services/meetingsApi'
import { conversationsApi } from '@/features/conversations/services/conversationsApi'
import { notificationsApi } from '@/features/notifications/services/notificationsApi'
import { faqApi } from '@/features/faq/services/faqApi'
import { programsApi } from '@/features/programs/services/programsApi'
import { accountApi } from '@/features/account/services/accountApi'

export const api = {
  ...dashboardApi,
  ...clientsApi,
  ...specialistsApi,
  ...sessionsApi,
  ...coursesApi,
  ...financeApi,
  ...meetingsApi,
  ...conversationsApi,
  ...notificationsApi,
  ...faqApi,
  ...programsApi,
  ...accountApi,
  ...appApi,
  ...authApi,
}

export { TOKEN_KEY } from './client'
