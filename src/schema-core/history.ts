import { createEmptySchema } from './schema'
import type { SchemaIR } from './types'

export interface SchemaHistory {
  past: SchemaIR[]
  present: SchemaIR
  future: SchemaIR[]
}

export function createHistory(initial?: SchemaIR): SchemaHistory {
  return {
    past: [],
    present: initial ?? createEmptySchema(),
    future: [],
  }
}

export function commit(history: SchemaHistory, next: SchemaIR): SchemaHistory {
  return {
    past: [...history.past, history.present],
    present: next,
    future: [],
  }
}

export function undo(history: SchemaHistory): SchemaHistory {
  const previous = history.past[history.past.length - 1]
  if (!previous) {
    return history
  }
  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future],
  }
}

export function redo(history: SchemaHistory): SchemaHistory {
  const next = history.future[0]
  if (!next) {
    return history
  }
  return {
    past: [...history.past, history.present],
    present: next,
    future: history.future.slice(1),
  }
}
