import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import Button from './Button'

describe('Button', () => {
  it('renders its children and a default button type', () => {
    render(<Button>حفظ</Button>)
    const btn = screen.getByRole('button', { name: 'حفظ' })
    expect(btn).toBeInTheDocument()
    expect(btn).toHaveAttribute('type', 'button')
  })

  it('applies the variant class', () => {
    render(<Button variant="ghost">إلغاء</Button>)
    expect(screen.getByRole('button')).toHaveClass('text-primary')
  })

  it('applies the size class', () => {
    render(<Button size="sm">صغير</Button>)
    expect(screen.getByRole('button')).toHaveClass('px-3')
  })

  it('forwards extra props like aria-label', () => {
    render(<Button aria-label="إغلاق النافذة">إغلاق</Button>)
    expect(screen.getByRole('button', { name: 'إغلاق النافذة' })).toBeInTheDocument()
  })

  it('does not fire onClick when disabled', () => {
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        حذف
      </Button>,
    )
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('fires onClick when enabled', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>تأكيد</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
