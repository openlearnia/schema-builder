import { fireEvent, render, screen } from '@testing-library/react'
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
  it('renders navigation and schema controls', async () => {
    render(<App />)
    await screen.findByText('PGLite connected')

    expect(screen.getByRole('heading', { name: /database lab/i })).toBeTruthy()
    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /^schema$/i })).toBeTruthy()
    expect(screen.getAllByRole('button', { name: /add table/i })).not.toHaveLength(0)
  })

  it('guides an empty schema with a sample and shows dirty state', async () => {
    render(<App />)
    await screen.findByText('PGLite connected')

    fireEvent.click(screen.getByRole('button', { name: /load sample/i }))

    expect(screen.getAllByText('users')).not.toHaveLength(0)
    expect(screen.getAllByText('posts')).not.toHaveLength(0)
    expect(screen.getByText('Dirty')).toBeTruthy()
  })

  it('clears dirty state after applying a schema', async () => {
    render(<App />)
    await screen.findByText('PGLite connected')

    fireEvent.click(screen.getAllByRole('button', { name: /^add table$/i })[0])
    fireEvent.click(screen.getByRole('button', { name: /apply schema to pglite runtime/i }))

    await screen.findByText('Schema applied to PGLite')
    expect(screen.queryByText('Dirty')).toBeNull()
  })

  it('opens keyboard shortcuts when question mark is pressed', () => {
    render(<App />)

    fireEvent.keyDown(window, { key: '?' })

    expect(screen.getByRole('dialog', { name: /keyboard shortcuts/i })).toBeTruthy()
  })
})
