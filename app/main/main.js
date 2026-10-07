'use strict';
/**
 * Main process entry point for ICMP Flood DoS Live Demonstration application.
 */
const { app, BrowserWindow } = require('electron');
const path = require('path');
const { LogService } = require('./logService');
const { MetricsService } = require('./metricsService');
const { AttackService } = require('./attackService');
const { TerminalService } = require('./terminalService');
const { LabManager } = require('./labManager');
const { setupIPC } = require('./ipc');

let mainWindow = null;

const composeDir = path.resolve(__dirname, '../..');

// Services
const logs = new LogService();
const attack = new AttackService({ logs });
const metrics = new MetricsService({ attackService: attack });
const terminals = new TerminalService();
const labManager = new LabManager({
  composeDir,
  logs,
  metrics,
  attack,
  terminals,
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1080,
    minHeight: 720,
    title: 'ICMP Flood — Live Demonstration',
    backgroundColor: '#f3f4f6',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  setupIPC({
    labManager,
    logService: logs,
    metricsService: metrics,
    attackService: attack,
    terminalService: terminals,
    getMainWindow: () => mainWindow,
  });

  // Startup orphan cleanup
  await labManager.cleanupOrphans().catch(() => {});

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', async () => {
  await labManager.shutdown().catch(() => {});
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', async (e) => {
  e.preventDefault();
  try {
    await labManager.shutdown();
  } finally {
    process.exit(0);
  }
});
