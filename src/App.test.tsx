import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import App from './App'

vi.mock('./integration/pgliteService', () => ({
  applyGeneratedSql: vi.fn(async () => ({ ok: true })),
  getPgliteStatus: vi.fn(async () => 'ready' as const),
  getSchemaFromDb: vi.fn(async () => null),
  listTables: vi.fn(async () => []),
  runQuery: vi.fn(async () => ({ columns: [], rows: [], rowCount: 0 })),
  previewTable: vi.fn(async () => ({ columns: [], rows: [], rowCount: 0 })),
}))

describe('Database Lab app', () => {
  it('renders navigation and schema controls', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /database lab/i })).toBeTruthy()
    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /^schema$/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /add table/i })).toBeTruthy()
  })
})
