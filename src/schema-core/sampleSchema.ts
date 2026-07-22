import type { SchemaIR } from './types'

export function createBlogSampleSchema(): SchemaIR {
  const usersTableId = 'sample-users'
  const usersIdColumnId = 'sample-users-id'
  const postsTableId = 'sample-posts'
  const postsIdColumnId = 'sample-posts-id'

  return {
    version: 1,
    dialect: 'postgres',
    tables: [
      {
        id: usersTableId,
        name: 'users',
        columns: [
          { id: usersIdColumnId, name: 'id', type: 'integer', nullable: false },
          { id: 'sample-users-email', name: 'email', type: 'text', nullable: false },
        ],
        primaryKey: [usersIdColumnId],
        uniques: [{ id: 'sample-users-email-unique', columns: ['sample-users-email'] }],
        checks: [],
        indexes: [],
        foreignKeys: [],
        position: { x: 80, y: 80 },
      },
      {
        id: postsTableId,
        name: 'posts',
        columns: [
          { id: postsIdColumnId, name: 'id', type: 'integer', nullable: false },
          { id: 'sample-posts-user-id', name: 'user_id', type: 'integer', nullable: false },
          { id: 'sample-posts-title', name: 'title', type: 'text', nullable: false },
        ],
        primaryKey: [postsIdColumnId],
        uniques: [],
        checks: [],
        indexes: [],
        foreignKeys: [
          {
            id: 'sample-posts-user-id-fk',
            fromColumnId: 'sample-posts-user-id',
            toTableId: usersTableId,
            toColumnId: usersIdColumnId,
            onDelete: 'CASCADE',
            onUpdate: 'NO ACTION',
          },
        ],
        position: { x: 360, y: 80 },
      },
    ],
    enums: [],
    rawSqlBlocks: [],
    meta: {
      revision: 0,
      updatedAt: '2026-07-22T00:00:00.000Z',
    },
  }
}
