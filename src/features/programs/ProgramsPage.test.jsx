import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

// Mock the API client so the page never touches the network. The mock is shared
// with meta.js (it imports { api } from '@/app/api'), so ensureMeta can be pre-seeded.
vi.mock('@/app/api', () => ({
  api: {
    programs: vi.fn(),
    specialists: vi.fn(),
    createProgram: vi.fn(),
    updateProgramStatus: vi.fn(),
    deleteProgram: vi.fn(),
    enrollProgram: vi.fn(),
    programEnrollments: vi.fn(),
    updateProgramEnrollmentStatus: vi.fn(),
    deleteProgramEnrollment: vi.fn(),
    meta: vi.fn(),
  },
}))

import { api } from '@/app/api'
import { ensureMeta } from '@/app/meta'
import Programs from './ProgramsPage'

const META = {
  programStatus: ['مفتوح', 'مكتمل', 'معلق'],
  paymentMethod: ['مدى', 'فيزا', 'Apple Pay', 'تحويل بنكي'],
}

const instructor = { id: 1, title: 'د.', name: 'خالد السالم', specialty: 'استشاري نفسي' }

const openProgram = {
  id: 1,
  title: 'برنامج تأهيل المقبلين على الزواج',
  category: 'صحة نفسية',
  status: 'مفتوح',
  enrolled: 5,
  capacity: 10,
  sessions: 8,
  price: 300,
  rating: 4.5,
  startDate: '2026-09-01',
  description: 'برنامج تدريبي متكامل',
  instructor,
  cover: 'from-primary to-accent-soft',
}

const fullProgram = { ...openProgram, id: 2, title: 'برنامج ممتلئ', enrolled: 10, capacity: 10 }

describe('Programs page', () => {
  beforeAll(async () => {
    // Pre-seed the module-level meta cache so every render sees the labels
    // synchronously (useMeta reads it via useState(cache)).
    api.meta.mockResolvedValue(META)
    await ensureMeta()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    api.meta.mockResolvedValue(META)
    api.programs.mockResolvedValue([openProgram])
    api.specialists.mockResolvedValue([instructor])
    api.programEnrollments.mockResolvedValue([])
  })

  it('renders the fetched programs with their instructor', async () => {
    render(<Programs />)

    expect(await screen.findByText('برنامج تأهيل المقبلين على الزواج')).toBeInTheDocument()
    expect(screen.getByText('د. خالد السالم')).toBeInTheDocument()
    expect(screen.getByText('4.5')).toBeInTheDocument()
    expect(api.programs).toHaveBeenCalledTimes(1)
    expect(api.specialists).toHaveBeenCalledTimes(1)
  })

  it('runs the enroll flow: details → register → client name → API call + success notice', async () => {
    api.enrollProgram.mockResolvedValue({ id: 99, clientName: 'أحمد الشمري', status: 'بانتظار الدفع' })
    render(<Programs />)

    // Open the details modal, then the enroll modal.
    fireEvent.click(await screen.findByRole('button', { name: /عرض التفاصيل/ }))
    fireEvent.click(await screen.findByRole('button', { name: /سجّل الآن/ }))

    // Fill in the client and submit (payment method defaults to the first meta label).
    fireEvent.change(await screen.findByLabelText(/اسم العميل/), { target: { value: 'أحمد الشمري' } })
    fireEvent.click(screen.getByRole('button', { name: /تأكيد التسجيل/ }))

    await waitFor(() =>
      expect(api.enrollProgram).toHaveBeenCalledWith(1, { clientName: 'أحمد الشمري', method: 'مدى' }),
    )
    expect(await screen.findByText(/تم تسجيل «أحمد الشمري» في البرنامج بنجاح/)).toBeInTheDocument()

    // The save also triggers a silent reload so the seat counter refreshes.
    await waitFor(() => expect(api.programs).toHaveBeenCalledTimes(2))
  })

  it('keeps «سجّل الآن» enabled for unlimited-capacity programs (capacity 0)', async () => {
    api.programs.mockResolvedValue([{ ...openProgram, id: 3, title: 'برنامج بلا سقف', capacity: 0 }])
    render(<Programs />)

    fireEvent.click(await screen.findByRole('button', { name: /عرض التفاصيل/ }))
    const register = await screen.findByRole('button', { name: /سجّل الآن/ })
    expect(register).not.toBeDisabled()

    // It still opens the enroll modal — with an unlimited-seat note, not a seat count.
    fireEvent.click(register)
    expect(await screen.findByText(/مقاعد غير محدودة/)).toBeInTheDocument()
  })

  it('blocks registration once a program is full', async () => {
    api.programs.mockResolvedValue([fullProgram])
    render(<Programs />)

    fireEvent.click(await screen.findByRole('button', { name: /عرض التفاصيل/ }))
    const fullButton = await screen.findByRole('button', { name: /البرنامج ممتلئ/ })
    expect(fullButton).toBeDisabled()

    // A disabled button must never reach the API.
    fireEvent.click(fullButton)
    expect(api.enrollProgram).not.toHaveBeenCalled()
  })

  it('shows the conflict error inside the enroll modal and keeps it open', async () => {
    api.enrollProgram.mockRejectedValue(new Error('البرنامج ممتلئ، تعذر تسجيل مشارك إضافي'))
    render(<Programs />)

    fireEvent.click(await screen.findByRole('button', { name: /عرض التفاصيل/ }))
    fireEvent.click(await screen.findByRole('button', { name: /سجّل الآن/ }))
    fireEvent.change(await screen.findByLabelText(/اسم العميل/), { target: { value: 'فهد العتيبي' } })
    fireEvent.click(screen.getByRole('button', { name: /تأكيد التسجيل/ }))

    // The Arabic conflict message renders inline and the modal stays open —
    // no success notice, no close.
    expect(await screen.findByText('البرنامج ممتلئ، تعذر تسجيل مشارك إضافي')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /تأكيد التسجيل/ })).toBeInTheDocument()
    expect(screen.queryByText(/تم تسجيل/)).not.toBeInTheDocument()
  })
})
