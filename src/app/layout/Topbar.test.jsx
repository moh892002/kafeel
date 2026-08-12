import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

vi.mock('@/app/api', () => ({
  api: {
    notifications: vi.fn(),
    markNotificationRead: vi.fn(),
    markAllNotificationsRead: vi.fn(),
  },
}))

vi.mock('@/features/auth/useAuth', () => ({
  useAuth: () => ({ admin: { name: 'عبدالرحمن السالم' }, logout: vi.fn() }),
}))

import { api } from '@/app/api'
import Topbar from './Topbar'

const notif = (id, read, title, body) => ({
  id,
  read,
  title,
  body,
  type: 'الحجز',
  time: new Date(Date.now() - 60000).toISOString(),
})

const renderTopbar = () =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<Topbar onMenu={vi.fn()} />} />
        <Route path="/notifications" element={<div>NOTIF PAGE</div>} />
      </Routes>
    </MemoryRouter>
  )

describe('Topbar — notification bell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.notifications.mockResolvedValue([
      notif(1, false, 'حجز جديد', 'قامت منيرة بحجز جلسة استشارية'),
      notif(2, false, 'عملية دفع', 'تم إتمام عملية الدفع'),
      notif(3, true, 'تقييم جديد', 'أضاف الأخصائي تقييماً جديداً'),
    ])
    api.markNotificationRead.mockResolvedValue({})
    api.markAllNotificationsRead.mockResolvedValue(2)
  })

  it('shows the admin name from the auth session', async () => {
    renderTopbar()
    await screen.findByText('2') // drain the mount fetch inside act
    expect(screen.getByText('عبدالرحمن السالم')).toBeInTheDocument()
  })

  it('shows the unread count on the bell and lists notifications in the dropdown', async () => {
    renderTopbar()
    expect(await screen.findByText('2')).toBeInTheDocument() // badge = 2 unread

    fireEvent.click(screen.getByRole('button', { name: 'الإشعارات' }))

    expect(await screen.findByText('حجز جديد')).toBeInTheDocument()
    expect(screen.getByText('عملية دفع')).toBeInTheDocument()
    expect(screen.getByText('تقييم جديد')).toBeInTheDocument()
  })

  it('marks an unread notification read and navigates to the notifications page', async () => {
    renderTopbar()
    fireEvent.click(await screen.findByRole('button', { name: 'الإشعارات' }))

    fireEvent.click(await screen.findByText('حجز جديد'))

    await waitFor(() => expect(api.markNotificationRead).toHaveBeenCalledWith(1, true))
    expect(screen.getByText('NOTIF PAGE')).toBeInTheDocument()
  })

  it('mark-all-read flips every row and calls the API', async () => {
    renderTopbar()
    fireEvent.click(await screen.findByRole('button', { name: 'الإشعارات' }))

    fireEvent.click(screen.getByRole('button', { name: /تعيين الكل كمقروء/ }))

    await waitFor(() => expect(api.markAllNotificationsRead).toHaveBeenCalledTimes(1))
    // Badge disappears once nothing is unread.
    await waitFor(() => expect(screen.queryByText('2')).not.toBeInTheDocument())
  })

  it('view-all navigates to the notifications page', async () => {
    renderTopbar()
    fireEvent.click(await screen.findByRole('button', { name: 'الإشعارات' }))

    fireEvent.click(screen.getByRole('button', { name: /عرض كل الإشعارات/ }))

    expect(screen.getByText('NOTIF PAGE')).toBeInTheDocument()
  })

  it('keeps the panel inside the viewport on a narrow screen', async () => {
    window.innerWidth = 390
    renderTopbar()
    fireEvent.click(await screen.findByRole('button', { name: 'الإشعارات' }))
    await screen.findByText('حجز جديد')

    const panel = screen.getByTestId('notif-panel')
    const left = parseInt(panel.style.left, 10)
    const width = parseInt(panel.style.width, 10)
    const top = parseInt(panel.style.top, 10)

    expect(left).toBeGreaterThanOrEqual(0)
    expect(top).toBeGreaterThanOrEqual(0)
    expect(left + width).toBeLessThanOrEqual(window.innerWidth)
  })
})

describe('Topbar — quick search', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.notifications.mockResolvedValue([])
  })

  const renderWithRoutes = () =>
    render(
      <MemoryRouter initialEntries={['/']}>
        {/* Topbar stays mounted across navigation, like the real AppLayout. */}
        <Topbar onMenu={vi.fn()} />
        <Routes>
          <Route path="/" element={<div>HOME</div>} />
          <Route path="/transactions" element={<div>TRANSACTIONS PAGE</div>} />
          <Route path="/sessions" element={<div>SESSIONS PAGE</div>} />
        </Routes>
      </MemoryRouter>
    )

  it('lists matching destinations as you type and navigates on click', async () => {
    renderWithRoutes()
    fireEvent.change(screen.getByPlaceholderText('بحث سريع...'), { target: { value: 'المعام' } })

    expect(await screen.findByText('المعاملات')).toBeInTheDocument()
    expect(screen.queryByText('الجلسات')).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('المعاملات'))
    expect(screen.getByText('TRANSACTIONS PAGE')).toBeInTheDocument()
    // The panel closes and the query clears after navigating.
    expect(screen.queryByTestId('search-panel')).not.toBeInTheDocument()
  })

  it('shows the no-results state for a query that matches nothing', async () => {
    renderWithRoutes()
    fireEvent.change(screen.getByPlaceholderText('بحث سريع...'), { target: { value: 'zzzz' } })

    expect(await screen.findByText(/لا توجد نتائج مطابقة/)).toBeInTheDocument()
  })

  it('Enter navigates to the first match, Esc closes the panel without navigating', async () => {
    renderWithRoutes()
    const input = screen.getByPlaceholderText('بحث سريع...')

    fireEvent.change(input, { target: { value: 'الجلسات' } })
    await screen.findByText('الجلسات')
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(screen.getByText('SESSIONS PAGE')).toBeInTheDocument()

    // Reopen, then Esc closes without navigating.
    fireEvent.change(input, { target: { value: 'المعا' } })
    await screen.findByTestId('search-panel')
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(screen.queryByTestId('search-panel')).not.toBeInTheDocument()
    expect(screen.getByText('SESSIONS PAGE')).toBeInTheDocument() // still on sessions
  })
})
