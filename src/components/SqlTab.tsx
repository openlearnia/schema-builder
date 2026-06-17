import { useState } from 'react'
import { runQuery, type QueryResult } from '../integration/pgliteService'

const DEFAULT_QUERY = 'SELECT current_database() AS database, version() AS postgres_version;'

export function SqlTab() {
  const [query, setQuery] = useState(DEFAULT_QUERY)
  const [result, setResult] = useState<QueryResult | null>(null)
  const [running, setRunning] = useState(false)

  async function handleRun() {
    setRunning(true)
    const next = await runQuery(query)
    setResult(next)
    setRunning(false)
  }

  return (
    <div className="tabPane sqlPane">
      <div className="sqlEditor">
        <label className="field">
          <span>SQL query</span>
          <textarea
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="SQL query editor"
            spellCheck={false}
          />
        </label>
        <div className="row">
          <button onClick={() => void handleRun()} disabled={running}>
            {running ? 'Running…' : 'Run query'}
          </button>
        </div>
      </div>

      <section className="panel resultsPanel" aria-label="Query results">
        <h3>Results</h3>
        {result?.error && <p className="errorText">{result.error}</p>}
        {!result && <p className="muted">Run a query to see results.</p>}
        {result && !result.error && result.columns.length === 0 && (
          <p className="muted">
            {result.affectedRows != null
              ? `Statement completed. ${result.affectedRows} row(s) affected.`
              : 'Statement completed with no rows returned.'}
          </p>
        )}
        {result && !result.error && result.columns.length > 0 && (
          <div className="tableScroll">
            <table className="dataTable">
              <thead>
                <tr>
                  {result.columns.map((column) => (
                    <th key={column}>{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {result.columns.map((column) => (
                      <td key={column}>{formatCell(row[column])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="muted resultMeta">{result.rowCount} row(s)</p>
          </div>
        )}
      </section>
    </div>
  )
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) {
    return 'NULL'
  }
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}
