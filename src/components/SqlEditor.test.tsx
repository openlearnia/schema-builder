import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SqlEditor } from './SqlEditor'

describe('SqlEditor', () => {
  it('syncs line numbers with textarea scrolling', () => {
    const value = Array.from({ length: 30 }, (_, index) => `SELECT ${index + 1};`).join('\n')
    const { container } = render(
      <SqlEditor value={value} onChange={vi.fn()} ariaLabel="SQL editor" />,
    )
    const textarea = screen.getByRole('textbox', { name: 'SQL editor' })
    const gutter = container.querySelector('.sqlLineNumbers') as HTMLDivElement

    Object.defineProperty(textarea, 'scrollTop', { configurable: true, value: 96 })
    fireEvent.scroll(textarea)

    expect(gutter.scrollTop).toBe(96)
  })
})
