const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
  });

  mainWindow.loadFile(path.join(__dirname, 'frontend', 'index.html'));
  
  // Remove DevTools for production
  // mainWindow.webContents.openDevTools();

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startBackend() {
  const backendPath = path.join(__dirname, 'backend', 'dist', 'index.js');
  
  backendProcess = spawn('node', [backendPath], {
    cwd: path.join(__dirname, 'backend'),
    env: { 
      ...process.env, 
      PORT: '5000', 
      NODE_ENV: 'production',
      ALLOWED_ORIGINS: 'http://localhost:5173,http://localhost:5000,file://'
    },
  });

  backendProcess.on('error', (error) => {
    console.error('Backend error:', error);
  });
}

app.on('ready', () => {
  startBackend();
  setTimeout(createWindow, 3000);
});

app.on('window-all-closed', () => {
  if (backendProcess) backendProcess.kill();
  app.quit();
});

app.on('before-quit', () => {
  if (backendProcess) backendProcess.kill();
});
