import type { SchemaIR, TableDef } from './types'
import { sqlQuoteIdent } from './utils'

function formatColumn(table: TableDef, columnId: string): string {
  const column = table.columns.find((c) => c.id === columnId)
  return column ? sqlQuoteIdent(column.name) : '""'
}

function createTableSql(table: TableDef): string {
  const lines: string[] = table.columns.map((c) => {
    const chunks = [sqlQuoteIdent(c.name), c.type]
    if (!c.nullable) {
      chunks.push('NOT NULL')
    }
    if (c.defaultValue) {
      chunks.push(`DEFAULT ${c.defaultValue}`)
    }
    return `  ${chunks.join(' ')}`
  })

  if (table.primaryKey.length > 0) {
    lines.push(`  PRIMARY KEY (${table.primaryKey.map((columnId) => formatColumn(table, columnId)).join(', ')})`)
  }

  for (const unique of table.uniques) {
    lines.push(`  UNIQUE (${unique.columns.map((columnId) => formatColumn(table, columnId)).join(', ')})`)
  }

  for (const check of table.checks) {
    lines.push(`  CHECK (${check.expression})`)
  }

  return `CREATE TABLE ${sqlQuoteIdent(table.name)} (\n${lines.join(',\n')}\n);`
}

export function generateSql(schema: SchemaIR): string {
  const tableSql = [...schema.tables]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(createTableSql)

  const fkSql = schema.tables.flatMap((table) =>
    table.foreignKeys.map((fk) => {
      const sourceColumn = table.columns.find((c) => c.id === fk.fromColumnId)
      const targetTable = schema.tables.find((t) => t.id === fk.toTableId)
      const targetColumn = targetTable?.columns.find((c) => c.id === fk.toColumnId)
      if (!sourceColumn || !targetTable || !targetColumn) {
        return ''
      }
      return [
        `ALTER TABLE ${sqlQuoteIdent(table.name)}`,
        `  ADD CONSTRAINT ${sqlQuoteIdent(fk.id)}`,
        `  FOREIGN KEY (${sqlQuoteIdent(sourceColumn.name)})`,
        `  REFERENCES ${sqlQuoteIdent(targetTable.name)} (${sqlQuoteIdent(targetColumn.name)})`,
        `  ON DELETE ${fk.onDelete}`,
        `  ON UPDATE ${fk.onUpdate};`,
      ].join('\n')
    }),
  )

  const indexSql = schema.tables.flatMap((table) =>
    table.indexes.map((index) => {
      const uniquePrefix = index.unique ? 'UNIQUE ' : ''
      const columns = index.columns.map((columnId) => formatColumn(table, columnId)).join(', ')
      return `CREATE ${uniquePrefix}INDEX ${sqlQuoteIdent(index.name)} ON ${sqlQuoteIdent(table.name)} (${columns});`
    }),
  )

  const rawSql = schema.rawSqlBlocks.map((block) => block.sql)

  return [...tableSql, ...fkSql, ...indexSql, ...rawSql].filter(Boolean).join('\n\n')
}
