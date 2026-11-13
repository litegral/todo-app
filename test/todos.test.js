const test = require('node:test');
const assert = require('node:assert/strict');
const { openDatabase, closeDatabase } = require('../src/main/database');
const todos = require('../src/main/todos');

test.beforeEach(() => {
  openDatabase(':memory:');
});

test.afterEach(() => {
  closeDatabase();
});

test('starts with an empty list', () => {
  assert.deepEqual(todos.listTodos(), []);
});

test('creates a todo and trims the title', () => {
  const todo = todos.createTodo('  Buy milk  ');

  assert.equal(todo.title, 'Buy milk');
  assert.equal(todo.completed, false);
  assert.equal(typeof todo.id, 'number');
  assert.equal(todos.listTodos().length, 1);
});

test('rejects empty and non-string titles', () => {
  assert.throws(() => todos.createTodo('   '), /cannot be empty/);
  assert.throws(() => todos.createTodo(42), /must be a string/);
});

test('rejects titles over 200 characters', () => {
  assert.throws(() => todos.createTodo('a'.repeat(201)), /200 characters/);
});

test('updates a title and a missing id returns null', () => {
  const todo = todos.createTodo('Old');

  assert.equal(todos.updateTodo(todo.id, 'New').title, 'New');
  assert.equal(todos.updateTodo(9999, 'Nope'), null);
});

test('toggles completion and keeps a stable order', () => {
  const first = todos.createTodo('First');
  const second = todos.createTodo('Second');

  todos.setCompleted(first.id, true);

  const ordered = todos.listTodos();
  assert.deepEqual(
    ordered.map((todo) => todo.id),
    [second.id, first.id],
  );
  assert.equal(ordered[1].completed, true);
});

test('deletes a single todo', () => {
  const todo = todos.createTodo('Temporary');

  assert.equal(todos.deleteTodo(todo.id), true);
  assert.equal(todos.deleteTodo(todo.id), false);
  assert.deepEqual(todos.listTodos(), []);
});

test('clears only completed todos', () => {
  const first = todos.createTodo('Keep');
  const second = todos.createTodo('Done');
  todos.setCompleted(second.id, true);

  assert.equal(todos.clearCompleted(), 1);
  assert.deepEqual(
    todos.listTodos().map((todo) => todo.id),
    [first.id],
  );
});

test('persists across connections', () => {
  const file = require('node:path').join(
    require('node:os').tmpdir(),
    `todo-test-${process.pid}-${Date.now()}.db`,
  );

  openDatabase(file);
  todos.createTodo('Persisted');
  closeDatabase();

  openDatabase(file);
  assert.equal(todos.listTodos()[0].title, 'Persisted');
  closeDatabase();

  require('node:fs').rmSync(file, { force: true });
  require('node:fs').rmSync(`${file}-wal`, { force: true });
  require('node:fs').rmSync(`${file}-shm`, { force: true });
});
