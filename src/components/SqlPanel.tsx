import { useMemo, useState } from 'react'
import { useGeneratedSql, useSchemaStore } from '../store/schemaStore'

export function SqlPanel() {
  const generatedSql = useGeneratedSql()
  const importFromSql = useSchemaStore((state) => state.importFromSql)
  const warnings = useSchemaStore((state) => state.importWarnings)
  const [draftSql, setDraftSql] = useState('')
  const sql = useMemo(() => draftSql || generatedSql, [draftSql, generatedSql])

  return (
    <section className="panel">
      <div className="row between">
        <h3>SQL</h3>
        <button onClick={() => importFromSql(sql)}>Reconcile from SQL</button>
      </div>
      <textarea
        value={sql}
        onChange={(event) => setDraftSql(event.target.value)}
        aria-label="Generated SQL preview"
      />
      {warnings.length > 0 && (
        <ul className="warningList">
          {warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}
    </section>
  )
}
