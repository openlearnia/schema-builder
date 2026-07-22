import { useMemo, useState } from 'react'
import { useGeneratedSql, useSchemaStore } from '../store/schemaStore'
import { SqlEditor } from './SqlEditor'

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
      <SqlEditor
        value={sql}
        onChange={setDraftSql}
        ariaLabel="Generated SQL preview"
        className="sqlPreview"
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
