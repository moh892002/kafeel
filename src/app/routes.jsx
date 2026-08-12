import { lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import { RequireAuth } from '@/features/auth/auth'
import AppLayout from '@/app/layout/AppLayout'
import NotFoundPage from '@/app/NotFoundPage'

// Heavy pages load on demand
const Dashboard = lazy(() => import('@/features/dashboard/DashboardPage'))
const Specialists = lazy(() => import('@/features/specialists/SpecialistsPage'))
const SpecialistDetails = lazy(() => import('@/features/specialists/SpecialistDetailsPage'))
const AddSpecialist = lazy(() => import('@/features/specialists/AddSpecialistPage'))
const Earnings = lazy(() => import('@/features/finance/EarningsPage'))
const Transactions = lazy(() => import('@/features/finance/TransactionsPage'))
const Courses = lazy(() => import('@/features/courses/CoursesPage'))
const CourseForm = lazy(() => import('@/features/courses/CourseFormPage'))
const CourseDetails = lazy(() => import('@/features/courses/CourseDetailsPage'))
const Sessions = lazy(() => import('@/features/sessions/SessionsPage'))
const Programs = lazy(() => import('@/features/programs/ProgramsPage'))
const Meetings = lazy(() => import('@/features/meetings/MeetingsPage'))
const Clients = lazy(() => import('@/features/clients/ClientsPage'))
const Conversations = lazy(() => import('@/features/conversations/ConversationsPage'))
const Notifications = lazy(() => import('@/features/notifications/NotificationsPage'))
const Faq = lazy(() => import('@/features/faq/FaqPage'))
const Settings = lazy(() => import('@/features/account/SettingsPage'))
const Profile = lazy(() => import('@/features/account/ProfilePage'))
const Login = lazy(() => import('@/features/auth/LoginPage'))

/**
 * Data-driven route table — each entry maps straight to a <Route>; the index
 * route is expressed as `index: true`. Adding a page = adding one line here.
 */
const APP_ROUTES = [
  { path: '/earnings', element: <Earnings /> },
  { path: '/transactions', element: <Transactions /> },
  { path: '/programs', element: <Programs /> },
  { path: '/courses', element: <Courses /> },
  { path: '/courses/add', element: <CourseForm /> },
  { path: '/courses/:id', element: <CourseDetails /> },
  { path: '/courses/:id/edit', element: <CourseForm /> },
  { path: '/sessions', element: <Sessions /> },
  { path: '/meetings', element: <Meetings /> },
  { path: '/clients', element: <Clients /> },
  { path: '/specialists', element: <Specialists /> },
  { path: '/specialists/add', element: <AddSpecialist /> },
  { path: '/specialists/:id', element: <SpecialistDetails /> },
  { path: '/conversations', element: <Conversations /> },
  { path: '/notifications', element: <Notifications /> },
  { path: '/faq', element: <Faq /> },
  { path: '/settings', element: <Settings /> },
  { path: '/profile', element: <Profile /> },
]

/**
 * The full route tree. Everything except /login lives behind RequireAuth +
 * the app shell; the dashboard is the layout's index route and the catch-all
 * NotFoundPage sits inside that layout group. Exported as a component so App
 * only composes providers.
 */
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
        <Route index element={<Dashboard />} />
        {APP_ROUTES.map((r) => (
          <Route key={r.path} path={r.path} element={r.element} />
        ))}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
