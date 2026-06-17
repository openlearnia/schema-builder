import { useSchemaStore } from '../store/schemaStore'

type TabId = 'schema' | 'sql' | 'data'

interface ToolbarProps {
  activeTab: TabId
  onApplyToRuntime: () => Promise<void>
}

export function Toolbar({ activeTab, onApplyToRuntime }: ToolbarProps) {
  const dispatch = useSchemaStore((state) => state.dispatch)
  const undo = useSchemaStore((state) => state.undo)
  const redo = useSchemaStore((state) => state.redo)
  const issues = useSchemaStore((state) => state.issues)
  const syncStatus = useSchemaStore((state) => state.syncStatus)

  const blockingErrors = issues.filter((issue) => issue.severity === 'error').length

  return (
    <header className="toolbar">
      <div className="row">
        {activeTab === 'schema' && (
          <button onClick={() => dispatch({ type: 'add_table', payload: {} })}>Add table</button>
        )}
        {activeTab === 'schema' && (
          <>
            <button onClick={undo}>Undo</button>
            <button onClick={redo}>Redo</button>
          </>
        )}
      </div>
      <div className="row">
        <span className={`chip ${syncStatus}`}>Sync: {syncStatus}</span>
        <span className={`chip ${blockingErrors > 0 ? 'error' : 'ok'}`}>
          {blockingErrors > 0 ? `${blockingErrors} blocking issues` : 'No blocking issues'}
        </span>
        <button
          onClick={() => void onApplyToRuntime()}
          disabled={blockingErrors > 0}
          aria-label="Apply schema to pglite runtime"
        >
          Apply to PGLite
        </button>
      </div>
    </header>
  )
}
