import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

vi.mock('../../api', () => ({
  api: {
    notifications: vi.fn(),
    markNotificationRead: vi.fn(),
    markAllNotificationsRead: vi.fn(),
  },
}))

vi.mock('../../useAuth', () => ({
  useAuth: () => ({ admin: { name: 'عبدالرحمن السالم' }, logout: vi.fn() }),
}))

import { api } from '../../api'
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
