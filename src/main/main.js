const path = require('node:path');
const { app, BrowserWindow } = require('electron');
const { openDatabase, closeDatabase } = require('./database');
const { registerTodoHandlers } = require('./ipc');

const isMac = process.platform === 'darwin';

// Must match --titlebar-height in styles.css.
const TITLEBAR_HEIGHT = 44;

const WINDOW_DEFAULTS = {
  width: 560,
  height: 720,
  minWidth: 420,
  minHeight: 480,
  backgroundColor: '#111318',
  autoHideMenuBar: true,
  title: 'Todo',
  ...(isMac
    ? {
        titleBarStyle: 'hiddenInset',
        trafficLightPosition: { x: 16, y: 15 },
      }
    : {
        titleBarStyle: 'hidden',
        titleBarOverlay: {
          color: '#111318',
          symbolColor: '#8b93a3',
          height: TITLEBAR_HEIGHT,
        },
      }),
};

function createWindow() {
  const window = new BrowserWindow({
    ...WINDOW_DEFAULTS,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  window.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
}

app.whenReady().then(() => {
  openDatabase();
  registerTodoHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  closeDatabase();
});
