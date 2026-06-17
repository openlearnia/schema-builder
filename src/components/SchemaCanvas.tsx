import { useMemo } from 'react'
import { Background, Controls, type Edge, type Node, ReactFlow } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useSchemaStore } from '../store/schemaStore'
import { createId } from '../schema-core/utils'

export function SchemaCanvas() {
  const schema = useSchemaStore((state) => state.history.present)
  const dispatch = useSchemaStore((state) => state.dispatch)
  const setSelectedTable = useSchemaStore((state) => state.setSelectedTable)

  const nodes = useMemo<Node[]>(
    () =>
      schema.tables.map((table) => ({
        id: table.id,
        position: table.position ?? { x: 80, y: 80 },
        data: {
          label: (
            <div style={{ minWidth: 180 }}>
              <strong>{table.name}</strong>
              <ul style={{ margin: '8px 0 0', paddingLeft: 16 }}>
                {table.columns.map((column) => (
                  <li key={column.id}>
                    {table.primaryKey.includes(column.id) ? '[PK] ' : ''}
                    {column.name}: {column.type}
                    {!column.nullable ? ' NOT NULL' : ''}
                  </li>
                ))}
              </ul>
            </div>
          ),
        },
      })),
    [schema.tables],
  )

  const edges = useMemo<Edge[]>(
    () =>
      schema.tables.flatMap((table) =>
        table.foreignKeys.map((fk) => ({
          id: fk.id || createId('edge'),
          source: table.id,
          target: fk.toTableId,
          label: 'FK',
        })),
      ),
    [schema.tables],
  )

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        onNodeDragStop={(_, node) => {
          dispatch({
            type: 'set_table_position',
            payload: { tableId: node.id, x: node.position.x, y: node.position.y },
          })
        }}
        onNodeClick={(_, node) => setSelectedTable(node.id)}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  )
}
