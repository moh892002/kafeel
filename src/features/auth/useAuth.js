/**
 * Auth context + hook. Kept in its own module (no component exports) so the
 * react-refresh "only-export-components" rule stays satisfied.
 */
import { createContext, useContext } from 'react'

export const AuthContext = createContext(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
