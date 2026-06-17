import { describe, expect, it } from 'vitest'
import { applyCommand } from './commands'
import { createEmptySchema } from './schema'
import { generateSql } from './sqlGenerator'
import { importSql } from './sqlImport'
import { validateSchema } from './validators'

describe('schema core', () => {
  it('creates deterministic sql for same schema', () => {
    let schema = createEmptySchema()
    schema = applyCommand(schema, { type: 'add_table', payload: { name: 'users' } })
    const table = schema.tables[0]
    schema = applyCommand(schema, {
      type: 'add_column',
      payload: { tableId: table.id, name: 'email', type: 'text' },
    })

    const first = generateSql(schema)
    const second = generateSql(schema)
    expect(first).toBe(second)
    expect(first).toContain('CREATE TABLE "users"')
  })

  it('imports supported SQL and preserves unsupported SQL', () => {
    const sql = `
      CREATE TABLE users (id integer NOT NULL, email text);
      CREATE VIEW user_view AS SELECT * FROM users;
    `
    const result = importSql(sql)

    expect(result.schema.tables).toHaveLength(1)
    expect(result.schema.tables[0].name).toBe('users')
    expect(result.schema.rawSqlBlocks.length).toBeGreaterThan(0)
  })

  it('flags duplicate table names', () => {
    let schema = createEmptySchema()
    schema = applyCommand(schema, { type: 'add_table', payload: { name: 'users' } })
    schema = applyCommand(schema, { type: 'add_table', payload: { name: 'users' } })
    const issues = validateSchema(schema)
    expect(issues.some((issue) => issue.message.includes('Duplicate table name'))).toBe(true)
  })

  it('toggles primary keys on columns', () => {
    let schema = createEmptySchema()
    schema = applyCommand(schema, { type: 'add_table', payload: { name: 'users' } })
    const columnId = schema.tables[0].columns[0].id

    schema = applyCommand(schema, {
      type: 'toggle_primary_key',
      payload: { tableId: schema.tables[0].id, columnId },
    })
    expect(schema.tables[0].primaryKey).toContain(columnId)

    const sql = generateSql(schema)
    expect(sql).toContain('PRIMARY KEY')
  })
})
