import type { SchemaIR } from '../schema-core/types'

export interface PgliteRuntimeAdapter {
  applyGeneratedSql: (sql: string) => Promise<{ ok: boolean; error?: string }>
  getSchemaFromDb: () => Promise<SchemaIR | null>
}

declare global {
  interface Window {
    __OPENLEARNIA_PGLITE_ADAPTER__?: PgliteRuntimeAdapter
  }
}

export function resolveRuntimeAdapter(): PgliteRuntimeAdapter {
  if (window.__OPENLEARNIA_PGLITE_ADAPTER__) {
    return window.__OPENLEARNIA_PGLITE_ADAPTER__
  }

  return {
    async applyGeneratedSql() {
      return { ok: true }
    },
    async getSchemaFromDb() {
      return null
    },
  }
}
