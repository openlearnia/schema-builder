import { PGlite } from '@electric-sql/pglite'
import type { SchemaIR } from '../schema-core/types'
import { introspectSchema } from './schemaIntrospection'

const BROWSER_DATA_DIR = 'idb://openlearnia-database-lab'
const TEST_DATA_DIR = 'memory://openlearnia-database-lab-test'

export interface QueryResult {
  columns: string[]
  rows: Record<string, unknown>[]
  rowCount: number
  error?: string
  affectedRows?: number
}

let instance: PGlite | null = null
let initPromise: Promise<PGlite> | null = null
let dataDirOverride: string | null = null

export function configurePgliteDataDir(dataDir: string): void {
  dataDirOverride = dataDir
  instance = null
  initPromise = null
}

export function resetPgliteForTests(): void {
  instance = null
  initPromise = null
  dataDirOverride = null
}

function resolveDataDir(): string {
  if (dataDirOverride) {
    return dataDirOverride
  }
  if (typeof indexedDB !== 'undefined') {
    return BROWSER_DATA_DIR
  }
  return TEST_DATA_DIR
}

export async function getPglite(): Promise<PGlite> {
  if (instance) {
    return instance
  }
  if (!initPromise) {
    initPromise = PGlite.create(resolveDataDir(), { relaxedDurability: true }).then((pg) => {
      instance = pg
      return pg
    })
  }
  return initPromise
}

export async function getPgliteStatus(): Promise<'ready' | 'loading' | 'error'> {
  try {
    await getPglite()
    return 'ready'
  } catch {
    return 'error'
  }
}

async function listUserTables(pg: PGlite): Promise<string[]> {
  const result = await pg.query<{ table_name: string }>(
    `SELECT table_name
     FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_type = 'BASE TABLE'
     ORDER BY table_name`,
  )
  return result.rows.map((row) => row.table_name)
}

export async function applyGeneratedSql(sql: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const pg = await getPglite()
    const tables = await listUserTables(pg)
    for (const tableName of tables) {
      await pg.exec(`DROP TABLE IF EXISTS "${tableName.replace(/"/g, '""')}" CASCADE;`)
    }
    if (sql.trim()) {
      await pg.exec(sql)
    }
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function getSchemaFromDb(): Promise<SchemaIR | null> {
  try {
    const pg = await getPglite()
    const tables = await listUserTables(pg)
    if (tables.length === 0) {
      return null
    }
    return await introspectSchema(pg)
  } catch {
    return null
  }
}

function toQueryResult(
  result: {
    rows: unknown[]
    fields?: { name: string }[]
    affectedRows?: number
  },
  error?: string,
): QueryResult {
  const columns = result.fields?.map((field) => field.name) ?? []
  const rows = result.rows.map((row) =>
    typeof row === 'object' && row !== null ? (row as Record<string, unknown>) : { value: row },
  )
  return {
    columns,
    rows,
    rowCount: rows.length,
    affectedRows: result.affectedRows,
    error,
  }
}

export async function runQuery(sql: string): Promise<QueryResult> {
  try {
    const pg = await getPglite()
    const trimmed = sql.trim()
    if (!trimmed) {
      return { columns: [], rows: [], rowCount: 0, error: 'Enter a SQL statement to run.' }
    }

    const statements = trimmed
      .split(';')
      .map((statement) => statement.trim())
      .filter(Boolean)

    if (statements.length === 1) {
      const result = await pg.query(trimmed.endsWith(';') ? trimmed : `${trimmed};`)
      return toQueryResult(result)
    }

    const results = await pg.exec(
      statements.map((statement) => `${statement};`).join('\n'),
    )
    const last = results[results.length - 1]
    if (last && 'rows' in last) {
      return toQueryResult(last)
    }
    return {
      columns: [],
      rows: [],
      rowCount: 0,
      affectedRows: results.reduce((sum, item) => sum + (item.affectedRows ?? 0), 0),
    }
  } catch (error) {
    return {
      columns: [],
      rows: [],
      rowCount: 0,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

export async function listTables(): Promise<string[]> {
  try {
    const pg = await getPglite()
    return await listUserTables(pg)
  } catch {
    return []
  }
}

export async function previewTable(tableName: string, limit = 100): Promise<QueryResult> {
  const safeName = tableName.replace(/"/g, '""')
  return runQuery(`SELECT * FROM "${safeName}" LIMIT ${limit};`)
}
