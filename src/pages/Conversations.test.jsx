import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

// Mock the API client so the page never touches the network. Conversations does
// not use meta.js, so no cache pre-seeding is needed here. The last three mocks
// (clients/specialists/createConversation) serve the NewConversationModal —
// they define the module shape even though this suite never opens that modal.
vi.mock('../api', () => ({
  api: {
    conversations: vi.fn(),
    conversation: vi.fn(),
    sendMessage: vi.fn(),
    markConversationRead: vi.fn(),
    clients: vi.fn(),
    specialists: vi.fn(),
    createConversation: vi.fn(),
  },
}))

import { api } from '../api'
import Conversations from './Conversations'

const specialist = { id: 1, title: 'د.', name: 'خالد السالم', specialty: 'استشاري نفسي' }

const threadA = {
  id: 1,
  client: 'نورة القحطاني',
  specialist,
  unread: true,
  online: true,
  lastMessage: 'يسعدني إبلاغك أن الموعد يوم الخميس',
  lastTime: '2026-08-11T09:05:00Z',
  messages: [
    { id: 11, from: 'client', text: 'متى موعد الجلسة القادمة؟', time: '2026-08-11T09:00:00Z' },
    { id: 12, from: 'admin', text: 'يسعدني إبلاغك أن الموعد يوم الخميس', time: '2026-08-11T09:05:00Z' },
  ],
}

const threadB = {
  id: 2,
  client: 'سارة المطيري',
  specialist,
  unread: true,
  online: false,
  lastMessage: 'هل الجلسة متاحة غداً؟',
  lastTime: '2026-08-11T10:00:00Z',
  messages: [
    { id: 21, from: 'client', text: 'هل الجلسة متاحة غداً؟', time: '2026-08-11T10:00:00Z' },
    { id: 22, from: 'admin', text: 'نعم، الساعة 4 عصراً', time: '2026-08-11T10:05:00Z' },
  ],
}

describe('Conversations page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.conversations.mockResolvedValue([threadA])
    api.conversation.mockResolvedValue(threadA)
    // open() calls .catch() on this, so it must return a promise (backend: 204 → null).
    api.markConversationRead.mockResolvedValue(null)
  })

  it('renders the conversation list and auto-opens the first thread', async () => {
    render(<Conversations />)

    // List row — queried by role so it can't collide with the pane header,
    // which shows the same client name.
    expect(await screen.findByRole('button', { name: /نورة القحطاني/ })).toBeInTheDocument()
    expect(api.conversations).toHaveBeenCalledTimes(1)

    // Awaiting a pane message settles the whole auto-open chain (list → activeId
    // → thread fetch) inside an act-wrapped waitFor, so the assertion below is
    // stable and no residual update warns about act().
    expect(await screen.findByText('متى موعد الجلسة القادمة؟')).toBeInTheDocument()

    // Auto-open fetched the first thread.
    expect(api.conversation).toHaveBeenCalledWith(1)
    // The last message shows in both the list row and the pane bubble.
    expect(screen.getAllByText('يسعدني إبلاغك أن الموعد يوم الخميس')).toHaveLength(2)

    // Thread header: specialist, online status, message count. (The specialist
    // renders after a "·" separator, hence the regex.)
    expect(screen.getByText(/د\. خالد السالم/)).toBeInTheDocument()
    expect(screen.getByText('متصل الآن')).toBeInTheDocument()
    expect(screen.getByText('2 رسالة')).toBeInTheDocument()
  })

  it('loads a different thread on click and marks it read', async () => {
    api.conversations.mockResolvedValue([threadA, threadB])
    api.conversation.mockImplementation((id) => Promise.resolve(id === 1 ? threadA : threadB))
    render(<Conversations />)

    // The first thread auto-opens without marking anything read.
    await waitFor(() => expect(api.conversation).toHaveBeenCalledWith(1))
    expect(api.markConversationRead).not.toHaveBeenCalled()

    // Clicking the second row swaps the thread and marks it read. (waitFor
    // guards the post-click assertions against effect-batching changes.)
    fireEvent.click(await screen.findByRole('button', { name: /سارة المطيري/ }))
    await waitFor(() => expect(api.conversation).toHaveBeenCalledWith(2))
    expect(api.markConversationRead).toHaveBeenCalledWith(2)
    expect(await screen.findByText('نعم، الساعة 4 عصراً')).toBeInTheDocument()
  })

  it('sends a message: API call, message rendered, draft cleared, list updated', async () => {
    const sent = { id: 13, from: 'admin', text: 'تمام، ننتظرك الخميس', time: '2026-08-11T09:10:00Z' }
    api.sendMessage.mockResolvedValue(sent)
    render(<Conversations />)

    await screen.findByText('متى موعد الجلسة القادمة؟') // thread loaded

    const draft = screen.getByPlaceholderText('اكتب رسالتك...')
    fireEvent.change(draft, { target: { value: 'تمام، ننتظرك الخميس' } })
    fireEvent.click(screen.getByRole('button', { name: 'إرسال' }))

    expect(api.sendMessage).toHaveBeenCalledWith(1, 'تمام، ننتظرك الخميس')
    // The sent message appears in the pane bubble and as the list's new last message.
    expect(await screen.findAllByText('تمام، ننتظرك الخميس')).toHaveLength(2)
    expect(draft).toHaveValue('')
  })

  it('filters the list by unread', async () => {
    const readThread = { ...threadB, unread: false, lastMessage: 'شكراً لك' }
    api.conversations.mockResolvedValue([threadA, readThread])
    render(<Conversations />)

    await screen.findByRole('button', { name: /نورة القحطاني/ })
    // Settle the auto-open chain before interacting so the filter clicks are
    // not racing the thread fetch (also silences the act() warning).
    await screen.findByText('متى موعد الجلسة القادمة؟')

    // «غير مقروء» keeps only the unread thread.
    fireEvent.click(screen.getByRole('button', { name: /غير مقروء/ }))
    expect(screen.getByRole('button', { name: /نورة القحطاني/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /سارة المطيري/ })).not.toBeInTheDocument()

    // «الكل» restores it.
    fireEvent.click(screen.getByRole('button', { name: 'الكل' }))
    expect(screen.getByRole('button', { name: /سارة المطيري/ })).toBeInTheDocument()
  })

  it('shows the empty state when there are no conversations', async () => {
    api.conversations.mockResolvedValue([])
    render(<Conversations />)

    expect(await screen.findByText('لا توجد محادثات مطابقة')).toBeInTheDocument()
    // The mount fetch did run, but with no conversations there is nothing to
    // auto-open — the chat pane shows its placeholder and no thread is fetched.
    expect(api.conversations).toHaveBeenCalledTimes(1)
    expect(screen.getByText('اختر محادثة للبدء')).toBeInTheDocument()
    expect(api.conversation).not.toHaveBeenCalled()
  })

  it('shows the empty state when the search matches nothing, and restores on clear', async () => {
    render(<Conversations />)

    await screen.findByRole('button', { name: /نورة القحطاني/ })
    // Settle the auto-open chain before interacting (see the render test).
    await screen.findByText('متى موعد الجلسة القادمة؟')

    fireEvent.change(screen.getByPlaceholderText('ابحث في المحادثات...'), {
      target: { value: 'اسم غير موجود' },
    })

    expect(await screen.findByText('لا توجد محادثات مطابقة')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /نورة القحطاني/ })).not.toBeInTheDocument()
    // The empty state is scoped to the list — the filter chips survive.
    expect(screen.getByRole('button', { name: /غير مقروء/ })).toBeInTheDocument()

    // Clearing the search restores the row.
    fireEvent.change(screen.getByPlaceholderText('ابحث في المحادثات...'), { target: { value: '' } })
    expect(await screen.findByRole('button', { name: /نورة القحطاني/ })).toBeInTheDocument()
  })
})
