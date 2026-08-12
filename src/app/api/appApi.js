import { request } from './client'

/** App-level helpers with no single feature home. */
export const appApi = {
  /* ---------- Meta (enum labels) ---------- */
  meta: () => request('/meta'),
}
