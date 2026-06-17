import { useCallback, useEffect, useState } from 'react'
import { listTables, previewTable, type QueryResult } from '../integration/pgliteService'

export function DataTab() {
  const [tables, setTables] = useState<string[]>([])
  const [selectedTable, setSelectedTable] = useState<string>()
  const [result, setResult] = useState<QueryResult | null>(null)
  const [loading, setLoading] = useState(false)

  const refreshTables = useCallback(async () => {
    const names = await listTables()
    setTables(names)
    setSelectedTable((current) => {
      if (current && names.includes(current)) {
        return current
      }
      return names[0]
    })
  }, [])

  useEffect(() => {
    void refreshTables()
  }, [refreshTables])

  useEffect(() => {
    if (!selectedTable) {
      setResult(null)
      return
    }
    setLoading(true)
    void previewTable(selectedTable).then((preview) => {
      setResult(preview)
      setLoading(false)
    })
  }, [selectedTable])

  return (
    <div className="tabPane dataPane">
      <aside className="panel tableList">
        <div className="row between">
          <h3>Tables</h3>
          <button className="ghost" onClick={() => void refreshTables()}>
            Refresh
          </button>
        </div>
        {tables.length === 0 && (
          <p className="muted">No tables yet. Design a schema and click Apply to PGLite.</p>
        )}
        <ul className="tableNav">
          {tables.map((table) => (
            <li key={table}>
              <button
                className={table === selectedTable ? 'tableLink active' : 'tableLink'}
                onClick={() => setSelectedTable(table)}
              >
                {table}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="panel dataPreview">
        <h3>{selectedTable ? `Preview: ${selectedTable}` : 'Table preview'}</h3>
        {loading && <p className="muted">Loading rows…</p>}
        {!loading && result?.error && <p className="errorText">{result.error}</p>}
        {!loading && selectedTable && result && !result.error && result.columns.length > 0 && (
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
            <p className="muted resultMeta">Showing up to 100 rows</p>
          </div>
        )}
        {!loading && selectedTable && result && !result.error && result.columns.length === 0 && (
          <p className="muted">Table is empty.</p>
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
