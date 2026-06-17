# Schema Builder

Visual database schema builder for Openlearnia.

## Features

- Visual table/column editor with relation edges
- Canonical `SchemaIR` model with deterministic SQL generation
- SQL import with unsupported statement preservation
- Local autosave and revision history (undo/redo)
- Runtime apply contract for PGLite playground integration

## Quick start

```bash
npm install
npm run dev
```

## Integration Contract

The app looks for `window.__OPENLEARNIA_PGLITE_ADAPTER__` with:

- `applyGeneratedSql(sql: string): Promise<{ ok: boolean; error?: string }>`
- `getSchemaFromDb(): Promise<SchemaIR | null>`

If no adapter is present, Schema Builder runs in standalone mode.
