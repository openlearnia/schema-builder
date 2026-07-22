import { useMemo } from 'react'
import { Background, Controls, type NodeTypes, ReactFlow } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { createBlogSampleSchema } from '../schema-core/sampleSchema'
import { useSchemaStore } from '../store/schemaStore'
import { createId } from '../schema-core/utils'
import { TableNode, type TableFlowNode } from './TableNode'

const nodeTypes: NodeTypes = {
  tableNode: TableNode,
}

export function SchemaCanvas() {
  const schema = useSchemaStore((state) => state.history.present)
  const selectedTableId = useSchemaStore((state) => state.selectedTableId)
  const dispatch = useSchemaStore((state) => state.dispatch)
  const setSelectedTable = useSchemaStore((state) => state.setSelectedTable)

  const nodes = useMemo<TableFlowNode[]>(
    () =>
      schema.tables.map((table) => ({
        id: table.id,
        type: 'tableNode',
        position: table.position ?? { x: 80, y: 80 },
        selected: table.id === selectedTableId,
        data: {
          tableName: table.name,
          columns: table.columns.map((column) => ({
            id: column.id,
            name: column.name,
            type: column.type,
            nullable: column.nullable,
            isPrimary: table.primaryKey.includes(column.id),
          })),
        },
      })),
    [schema.tables, selectedTableId],
  )

  const edges = useMemo(
    () =>
      schema.tables.flatMap((table) =>
        table.foreignKeys.map((fk) => ({
          id: fk.id || createId('edge'),
          source: table.id,
          target: fk.toTableId,
          label: 'FK',
          className: 'er-edge',
        })),
      ),
    [schema.tables],
  )

  if (schema.tables.length === 0) {
    return (
      <div className="schema-canvas empty-canvas">
        <div className="empty-cta">
          <p>Start a schema</p>
          <span className="muted">Add your first table or explore a working blog example.</span>
          <div className="row">
            <button type="button" onClick={() => dispatch({ type: 'add_table', payload: {} })}>
              Add table
            </button>
            <button
              type="button"
              className="ghost"
              onClick={() =>
                dispatch({ type: 'import_schema', payload: { schema: createBlogSampleSchema() } })
              }
            >
              Load sample (users + posts)
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="schema-canvas">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        colorMode="dark"
        fitView
        onNodeDragStop={(_, node) => {
          dispatch({
            type: 'set_table_position',
            payload: { tableId: node.id, x: node.position.x, y: node.position.y },
          })
        }}
        onNodeClick={(_, node) => setSelectedTable(node.id)}
      >
        <Background gap={20} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
}
