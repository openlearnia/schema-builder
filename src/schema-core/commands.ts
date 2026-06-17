import { bumpRevision } from './schema'
import type { ForeignKeyDef, SchemaIR, TableDef } from './types'
import { createId } from './utils'

export type SchemaCommand =
  | { type: 'add_table'; payload: { name?: string; x?: number; y?: number } }
  | { type: 'rename_table'; payload: { tableId: string; name: string } }
  | { type: 'delete_table'; payload: { tableId: string } }
  | { type: 'add_column'; payload: { tableId: string; name?: string; type?: string } }
  | { type: 'update_column'; payload: { tableId: string; columnId: string; patch: Partial<{ name: string; type: string; nullable: boolean; defaultValue: string }> } }
  | { type: 'add_fk'; payload: { tableId: string; fromColumnId: string; toTableId: string; toColumnId: string } }
  | { type: 'remove_fk'; payload: { tableId: string; fkId: string } }
  | { type: 'toggle_primary_key'; payload: { tableId: string; columnId: string } }
  | { type: 'set_table_position'; payload: { tableId: string; x: number; y: number } }
  | { type: 'import_schema'; payload: { schema: SchemaIR } }

function defaultTableName(schema: SchemaIR): string {
  return `table_${schema.tables.length + 1}`
}

function defaultColumnName(table: TableDef): string {
  return `column_${table.columns.length + 1}`
}

export function applyCommand(schema: SchemaIR, command: SchemaCommand): SchemaIR {
  switch (command.type) {
    case 'import_schema':
      return bumpRevision(command.payload.schema)
    case 'add_table': {
      const table: TableDef = {
        id: createId('table'),
        name: command.payload.name ?? defaultTableName(schema),
        columns: [
          {
            id: createId('col'),
            name: 'id',
            type: 'integer',
            nullable: false,
          },
        ],
        primaryKey: [],
        uniques: [],
        checks: [],
        indexes: [],
        foreignKeys: [],
        position: {
          x: command.payload.x ?? 80 + schema.tables.length * 40,
          y: command.payload.y ?? 80 + schema.tables.length * 40,
        },
      }
      return bumpRevision({
        ...schema,
        tables: [...schema.tables, table],
      })
    }
    case 'rename_table':
      return bumpRevision({
        ...schema,
        tables: schema.tables.map((t) =>
          t.id === command.payload.tableId ? { ...t, name: command.payload.name } : t,
        ),
      })
    case 'delete_table':
      return bumpRevision({
        ...schema,
        tables: schema.tables.filter((t) => t.id !== command.payload.tableId),
      })
    case 'add_column':
      return bumpRevision({
        ...schema,
        tables: schema.tables.map((t) => {
          if (t.id !== command.payload.tableId) {
            return t
          }
          return {
            ...t,
            columns: [
              ...t.columns,
              {
                id: createId('col'),
                name: command.payload.name ?? defaultColumnName(t),
                type: command.payload.type ?? 'text',
                nullable: true,
              },
            ],
          }
        }),
      })
    case 'update_column':
      return bumpRevision({
        ...schema,
        tables: schema.tables.map((t) => {
          if (t.id !== command.payload.tableId) {
            return t
          }
          return {
            ...t,
            columns: t.columns.map((c) =>
              c.id === command.payload.columnId ? { ...c, ...command.payload.patch } : c,
            ),
          }
        }),
      })
    case 'add_fk': {
      const fk: ForeignKeyDef = {
        id: createId('fk'),
        fromColumnId: command.payload.fromColumnId,
        toTableId: command.payload.toTableId,
        toColumnId: command.payload.toColumnId,
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION',
      }
      return bumpRevision({
        ...schema,
        tables: schema.tables.map((t) =>
          t.id === command.payload.tableId
            ? { ...t, foreignKeys: [...t.foreignKeys, fk] }
            : t,
        ),
      })
    }
    case 'remove_fk':
      return bumpRevision({
        ...schema,
        tables: schema.tables.map((t) =>
          t.id === command.payload.tableId
            ? { ...t, foreignKeys: t.foreignKeys.filter((fk) => fk.id !== command.payload.fkId) }
            : t,
        ),
      })
    case 'toggle_primary_key':
      return bumpRevision({
        ...schema,
        tables: schema.tables.map((t) => {
          if (t.id !== command.payload.tableId) {
            return t
          }
          const isPrimary = t.primaryKey.includes(command.payload.columnId)
          return {
            ...t,
            primaryKey: isPrimary
              ? t.primaryKey.filter((columnId) => columnId !== command.payload.columnId)
              : [...t.primaryKey, command.payload.columnId],
          }
        }),
      })
    case 'set_table_position':
      return bumpRevision({
        ...schema,
        tables: schema.tables.map((t) =>
          t.id === command.payload.tableId
            ? { ...t, position: { x: command.payload.x, y: command.payload.y } }
            : t,
        ),
      })
    default:
      return schema
  }
}
