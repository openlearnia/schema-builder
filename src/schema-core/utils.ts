let seed = 0

export function createId(prefix: string): string {
  seed += 1
  return `${prefix}_${seed}`
}

export function nowIso(): string {
  return new Date().toISOString()
}

export function sqlQuoteIdent(value: string): string {
  return `"${value.replaceAll('"', '""')}"`
}
