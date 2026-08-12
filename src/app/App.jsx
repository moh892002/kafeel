import { Suspense } from 'react'
import { AuthProvider } from '@/features/auth/auth'
import AppRoutes from '@/app/routes'

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-surface text-primary">جاري التحميل...</div>}>
        <AppRoutes />
      </Suspense>
    </AuthProvider>
  )
}

export default App
