# Database Lab

Visual database schema builder with an integrated PGLite testing ground. Design tables on a canvas, apply DDL to a real in-browser Postgres, then run SQL queries and browse data — all in one app.

## Features

- **Schema** — Visual table/column editor with relation edges (React Flow)
- **SQL** — Run queries against the live PGLite database with tabular results
- **Data** — Browse tables and preview rows
- Canonical `SchemaIR` model with deterministic SQL generation
- SQL import with unsupported statement preservation
- Local autosave and revision history (undo/redo)
- PGLite persistence via IndexedDB (`idb://openlearnia-database-lab`)

## Quick start

```bash
npm install
npm run dev
```

Open the app, design tables on the **Schema** tab, click **Apply to PGLite**, then switch to **SQL** or **Data** to test your schema.

Applying a schema drops existing user tables in PGLite and recreates from the diagram (with a confirmation prompt when tables already exist).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Typecheck and production build |
| `npm test` | Run Vitest unit and integration tests |

## Deploy

Pushes to `main` deploy `dist/` to Cloudflare Pages via GitHub Actions (`.github/workflows/deploy.yml`). Required org secrets: `CF_API_TOKEN`, `CF_ACCOUNT_ID`. Pages project name is in `wrangler.toml`.

## Note on pglite-playground

The former `pglite-playground` tool has been merged into this project. See `projects/tools/pglite-playground/README.md` for the redirect.
