import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import Badge from './Badge'

describe('Badge', () => {
  it('renders its label text', () => {
    render(<Badge>نشط</Badge>)
    expect(screen.getByText('نشط')).toBeInTheDocument()
  })

  it('applies the tone class', () => {
    render(<Badge tone="success">مكتمل</Badge>)
    expect(screen.getByText('مكتمل')).toHaveClass('text-emerald-700')
  })

  it('renders a status dot when requested', () => {
    render(<Badge dot>معلق</Badge>)
    // The dot is the inner span the Badge renders before the label.
    expect(screen.getByText('معلق').querySelector('span')).toBeInTheDocument()
  })

  it('switches to the compact padding', () => {
    render(<Badge compact>معاينة</Badge>)
    expect(screen.getByText('معاينة')).toHaveClass('px-1.5')
  })
})
