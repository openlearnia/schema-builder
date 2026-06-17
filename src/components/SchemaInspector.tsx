import { useMemo, useState } from 'react'
import { useSchemaStore } from '../store/schemaStore'

export function SchemaInspector() {
  const selectedTableId = useSchemaStore((state) => state.selectedTableId)
  const schema = useSchemaStore((state) => state.history.present)
  const dispatch = useSchemaStore((state) => state.dispatch)

  const [fkFromColumnId, setFkFromColumnId] = useState('')
  const [fkToTableId, setFkToTableId] = useState('')
  const [fkToColumnId, setFkToColumnId] = useState('')

  const selectedTable = useMemo(
    () => schema.tables.find((table) => table.id === selectedTableId) ?? schema.tables[0],
    [schema.tables, selectedTableId],
  )

  const otherTables = useMemo(
    () => schema.tables.filter((table) => table.id !== selectedTable?.id),
    [schema.tables, selectedTable?.id],
  )

  const targetColumns = useMemo(() => {
    const target = schema.tables.find((table) => table.id === fkToTableId)
    return target?.columns ?? []
  }, [schema.tables, fkToTableId])

  if (!selectedTable) {
    return (
      <section className="panel">
        <h3>Inspector</h3>
        <p className="muted">Create a table to get started.</p>
      </section>
    )
  }

  function addForeignKey() {
    if (!fkFromColumnId || !fkToTableId || !fkToColumnId) {
      return
    }
    dispatch({
      type: 'add_fk',
      payload: {
        tableId: selectedTable.id,
        fromColumnId: fkFromColumnId,
        toTableId: fkToTableId,
        toColumnId: fkToColumnId,
      },
    })
    setFkFromColumnId('')
    setFkToTableId('')
    setFkToColumnId('')
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
              `Delete table "${selectedTable.name}"? This removes it from the diagram only until you apply.`,
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
        {selectedTable.columns.map((column) => {
          const isPrimary = selectedTable.primaryKey.includes(column.id)
          return (
            <div key={column.id} className="columnCard">
              <div className="columnRow">
                <input
                  value={column.name}
                  aria-label={`Column name ${column.name}`}
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
                  aria-label={`Column type ${column.name}`}
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
              <div className="row columnFlags">
                <label className="checkLabel">
                  <input
                    type="checkbox"
                    checked={isPrimary}
                    onChange={() =>
                      dispatch({
                        type: 'toggle_primary_key',
                        payload: { tableId: selectedTable.id, columnId: column.id },
                      })
                    }
                  />
                  Primary key
                </label>
                <label className="checkLabel">
                  <input
                    type="checkbox"
                    checked={column.nullable}
                    onChange={(event) =>
                      dispatch({
                        type: 'update_column',
                        payload: {
                          tableId: selectedTable.id,
                          columnId: column.id,
                          patch: { nullable: event.target.checked },
                        },
                      })
                    }
                  />
                  Nullable
                </label>
              </div>
            </div>
          )
        })}
      </div>

      <h4>Foreign keys</h4>
      {selectedTable.foreignKeys.length === 0 && (
        <p className="muted">No foreign keys on this table.</p>
      )}
      <ul className="fkList">
        {selectedTable.foreignKeys.map((fk) => {
          const fromColumn = selectedTable.columns.find((column) => column.id === fk.fromColumnId)
          const targetTable = schema.tables.find((table) => table.id === fk.toTableId)
          const targetColumn = targetTable?.columns.find((column) => column.id === fk.toColumnId)
          return (
            <li key={fk.id} className="fkItem">
              <span>
                {fromColumn?.name ?? '?'} → {targetTable?.name ?? '?'}.{targetColumn?.name ?? '?'}
              </span>
              <button
                className="ghost dangerText"
                onClick={() =>
                  dispatch({
                    type: 'remove_fk',
                    payload: { tableId: selectedTable.id, fkId: fk.id },
                  })
                }
              >
                Remove
              </button>
            </li>
          )
        })}
      </ul>

      {otherTables.length > 0 && (
        <div className="fkForm stack">
          <label className="field">
            <span>From column</span>
            <select
              value={fkFromColumnId}
              onChange={(event) => setFkFromColumnId(event.target.value)}
            >
              <option value="">Select column…</option>
              {selectedTable.columns.map((column) => (
                <option key={column.id} value={column.id}>
                  {column.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Target table</span>
            <select
              value={fkToTableId}
              onChange={(event) => {
                setFkToTableId(event.target.value)
                setFkToColumnId('')
              }}
            >
              <option value="">Select table…</option>
              {otherTables.map((table) => (
                <option key={table.id} value={table.id}>
                  {table.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Target column</span>
            <select
              value={fkToColumnId}
              disabled={!fkToTableId}
              onChange={(event) => setFkToColumnId(event.target.value)}
            >
              <option value="">Select column…</option>
              {targetColumns.map((column) => (
                <option key={column.id} value={column.id}>
                  {column.name}
                </option>
              ))}
            </select>
          </label>
          <button onClick={addForeignKey} disabled={!fkFromColumnId || !fkToTableId || !fkToColumnId}>
            Add foreign key
          </button>
        </div>
      )}
    </section>
  )
}
