import { useMemo } from 'react'
import { useSchemaStore } from '../store/schemaStore'

export function SchemaInspector() {
  const selectedTableId = useSchemaStore((state) => state.selectedTableId)
  const schema = useSchemaStore((state) => state.history.present)
  const dispatch = useSchemaStore((state) => state.dispatch)

  const selectedTable = useMemo(
    () => schema.tables.find((table) => table.id === selectedTableId) ?? schema.tables[0],
    [schema.tables, selectedTableId],
  )

  if (!selectedTable) {
    return (
      <section className="panel">
        <h3>Inspector</h3>
        <p className="muted">Create a table to get started.</p>
      </section>
    )
  }

  return (
    <section className="panel">
      <h3>Inspector</h3>
      <label className="field">
        <span>Table name</span>
        <input
          value={selectedTable.name}
          onChange={(event) =>
            dispatch({
              type: 'rename_table',
              payload: { tableId: selectedTable.id, name: event.target.value },
            })
          }
        />
      </label>

      <div className="row">
        <button
          onClick={() =>
            dispatch({
              type: 'add_column',
              payload: { tableId: selectedTable.id },
            })
          }
        >
          Add column
        </button>
        <button
          className="danger"
          onClick={() => {
            const accepted = window.confirm(
              `Delete table "${selectedTable.name}"? This is a destructive change.`,
            )
            if (accepted) {
              dispatch({
                type: 'delete_table',
                payload: { tableId: selectedTable.id },
              })
            }
          }}
        >
          Delete table
        </button>
      </div>

      <h4>Columns</h4>
      <div className="stack">
        {selectedTable.columns.map((column) => (
          <div key={column.id} className="columnRow">
            <input
              value={column.name}
              onChange={(event) =>
                dispatch({
                  type: 'update_column',
                  payload: {
                    tableId: selectedTable.id,
                    columnId: column.id,
                    patch: { name: event.target.value },
                  },
                })
              }
            />
            <input
              value={column.type}
              onChange={(event) =>
                dispatch({
                  type: 'update_column',
                  payload: {
                    tableId: selectedTable.id,
                    columnId: column.id,
                    patch: { type: event.target.value },
                  },
                })
              }
            />
          </div>
        ))}
      </div>
    </section>
  )
}
