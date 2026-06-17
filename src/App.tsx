import { useEffect, useState } from 'react'
import { SchemaCanvas } from './components/SchemaCanvas'
import { IssuesPanel } from './components/IssuesPanel'
import { SchemaInspector } from './components/SchemaInspector'
import { SqlPanel } from './components/SqlPanel'
import { Toolbar } from './components/Toolbar'
import { resolveRuntimeAdapter } from './integration/pgliteRuntime'
import { generateSql } from './schema-core/sqlGenerator'
import { useSchemaStore } from './store/schemaStore'

function App() {
  const init = useSchemaStore((state) => state.init)
  const schema = useSchemaStore((state) => state.history.present)
  const loadFromRuntimeSchema = useSchemaStore((state) => state.loadFromRuntimeSchema)
  const undo = useSchemaStore((state) => state.undo)
  const redo = useSchemaStore((state) => state.redo)
  const [runtimeMessage, setRuntimeMessage] = useState<string>('Ready')

  useEffect(() => {
    void init()
  }, [init])

  useEffect(() => {
    const adapter = resolveRuntimeAdapter()
    void adapter.getSchemaFromDb().then((existingSchema) => {
      if (existingSchema) {
        loadFromRuntimeSchema(existingSchema)
      }
    })
  }, [loadFromRuntimeSchema])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        if (event.shiftKey) {
          redo()
        } else {
          undo()
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [redo, undo])

  async function applyToRuntime(): Promise<void> {
    const adapter = resolveRuntimeAdapter()
    const sql = generateSql(schema)
    const result = await adapter.applyGeneratedSql(sql)
    setRuntimeMessage(result.ok ? 'Applied to runtime' : `Apply failed: ${result.error ?? 'Unknown error'}`)
  }

  return (
    <div className="appRoot">
      <Toolbar onApplyToRuntime={applyToRuntime} />
      <main className="layout">
        <section className="canvasPane" aria-label="Schema diagram canvas">
          <SchemaCanvas />
        </section>
        <section className="sidePane">
          <SchemaInspector />
          <IssuesPanel />
          <SqlPanel />
          <p className="muted">{runtimeMessage}</p>
        </section>
      </main>
    </div>
  )
}

export default App
