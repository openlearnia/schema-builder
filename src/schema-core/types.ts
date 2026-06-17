export type SchemaIRVersion = 1

export interface SchemaIR {
  version: SchemaIRVersion
  dialect: 'postgres'
  tables: TableDef[]
  enums: EnumDef[]
  rawSqlBlocks: RawSqlBlock[]
  meta: {
    revision: number
    updatedAt: string
  }
}

export interface EnumDef {
  id: string
  name: string
  values: string[]
}

export interface RawSqlBlock {
  id: string
  sql: string
  reason: string
}

export interface TableDef {
  id: string
  name: string
  columns: ColumnDef[]
  primaryKey: string[]
  uniques: UniqueConstraint[]
  checks: CheckConstraint[]
  indexes: IndexDef[]
  foreignKeys: ForeignKeyDef[]
  position?: {
    x: number
    y: number
  }
}

export interface ColumnDef {
  id: string
  name: string
  type: string
  nullable: boolean
  defaultValue?: string
}

export interface UniqueConstraint {
  id: string
  columns: string[]
}

export interface CheckConstraint {
  id: string
  expression: string
}

export interface IndexDef {
  id: string
  name: string
  columns: string[]
  unique: boolean
}

export interface ForeignKeyDef {
  id: string
  fromColumnId: string
  toTableId: string
  toColumnId: string
  onDelete: 'NO ACTION' | 'CASCADE' | 'SET NULL' | 'RESTRICT'
  onUpdate: 'NO ACTION' | 'CASCADE' | 'SET NULL' | 'RESTRICT'
}

export type ValidationSeverity = 'error' | 'warning'

export interface ValidationIssue {
  id: string
  severity: ValidationSeverity
  message: string
  tableId?: string
  columnId?: string
}
