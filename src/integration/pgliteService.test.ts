import { beforeEach, describe, expect, it } from 'vitest'
import {
  applyGeneratedSql,
  configurePgliteDataDir,
  getSchemaFromDb,
  resetPgliteForTests,
  runQuery,
} from './pgliteService'

describe('pglite service', () => {
  beforeEach(() => {
    resetPgliteForTests()
    configurePgliteDataDir(`memory://test-${crypto.randomUUID()}`)
  })

  it('applies generated DDL and introspects schema back', async () => {
    const ddl = `
      CREATE TABLE authors (
        id integer NOT NULL,
        name text NOT NULL,
        PRIMARY KEY (id)
      );

      CREATE TABLE books (
        id integer NOT NULL,
        author_id integer NOT NULL,
        title text,
        PRIMARY KEY (id),
        FOREIGN KEY (author_id) REFERENCES authors (id)
      );
    `

    const applyResult = await applyGeneratedSql(ddl)
    expect(applyResult.ok).toBe(true)

    const schema = await getSchemaFromDb()
    expect(schema).not.toBeNull()
    expect(schema?.tables.map((table) => table.name).sort()).toEqual(['authors', 'books'])

    const authors = schema?.tables.find((table) => table.name === 'authors')
    expect(authors?.primaryKey).toHaveLength(1)

    const books = schema?.tables.find((table) => table.name === 'books')
    expect(books?.foreignKeys).toHaveLength(1)
  })

  it('runs queries and returns tabular results', async () => {
    await applyGeneratedSql('CREATE TABLE greetings (message text);')
    await runQuery("INSERT INTO greetings (message) VALUES ('hello');")

    const result = await runQuery('SELECT message FROM greetings;')
    expect(result.error).toBeUndefined()
    expect(result.columns).toContain('message')
    expect(result.rows[0]?.message).toBe('hello')
  })
})
