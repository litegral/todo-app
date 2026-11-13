const { getDb } = require('./database');

const MAX_TITLE_LENGTH = 200;

function toTodo(row) {
  return {
    id: row.id,
    title: row.title,
    completed: Boolean(row.completed),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeTitle(title) {
  if (typeof title !== 'string') {
    throw new TypeError('Title must be a string');
  }

  const trimmed = title.trim();

  if (!trimmed) {
    throw new Error('Title cannot be empty');
  }

  if (trimmed.length > MAX_TITLE_LENGTH) {
    throw new Error(`Title cannot be longer than ${MAX_TITLE_LENGTH} characters`);
  }

  return trimmed;
}

function normalizeId(id) {
  if (!Number.isInteger(id) || id <= 0) {
    throw new TypeError('Todo id must be a positive integer');
  }
  return id;
}

function listTodos() {
  const rows = getDb()
    .prepare(
      `SELECT id, title, completed, created_at, updated_at
       FROM todos
       ORDER BY id DESC`,
    )
    .all();

  return rows.map(toTodo);
}

function getTodo(id) {
  const row = getDb()
    .prepare(
      `SELECT id, title, completed, created_at, updated_at
       FROM todos
       WHERE id = ?`,
    )
    .get(normalizeId(id));

  return row ? toTodo(row) : null;
}

function createTodo(title) {
  const result = getDb()
    .prepare('INSERT INTO todos (title) VALUES (?)')
    .run(normalizeTitle(title));

  return getTodo(Number(result.lastInsertRowid));
}

function updateTodo(id, title) {
  const result = getDb()
    .prepare(
      `UPDATE todos
       SET title = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
    )
    .run(normalizeTitle(title), normalizeId(id));

  return result.changes > 0 ? getTodo(id) : null;
}

function setCompleted(id, completed) {
  const result = getDb()
    .prepare(
      `UPDATE todos
       SET completed = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
    )
    .run(completed ? 1 : 0, normalizeId(id));

  return result.changes > 0 ? getTodo(id) : null;
}

function deleteTodo(id) {
  const result = getDb().prepare('DELETE FROM todos WHERE id = ?').run(normalizeId(id));
  return result.changes > 0;
}

function clearCompleted() {
  return getDb().prepare('DELETE FROM todos WHERE completed = 1').run().changes;
}

module.exports = {
  listTodos,
  createTodo,
  updateTodo,
  setCompleted,
  deleteTodo,
  clearCompleted,
};
