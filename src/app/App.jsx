import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AuthProvider, RequireAuth } from './auth'
import AppLayout from './components/layout/AppLayout'
import Placeholder from './pages/Placeholder'

// Heavy pages load on demand
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Specialists = lazy(() => import('./pages/Specialists'))
const SpecialistDetails = lazy(() => import('./pages/SpecialistDetails'))
const AddSpecialist = lazy(() => import('./pages/AddSpecialist'))
const Earnings = lazy(() => import('./pages/Earnings'))
const Transactions = lazy(() => import('./pages/Transactions'))
const Courses = lazy(() => import('./pages/Courses'))
const CourseForm = lazy(() => import('./pages/CourseForm'))
const CourseDetails = lazy(() => import('./pages/CourseDetails'))
const Sessions = lazy(() => import('./pages/Sessions'))
const Programs = lazy(() => import('./pages/Programs'))
const Meetings = lazy(() => import('./pages/Meetings'))
const Clients = lazy(() => import('./pages/Clients'))
const Conversations = lazy(() => import('./pages/Conversations'))
const Notifications = lazy(() => import('./pages/Notifications'))
const Faq = lazy(() => import('./pages/Faq'))
const Settings = lazy(() => import('./pages/Settings'))
const Profile = lazy(() => import('./pages/Profile'))
const Login = lazy(() => import('./pages/Login'))

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-surface text-primary">جاري التحميل...</div>}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
          <Route index element={<Dashboard />} />
          <Route path="/earnings" element={<Earnings />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/programs" element={<Programs />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/add" element={<CourseForm />} />
          <Route path="/courses/:id" element={<CourseDetails />} />
          <Route path="/courses/:id/edit" element={<CourseForm />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/meetings" element={<Meetings />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/specialists" element={<Specialists />} />
          <Route path="/specialists/add" element={<AddSpecialist />} />
          <Route path="/specialists/:id" element={<SpecialistDetails />} />
          <Route path="/conversations" element={<Conversations />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Dashboard />} />
        </Route>
        </Routes>
      </Suspense>
    </AuthProvider>
  )
}

export default App
