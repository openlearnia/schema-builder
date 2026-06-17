import type { SchemaIR, TableDef, ValidationIssue } from './types'
import { createId } from './utils'

function checkTableNames(schema: SchemaIR): ValidationIssue[] {
  const seen = new Set<string>()
  const issues: ValidationIssue[] = []
  for (const table of schema.tables) {
    const key = table.name.toLowerCase()
    if (seen.has(key)) {
      issues.push({
        id: createId('issue'),
        severity: 'error',
        message: `Duplicate table name: ${table.name}`,
        tableId: table.id,
      })
    }
    seen.add(key)
  }
  return issues
}

function checkColumnNames(table: TableDef): ValidationIssue[] {
  const seen = new Set<string>()
  const issues: ValidationIssue[] = []
  for (const column of table.columns) {
    const key = column.name.toLowerCase()
    if (seen.has(key)) {
      issues.push({
        id: createId('issue'),
        severity: 'error',
        message: `Duplicate column in ${table.name}: ${column.name}`,
        tableId: table.id,
        columnId: column.id,
      })
    }
    seen.add(key)
  }
  return issues
}

function checkForeignKeys(schema: SchemaIR): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  for (const table of schema.tables) {
    for (const fk of table.foreignKeys) {
      const sourceColumn = table.columns.find((c) => c.id === fk.fromColumnId)
      const targetTable = schema.tables.find((t) => t.id === fk.toTableId)
      const targetColumn = targetTable?.columns.find((c) => c.id === fk.toColumnId)

      if (!sourceColumn || !targetTable || !targetColumn) {
        issues.push({
          id: createId('issue'),
          severity: 'error',
          message: `Broken relation in ${table.name}`,
          tableId: table.id,
        })
        continue
      }

      if (sourceColumn.type !== targetColumn.type) {
        issues.push({
          id: createId('issue'),
          severity: 'warning',
          message: `Type mismatch for relation ${table.name}.${sourceColumn.name} -> ${targetTable.name}.${targetColumn.name}`,
          tableId: table.id,
          columnId: sourceColumn.id,
        })
      }
    }
  }
  return issues
}

export function validateSchema(schema: SchemaIR): ValidationIssue[] {
  const issues = [
    ...checkTableNames(schema),
    ...schema.tables.flatMap(checkColumnNames),
    ...checkForeignKeys(schema),
  ]
  return issues
}
