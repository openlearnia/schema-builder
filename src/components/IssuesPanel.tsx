import { useSchemaStore } from '../store/schemaStore'

export function IssuesPanel() {
  const issues = useSchemaStore((state) => state.issues)
  if (issues.length === 0) {
    return (
      <section className="panel compact">
        <h3>Validation</h3>
        <p className="muted">Schema is valid.</p>
      </section>
    )
  }

  return (
    <section className="panel compact">
      <h3>Validation</h3>
      <ul className="warningList">
        {issues.map((issue) => (
          <li key={issue.id} className={issue.severity === 'error' ? 'issue-error' : 'issue-warning'}>
            <span className="issue-severity">{issue.severity.toUpperCase()}</span>
            {issue.message}
          </li>
        ))}
      </ul>
    </section>
  )
}
