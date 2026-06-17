import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('Schema Builder app', () => {
  it('renders toolbar and sql section', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /add table/i })).toBeTruthy()
    expect(screen.getByRole('heading', { name: /sql/i })).toBeTruthy()
  })
})
