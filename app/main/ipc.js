'use strict';
/**
 * IPC Handler Registry for ICMP Flood DoS Live Demonstration.
 * Connects Renderer requests to Main Process Services.
 */
const { ipcMain, dialog, shell } = require('electron');
const fs = require('fs');

function setupIPC({ labManager, logService, metricsService, attackService, terminalService, getMainWindow }) {
  // --- Lab Controls ---
  ipcMain.handle('lab:start', async () => {
    return labManager.start();
  });

  ipcMain.handle('lab:stop', async () => {
    return labManager.stop();
  });

  ipcMain.handle('lab:reset', async () => {
    return labManager.reset();
  });

  ipcMain.handle('lab:status', async () => {
    return labManager.getStatus();
  });

  // --- Attack & Defense Controls ---
  ipcMain.handle('attack:startFlood', async (_, durationSeconds) => {
    return attackService.startFlood(durationSeconds, labManager.isSimulated);
  });

  ipcMain.handle('attack:applyMitigation', async () => {
    return attackService.applyMitigation(labManager.isSimulated);
  });

  ipcMain.handle('attack:removeMitigation', async () => {
    return attackService.removeMitigation(labManager.isSimulated);
  });

  // --- Terminal ---
  ipcMain.handle('terminal:open', async () => {
    return labManager.openTerminal();
  });

  ipcMain.handle('terminal:write', async (_, data) => {
    return terminalService.write('icmp-flood', data);
  });

  ipcMain.handle('terminal:interrupt', async () => {
    return terminalService.interrupt('icmp-flood');
  });

  // --- Logs ---
  ipcMain.handle('log:get', async () => {
    return logService.get('icmp-flood');
  });

  ipcMain.handle('log:export', async () => {
    const win = getMainWindow();
    const text = logService.toText('icmp-flood', { title: 'ICMP Flood DoS Demonstration Activity Log' });
    const defaultPath = `icmp-flood-log-${Date.now()}.txt`;

    const { filePath } = await dialog.showSaveDialog(win, {
      title: 'Export Activity Log',
      defaultPath,
      filters: [{ name: 'Text Documents', extensions: ['txt'] }],
    });

    if (filePath) {
      fs.writeFileSync(filePath, text, 'utf8');
      return { success: true, path: filePath };
    }
    return { success: false, cancelled: true };
  });

  // --- Push Events to Renderer ---
  labManager.on('status', (status) => {
    const win = getMainWindow();
    if (win && !win.isDestroyed()) win.webContents.send('lab:statusChanged', status);
  });

  metricsService.on('data', (payload) => {
    const win = getMainWindow();
    if (win && !win.isDestroyed()) win.webContents.send('metrics:data', payload);
  });

  attackService.on('floodState', (payload) => {
    const win = getMainWindow();
    if (win && !win.isDestroyed()) win.webContents.send('attack:floodState', payload);
  });

  attackService.on('mitigationState', (payload) => {
    const win = getMainWindow();
    if (win && !win.isDestroyed()) win.webContents.send('attack:mitigationState', payload);
  });

  terminalService.on('data', ({ data }) => {
    const win = getMainWindow();
    if (win && !win.isDestroyed()) win.webContents.send('terminal:data', data);
  });

  logService.on('event', (entry) => {
    const win = getMainWindow();
    if (win && !win.isDestroyed()) win.webContents.send('log:event', entry);
  });
}

module.exports = { setupIPC };
