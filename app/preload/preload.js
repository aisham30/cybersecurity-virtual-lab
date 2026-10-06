'use strict';
/**
 * Preload script securely bridging Main and Renderer process.
 * Enforces contextIsolation: true and nodeIntegration: false.
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('vlab', {
  // Lab Lifecycle
  startLab: () => ipcRenderer.invoke('lab:start'),
  stopLab: () => ipcRenderer.invoke('lab:stop'),
  resetLab: () => ipcRenderer.invoke('lab:reset'),
  getLabStatus: () => ipcRenderer.invoke('lab:status'),

  // Attack & Defense Actions
  startFlood: (durationSeconds) => ipcRenderer.invoke('attack:startFlood', durationSeconds),
  applyMitigation: () => ipcRenderer.invoke('attack:applyMitigation'),
  removeMitigation: () => ipcRenderer.invoke('attack:removeMitigation'),

  // Embedded Terminal
  openTerminal: () => ipcRenderer.invoke('terminal:open'),
  writeTerminal: (data) => ipcRenderer.invoke('terminal:write', data),
  interruptTerminal: () => ipcRenderer.invoke('terminal:interrupt'),

  // Logs
  getLogs: () => ipcRenderer.invoke('log:get'),
  exportLogs: () => ipcRenderer.invoke('log:export'),

  // IPC Event Subscriptions
  onStatusChanged: (callback) => {
    const sub = (_e, data) => callback(data);
    ipcRenderer.on('lab:statusChanged', sub);
    return () => ipcRenderer.removeListener('lab:statusChanged', sub);
  },

  onMetricsData: (callback) => {
    const sub = (_e, data) => callback(data);
    ipcRenderer.on('metrics:data', sub);
    return () => ipcRenderer.removeListener('metrics:data', sub);
  },

  onFloodState: (callback) => {
    const sub = (_e, data) => callback(data);
    ipcRenderer.on('attack:floodState', sub);
    return () => ipcRenderer.removeListener('attack:floodState', sub);
  },

  onMitigationState: (callback) => {
    const sub = (_e, data) => callback(data);
    ipcRenderer.on('attack:mitigationState', sub);
    return () => ipcRenderer.removeListener('attack:mitigationState', sub);
  },

  onTerminalData: (callback) => {
    const sub = (_e, data) => callback(data);
    ipcRenderer.on('terminal:data', sub);
    return () => ipcRenderer.removeListener('terminal:data', sub);
  },

  onLogEvent: (callback) => {
    const sub = (_e, data) => callback(data);
    ipcRenderer.on('log:event', sub);
    return () => ipcRenderer.removeListener('log:event', sub);
  },
});
