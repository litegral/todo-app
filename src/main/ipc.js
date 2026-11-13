const { ipcMain } = require('electron');
const todos = require('./todos');

const CHANNELS = {
  list: 'todos:list',
  create: 'todos:create',
  update: 'todos:update',
  setCompleted: 'todos:set-completed',
  remove: 'todos:delete',
  clearCompleted: 'todos:clear-completed',
};

function registerTodoHandlers() {
  ipcMain.handle(CHANNELS.list, () => todos.listTodos());
  ipcMain.handle(CHANNELS.create, (_event, title) => todos.createTodo(title));
  ipcMain.handle(CHANNELS.update, (_event, id, title) => todos.updateTodo(id, title));
  ipcMain.handle(CHANNELS.setCompleted, (_event, id, completed) =>
    todos.setCompleted(id, Boolean(completed)),
  );
  ipcMain.handle(CHANNELS.remove, (_event, id) => todos.deleteTodo(id));
  ipcMain.handle(CHANNELS.clearCompleted, () => todos.clearCompleted());
}

module.exports = { registerTodoHandlers, CHANNELS };
