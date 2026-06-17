import { useEffect, useState } from 'react'
import { DataTab } from './components/DataTab'
import { IssuesPanel } from './components/IssuesPanel'
import { SchemaCanvas } from './components/SchemaCanvas'
import { SchemaInspector } from './components/SchemaInspector'
import { SqlPanel } from './components/SqlPanel'
import { SqlTab } from './components/SqlTab'
import { Toolbar } from './components/Toolbar'
import {
  applyGeneratedSql,
  getPgliteStatus,
  getSchemaFromDb,
  listTables,
} from './integration/pgliteService'
import { generateSql } from './schema-core/sqlGenerator'
import { useSchemaStore } from './store/schemaStore'

type TabId = 'schema' | 'sql' | 'data'

function App() {
  const init = useSchemaStore((state) => state.init)
  const schema = useSchemaStore((state) => state.history.present)
  const loadFromRuntimeSchema = useSchemaStore((state) => state.loadFromRuntimeSchema)
  const undo = useSchemaStore((state) => state.undo)
  const redo = useSchemaStore((state) => state.redo)
  const [activeTab, setActiveTab] = useState<TabId>('schema')
  const [runtimeMessage, setRuntimeMessage] = useState('Initializing PGLite…')
  const [dbStatus, setDbStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    void init()
  }, [init])

  useEffect(() => {
    void (async () => {
      const status = await getPgliteStatus()
      setDbStatus(status)
      if (status === 'ready') {
        setRuntimeMessage('PGLite ready')
        const existingSchema = await getSchemaFromDb()
        if (existingSchema) {
          loadFromRuntimeSchema(existingSchema)
        }
      } else if (status === 'error') {
        setRuntimeMessage('PGLite failed to start')
      }
    })()
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
    const tables = await listTables()
    if (tables.length > 0) {
      const accepted = window.confirm(
        `Apply will drop ${tables.length} existing table(s) in PGLite and recreate from your diagram. Continue?`,
      )
      if (!accepted) {
        return
      }
    }

    setRuntimeMessage('Applying schema…')
    const sql = generateSql(schema)
    const result = await applyGeneratedSql(sql)
    if (!result.ok) {
      setRuntimeMessage(`Apply failed: ${result.error ?? 'Unknown error'}`)
      return
    }

    const synced = await getSchemaFromDb()
    if (synced) {
      loadFromRuntimeSchema(synced)
    }
    setRuntimeMessage('Schema applied to PGLite')
  }

  return (
    <div className="appRoot">
      <header className="appHeader">
        <div className="brand">
          <h1>Database Lab</h1>
          <p className="muted tagline">Design schemas visually, test them in-browser with PGLite</p>
        </div>
        <nav className="tabs" aria-label="Main navigation">
          <button
            className={activeTab === 'schema' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('schema')}
            aria-current={activeTab === 'schema' ? 'page' : undefined}
          >
            Schema
          </button>
          <button
            className={activeTab === 'sql' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('sql')}
          >
            SQL
          </button>
          <button
            className={activeTab === 'data' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('data')}
          >
            Data
          </button>
        </nav>
        <span className={`chip ${dbStatus === 'ready' ? 'ok' : dbStatus === 'error' ? 'error' : ''}`}>
          {dbStatus === 'ready' ? 'PGLite connected' : dbStatus === 'error' ? 'PGLite error' : 'Starting…'}
        </span>
      </header>

      <Toolbar activeTab={activeTab} onApplyToRuntime={applyToRuntime} />

      {activeTab === 'schema' && (
        <main className="layout">
          <section className="canvasPane" aria-label="Schema diagram canvas">
            <SchemaCanvas />
          </section>
          <section className="sidePane">
            <SchemaInspector />
            <IssuesPanel />
            <SqlPanel />
            <p className="muted statusLine">{runtimeMessage}</p>
          </section>
        </main>
      )}

      {activeTab === 'sql' && <SqlTab />}
      {activeTab === 'data' && <DataTab />}
    </div>
  )
}

export default App
