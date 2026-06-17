import { memo } from 'react'
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'

export type TableNodeColumn = {
  id: string
  name: string
  type: string
  nullable: boolean
  isPrimary: boolean
}

export type TableNodeData = {
  tableName: string
  columns: TableNodeColumn[]
}

export type TableFlowNode = Node<TableNodeData, 'tableNode'>

function TableNodeComponent({ data, selected }: NodeProps<TableFlowNode>) {
  return (
    <div className={`er-table-node${selected ? ' selected' : ''}`}>
      <Handle type="target" position={Position.Left} className="er-handle" />
      <header className="er-table-header">{data.tableName}</header>
      <ul className="er-table-columns">
        {data.columns.map((column) => (
          <li key={column.id} className="er-column-row">
            <span className="er-column-name">
              {column.isPrimary && <span className="pk-badge" title="Primary key">PK</span>}
              {column.name}
            </span>
            <span className="er-column-meta">
              <span className="type-badge">{column.type}</span>
              {!column.nullable && <span className="nn-badge">NN</span>}
            </span>
          </li>
        ))}
      </ul>
      <Handle type="source" position={Position.Right} className="er-handle" />
    </div>
  )
}

export const TableNode = memo(TableNodeComponent)
