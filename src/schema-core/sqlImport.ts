import { createEmptySchema } from './schema'
import type { ColumnDef, SchemaIR, TableDef } from './types'
import { createId } from './utils'

interface ImportResult {
  schema: SchemaIR
  warnings: string[]
}

function parseColumnDef(chunk: string): ColumnDef | null {
  const matches = chunk.trim().match(/^"?(?<name>[a-zA-Z_][a-zA-Z0-9_]*)"?\s+(?<type>[a-zA-Z0-9_()[\]]+)(?<rest>.*)$/)
  if (!matches?.groups) {
    return null
  }
  const rest = matches.groups.rest?.toUpperCase() ?? ''
  return {
    id: createId('col'),
    name: matches.groups.name,
    type: matches.groups.type.toLowerCase(),
    nullable: !rest.includes('NOT NULL'),
    defaultValue: undefined,
  }
}

function parseCreateTable(statement: string): TableDef | null {
  const tableMatch = statement.match(/CREATE\s+TABLE\s+"?([a-zA-Z_][a-zA-Z0-9_]*)"?\s*\(([\s\S]*)\)\s*;?/i)
  if (!tableMatch) {
    return null
  }

  const tableName = tableMatch[1]
  const body = tableMatch[2]
  const chunks = body.split(',').map((item) => item.trim())
  const columns = chunks.map(parseColumnDef).filter((column): column is ColumnDef => column !== null)

  return {
    id: createId('table'),
    name: tableName,
    columns,
    primaryKey: [],
    uniques: [],
    checks: [],
    indexes: [],
    foreignKeys: [],
    position: {
      x: 80,
      y: 80,
    },
  }
}

export function importSql(sql: string): ImportResult {
  const schema = createEmptySchema()
  const warnings: string[] = []

  const statements = sql
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean)
    .map((statement) => `${statement};`)

  for (const statement of statements) {
    if (/^CREATE\s+TABLE/i.test(statement)) {
      const table = parseCreateTable(statement)
      if (table) {
        schema.tables.push({
          ...table,
          position: {
            x: 80 + schema.tables.length * 40,
            y: 80 + schema.tables.length * 40,
          },
        })
      } else {
        schema.rawSqlBlocks.push({
          id: createId('raw'),
          sql: statement,
          reason: 'Could not parse CREATE TABLE statement',
        })
        warnings.push('Some CREATE TABLE statements could not be parsed.')
      }
      continue
    }

    schema.rawSqlBlocks.push({
      id: createId('raw'),
      sql: statement,
      reason: 'Unsupported statement for visual model',
    })
    warnings.push(`Unsupported statement preserved: ${statement.slice(0, 36)}...`)
  }

  return { schema, warnings }
}
