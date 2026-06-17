import { get, set } from 'idb-keyval'
import { create } from 'zustand'
import { applyCommand, type SchemaCommand } from '../schema-core/commands'
import { commit, createHistory, redo, undo, type SchemaHistory } from '../schema-core/history'
import { createEmptySchema } from '../schema-core/schema'
import { generateSql } from '../schema-core/sqlGenerator'
import { importSql } from '../schema-core/sqlImport'
import type { SchemaIR, ValidationIssue } from '../schema-core/types'
import { validateSchema } from '../schema-core/validators'

const STORAGE_KEY = 'openlearnia:schema-builder:history'

interface SchemaStore {
  history: SchemaHistory
  issues: ValidationIssue[]
  syncStatus: 'in-sync' | 'needs-reconcile' | 'conflict'
  importWarnings: string[]
  selectedTableId?: string
  init: () => Promise<void>
  dispatch: (command: SchemaCommand) => void
  importFromSql: (sql: string) => void
  loadFromRuntimeSchema: (schema: SchemaIR) => void
  undo: () => void
  redo: () => void
  setSelectedTable: (tableId?: string) => void
}

function evaluateIssues(schema: SchemaIR): ValidationIssue[] {
  return validateSchema(schema)
}

export const useSchemaStore = create<SchemaStore>((setState, getState) => ({
  history: createHistory(createEmptySchema()),
  issues: [],
  syncStatus: 'in-sync',
  importWarnings: [],
  selectedTableId: undefined,
  async init() {
    const persisted = await get<SchemaHistory>(STORAGE_KEY)
    if (!persisted) {
      return
    }
    setState({
      history: persisted,
      issues: evaluateIssues(persisted.present),
    })
  },
  dispatch(command) {
    const { history } = getState()
    const next = applyCommand(history.present, command)
    const updated = commit(history, next)
    void set(STORAGE_KEY, updated)
    setState({
      history: updated,
      issues: evaluateIssues(updated.present),
      syncStatus: command.type === 'import_schema' ? 'in-sync' : 'needs-reconcile',
      importWarnings: [],
    })
  },
  importFromSql(sql) {
    const { history } = getState()
    const parsed = importSql(sql)
    const updated = commit(history, parsed.schema)
    void set(STORAGE_KEY, updated)
    setState({
      history: updated,
      issues: evaluateIssues(parsed.schema),
      syncStatus: parsed.warnings.length > 0 ? 'conflict' : 'in-sync',
      importWarnings: parsed.warnings,
      selectedTableId: parsed.schema.tables[0]?.id,
    })
  },
  loadFromRuntimeSchema(schema) {
    const { history } = getState()
    const updated = commit(history, schema)
    void set(STORAGE_KEY, updated)
    setState({
      history: updated,
      issues: evaluateIssues(schema),
      syncStatus: 'in-sync',
      importWarnings: [],
    })
  },
  undo() {
    const { history } = getState()
    const updated = undo(history)
    void set(STORAGE_KEY, updated)
    setState({
      history: updated,
      issues: evaluateIssues(updated.present),
      syncStatus: 'needs-reconcile',
    })
  },
  redo() {
    const { history } = getState()
    const updated = redo(history)
    void set(STORAGE_KEY, updated)
    setState({
      history: updated,
      issues: evaluateIssues(updated.present),
      syncStatus: 'needs-reconcile',
    })
  },
  setSelectedTable(tableId) {
    setState({ selectedTableId: tableId })
  },
}))

export function useGeneratedSql(): string {
  return useSchemaStore((state) => generateSql(state.history.present))
}
