# Todo App

A small desktop todo list built with **Electron** and **SQLite**.

Add, edit, complete, and delete todos. Todos are saved to a SQLite database, so
they survive closing the app.

## Requirements

- **Node.js 24 or newer** (the tests use the built-in `node:sqlite` module)
- npm

## Getting started

```bash
npm install
npm start
```

That's it. `npm start` opens the app window.

## Project structure

```
src/
├── main/                 Electron main process (Node.js side)
│   ├── main.js           App startup, window creation, lifecycle
│   ├── database.js       Opens the SQLite file and creates the schema
│   ├── todos.js          All todo queries + input validation
│   └── ipc.js            Message handlers the UI can call
├── preload/
│   └── preload.js        Safely exposes `window.api` to the UI
└── renderer/             The UI (browser side)
    ├── index.html        Markup
    ├── styles.css        Styling (dark theme)
    └── app.js            UI state, rendering, click handlers

test/
└── todos.test.js         Unit tests for the data layer
```

The rule of thumb: **`main/` owns data, `renderer/` owns pixels.** The UI never
touches SQL directly.

## How it fits together

Electron runs two processes, and they can't call each other's code directly:

```
renderer/app.js          src/renderer/
      │
      │  window.api.todos.create('Buy milk')
      ▼
preload/preload.js       src/preload/   ← the only bridge
      │
      │  ipcRenderer.invoke('todos:create', title)
      ▼
main/ipc.js              src/main/       ← 'todos:create' handler
      │
      │  todos.createTodo(title)
      ▼
main/todos.js → main/database.js → todos.db
```

So adding a new feature usually means touching four files in the same order:
`todos.js` (the query) → `ipc.js` (the handler) → `preload.js` (the bridge) →
`renderer/app.js` (the UI). The channel strings live in `CHANNELS` in `ipc.js`.

## Where the data lives

The database is a normal SQLite file named `todos.db`, created on first launch in
Electron's per-user data folder:

| Platform | Location |
| --- | --- |
| Windows | `%APPDATA%\todo-app\todos.db` |
| macOS | `~/Library/Application Support/todo-app/todos.db` |
| Linux | `~/.config/todo-app/todos.db` |

There is no SQLite package in `package.json` — this app uses
**`node:sqlite`**, which is built into Node. Nothing to compile or rebuild.

To start over with a clean database, quit the app and delete `todos.db` (plus any
`todos.db-wal` / `todos.db-shm` files next to it).

## Tests

```bash
npm test
```

The data layer is tested without launching Electron: `database.js` accepts a file
path, so tests point it at an in-memory database (`:memory:`). If you change a
query in `todos.js`, add or update a test there.

## Things worth knowing before you edit

- **Security settings are intentional.** The window runs with `contextIsolation`,
  `sandbox`, and no `nodeIntegration`. The UI can only reach the functions listed in
  `preload.js`. Don't add `require()` to renderer code — add a function to the
  preload bridge instead.
- **Titles are validated in the main process** (`todos.js`): trimmed, non-empty,
  max 200 characters. The `maxlength` in the HTML is just a convenience.
- **The titlebar height is defined twice** — `TITLEBAR_HEIGHT` in `main.js` and
  `--titlebar-height` in `styles.css`. They must stay equal, or the bottom border
  of the titlebar will be clipped behind the window control buttons.
- **Todos are ordered newest first** and the order stays stable when you toggle
  one complete, so rows don't jump around under the cursor.
