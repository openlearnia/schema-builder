import type { SchemaIR } from './types'
import { nowIso } from './utils'

export function createEmptySchema(): SchemaIR {
  return {
    version: 1,
    dialect: 'postgres',
    tables: [],
    enums: [],
    rawSqlBlocks: [],
    meta: {
      revision: 0,
      updatedAt: nowIso(),
    },
  }
}

export function bumpRevision(schema: SchemaIR): SchemaIR {
  return {
    ...schema,
    meta: {
      revision: schema.meta.revision + 1,
      updatedAt: nowIso(),
    },
  }
}
