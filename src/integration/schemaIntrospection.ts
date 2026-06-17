import { bumpRevision, createEmptySchema } from '../schema-core/schema'
import type { ColumnDef, ForeignKeyDef, SchemaIR, TableDef } from '../schema-core/types'
import { createId } from '../schema-core/utils'
import type { PGlite } from '@electric-sql/pglite'

interface TableRow {
  table_name: string
}

interface ColumnRow {
  table_name: string
  column_name: string
  data_type: string
  is_nullable: string
  column_default: string | null
}

interface PkRow {
  table_name: string
  column_name: string
}

interface FkRow {
  table_name: string
  column_name: string
  foreign_table_name: string
  foreign_column_name: string
  constraint_name: string
}

export async function introspectSchema(pg: PGlite): Promise<SchemaIR> {
  const schema = createEmptySchema()

  const tablesResult = await pg.query<TableRow>(
    `SELECT table_name
     FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_type = 'BASE TABLE'
     ORDER BY table_name`,
  )

  if (tablesResult.rows.length === 0) {
    return schema
  }

  const columnsResult = await pg.query<ColumnRow>(
    `SELECT table_name, column_name, data_type, is_nullable, column_default
     FROM information_schema.columns
     WHERE table_schema = 'public'
     ORDER BY table_name, ordinal_position`,
  )

  const pkResult = await pg.query<PkRow>(
    `SELECT tc.table_name, kcu.column_name
     FROM information_schema.table_constraints tc
     JOIN information_schema.key_column_usage kcu
       ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
     WHERE tc.constraint_type = 'PRIMARY KEY'
       AND tc.table_schema = 'public'`,
  )

  const fkResult = await pg.query<FkRow>(
    `SELECT
       tc.table_name,
       kcu.column_name,
       ccu.table_name AS foreign_table_name,
       ccu.column_name AS foreign_column_name,
       tc.constraint_name
     FROM information_schema.table_constraints tc
     JOIN information_schema.key_column_usage kcu
       ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
     JOIN information_schema.constraint_column_usage ccu
       ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
     WHERE tc.constraint_type = 'FOREIGN KEY'
       AND tc.table_schema = 'public'`,
  )

  const tableByName = new Map<string, TableDef>()
  const columnIdByTableAndName = new Map<string, string>()

  for (const [index, row] of tablesResult.rows.entries()) {
    const table: TableDef = {
      id: createId('table'),
      name: row.table_name,
      columns: [],
      primaryKey: [],
      uniques: [],
      checks: [],
      indexes: [],
      foreignKeys: [],
      position: { x: 80 + index * 48, y: 80 + index * 48 },
    }
    tableByName.set(row.table_name, table)
    schema.tables.push(table)
  }

  for (const row of columnsResult.rows) {
    const table = tableByName.get(row.table_name)
    if (!table) {
      continue
    }
    const column: ColumnDef = {
      id: createId('col'),
      name: row.column_name,
      type: row.data_type,
      nullable: row.is_nullable === 'YES',
      defaultValue: row.column_default ?? undefined,
    }
    table.columns.push(column)
    columnIdByTableAndName.set(`${row.table_name}.${row.column_name}`, column.id)
  }

  for (const row of pkResult.rows) {
    const table = tableByName.get(row.table_name)
    const columnId = columnIdByTableAndName.get(`${row.table_name}.${row.column_name}`)
    if (table && columnId && !table.primaryKey.includes(columnId)) {
      table.primaryKey.push(columnId)
    }
  }

  for (const row of fkResult.rows) {
    const table = tableByName.get(row.table_name)
    const targetTable = tableByName.get(row.foreign_table_name)
    const fromColumnId = columnIdByTableAndName.get(`${row.table_name}.${row.column_name}`)
    const toColumnId = columnIdByTableAndName.get(
      `${row.foreign_table_name}.${row.foreign_column_name}`,
    )
    if (!table || !targetTable || !fromColumnId || !toColumnId) {
      continue
    }
    const fk: ForeignKeyDef = {
      id: row.constraint_name || createId('fk'),
      fromColumnId,
      toTableId: targetTable.id,
      toColumnId,
      onDelete: 'NO ACTION',
      onUpdate: 'NO ACTION',
    }
    table.foreignKeys.push(fk)
  }

  return bumpRevision(schema)
}
