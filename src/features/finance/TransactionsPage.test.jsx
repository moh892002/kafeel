import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

// Mock the API client so the page never touches the network. The mock is shared
// with meta.js (it imports { api } from '@/app/api'), so ensureMeta can be pre-seeded.
vi.mock('@/app/api', () => ({
  api: {
    transactions: vi.fn(),
    createTransaction: vi.fn(),
    updateTransaction: vi.fn(),
    updateTransactionStatus: vi.fn(),
    deleteTransaction: vi.fn(),
    clients: vi.fn(),
    meta: vi.fn(),
  },
}))

import { api } from '@/app/api'
import { ensureMeta } from '@/app/meta'
import Transactions from './TransactionsPage'

const META = {
  paymentMethod: ['مدى', 'فيزا', 'تحويل بنكي'],
  transactionStatus: ['مكتمل', 'قيد المعالجة', 'مسترد'],
}

const tx = {
  id: 1,
  reference: 'TXN-0001',
  client: 'نورة القحطاني',
  clientId: 5,
  service: 'جلسة استشارية',
  method: 'مدى',
  date: '2026-08-01',
  amount: 350,
  commission: 52.5,
  status: 'مكتمل',
}

describe('Transactions page', () => {
  beforeAll(async () => {
    // Pre-seed the module-level meta cache so every render sees the labels
    // synchronously (useMeta reads it via useState(cache)).
    api.meta.mockResolvedValue(META)
    await ensureMeta()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    api.meta.mockResolvedValue(META)
    api.transactions.mockResolvedValue([tx])
    api.clients.mockResolvedValue([{ id: 5, name: 'نورة القحطاني' }])
  })

  it('renders the fetched transactions in the table', async () => {
    render(<Transactions />)

    expect(await screen.findByText('TXN-0001')).toBeInTheDocument()
    expect(screen.getByText('نورة القحطاني')).toBeInTheDocument()
    expect(screen.getByText('جلسة استشارية')).toBeInTheDocument()
    // The amounts appear in both the summary cards and the table rows.
    expect(screen.getAllByText('350 ر.س').length).toBeGreaterThan(0)
    expect(screen.getAllByText('52.5 ر.س').length).toBeGreaterThan(0)
    // The list call carries the server-side filter params (buildQuery runs
    // inside api.js, so the mock receives the raw object).
    await waitFor(() =>
      expect(api.transactions).toHaveBeenCalledWith({
        search: undefined,
        status: undefined,
        from: undefined,
        to: undefined,
      }),
    )
  })

  it('PATCHes the status when the row select changes', async () => {
    render(<Transactions />)

    await screen.findByText('TXN-0001')

    fireEvent.change(screen.getByDisplayValue('مكتمل'), { target: { value: 'مسترد' } })

    await waitFor(() => expect(api.updateTransactionStatus).toHaveBeenCalledWith(1, 'مسترد'))
    // The row reflects the new status after the optimistic local update.
    expect(await screen.findByDisplayValue('مسترد')).toBeInTheDocument()
  })

  it('deletes a transaction through the confirm modal', async () => {
    render(<Transactions />)

    await screen.findByText('TXN-0001')

    fireEvent.click(screen.getByTitle('حذف'))
    fireEvent.click(await screen.findByRole('button', { name: /حذف نهائي/ }))

    await waitFor(() => expect(api.deleteTransaction).toHaveBeenCalledWith(1))
    expect(await screen.findByText('لا توجد معاملات مطابقة')).toBeInTheDocument()
  })

  it('creates a transaction from the modal', async () => {
    api.createTransaction.mockResolvedValue({ ...tx, id: 2, reference: 'TXN-0002' })
    render(<Transactions />)

    await screen.findByText('TXN-0001')

    fireEvent.click(screen.getByRole('button', { name: 'إضافة معاملة' }))
    fireEvent.change(await screen.findByLabelText(/الخدمة/), { target: { value: 'جلسة مكثفة' } })
    fireEvent.change(screen.getByLabelText(/المبلغ/), { target: { value: '500' } })
    fireEvent.click(screen.getByRole('button', { name: 'إضافة المعاملة' }))

    await waitFor(() =>
      expect(api.createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ service: 'جلسة مكثفة', amount: 500, method: 'مدى', status: 'مكتمل' }),
      ),
    )
  })
})
