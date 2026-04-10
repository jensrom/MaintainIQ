const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'default',
    title: 'TimeTracker',
    show: false,
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ─── IPC: Database file path ───────────────────────────────────────────────

const CONFIG_PATH = path.join(app.getPath('userData'), 'config.json');

function readConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    }
  } catch (_) {}
  return {};
}

function writeConfig(data) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2), 'utf8');
}

ipcMain.handle('get-db-path', () => {
  const config = readConfig();
  return config.dbPath || '';
});

ipcMain.handle('choose-db-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Vælg mappe til databasefil',
  });
  if (result.canceled || !result.filePaths.length) return null;
  const folder = result.filePaths[0];
  const config = readConfig();
  config.dbPath = folder;
  writeConfig(config);
  return folder;
});

// ─── IPC: Read / write JSON database ──────────────────────────────────────

ipcMain.handle('db-read', (_, dbPath) => {
  const filePath = path.join(dbPath, 'time-tracker.json');
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_) {
    return null;
  }
});

ipcMain.handle('db-write', (_, dbPath, data) => {
  const filePath = path.join(dbPath, 'time-tracker.json');
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('db-write error:', err);
    return false;
  }
});

// ─── IPC: Open folder in explorer ─────────────────────────────────────────

ipcMain.handle('open-folder', (_, folderPath) => {
  shell.openPath(folderPath);
});

// ─── IPC: Export (placeholder — implement with exceljs if needed) ──────────

ipcMain.handle('export-csv', async (_, csvContent, defaultFileName) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultFileName,
    filters: [{ name: 'CSV', extensions: ['csv'] }],
  });
  if (result.canceled || !result.filePath) return false;
  fs.writeFileSync(result.filePath, csvContent, 'utf8');
  return true;
});
