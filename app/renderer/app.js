'use strict';
/**
 * Renderer Process JavaScript for ICMP Flood DoS Live Demonstration.
 * Connects UI to Main process via safe `window.vlab` contextBridge API.
 */

// Application State
const state = {
  status: 'Stopped',
  isBusy: false,
  floodRunning: false,
  mitigationActive: false,
  terminal: null,
  terminalFitAddon: null,
  
  // 30-second rolling telemetry window
  historyLength: 30,
  metrics: {
    cpu: new Array(30).fill(0),
    pps: new Array(30).fill(0),
    events: new Array(30).fill(null), // Stores event markers: 'flood', 'mitigation-on', 'mitigation-off'
  },
};

// DOM Elements
const elements = {
  // Status Pill
  statusPill: document.getElementById('lab-status-pill'),
  statusText: document.getElementById('lab-status-text'),

  // Controls
  btnStartLab: document.getElementById('btn-start-lab'),
  btnStopLab: document.getElementById('btn-stop-lab'),
  btnResetLab: document.getElementById('btn-reset-lab'),
  btnLaunchFlood: document.getElementById('btn-launch-flood'),
  toggleMitigation: document.getElementById('toggle-mitigation'),

  // Gauge & Stat Cards
  targetHealthBadge: document.getElementById('target-health-badge'),
  healthGaugeBar: document.getElementById('health-gauge-bar'),
  gaugeStatusDesc: document.getElementById('gauge-status-desc'),
  statCpuVal: document.getElementById('stat-cpu-val'),
  statPpsVal: document.getElementById('stat-pps-val'),
  statMemVal: document.getElementById('stat-mem-val'),

  // Canvases
  chartCpuCanvas: document.getElementById('chart-cpu-canvas'),
  chartPpsCanvas: document.getElementById('chart-pps-canvas'),

  // Terminal & Logs
  termStatusBadge: document.getElementById('term-status-badge'),
  btnTermInterrupt: document.getElementById('btn-term-interrupt'),
  terminalContainer: document.getElementById('terminal-container'),
  logStream: document.getElementById('log-stream'),
  btnExportLog: document.getElementById('btn-export-log'),
};

/* ==========================================================================
   Initialization
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  initTerminal();
  bindEvents();
  setupSubscriptions();
  fetchInitialStatus();
});

function setupSubscriptions() {
  if (!window.vlab) return;

  window.vlab.onStatusChanged((status) => {
    updateStatusUI(status);
  });

  window.vlab.onMetricsData((data) => {
    updateMetricsUI(data);
  });

  window.vlab.onFloodState((data) => {
    state.floodRunning = data.running;
    updateControlState();
    if (data.running) {
      addEventMarker('flood');
      appendLogEntry({ ts: new Date().toISOString(), level: 'warn', source: 'attacker', message: '⚡ ICMP Flood launched (15s duration)' });
    }
  });

  window.vlab.onMitigationState((data) => {
    state.mitigationActive = data.active;
    elements.toggleMitigation.checked = data.active;
    addEventMarker(data.active ? 'mitigation-on' : 'mitigation-off');
  });

  window.vlab.onTerminalData((data) => {
    if (state.terminal) state.terminal.write(data);
  });

  window.vlab.onLogEvent((entry) => {
    appendLogEntry(entry);
  });
}

function bindEvents() {
  elements.btnStartLab.addEventListener('click', async () => {
    if (!window.vlab) return;
    elements.btnStartLab.disabled = true;
    await window.vlab.startLab().catch((err) => console.error(err));
    attachTerminal();
  });

  elements.btnStopLab.addEventListener('click', async () => {
    if (!window.vlab) return;
    elements.btnStopLab.disabled = true;
    await window.vlab.stopLab().catch((err) => console.error(err));
    detachTerminal();
    resetTelemetry();
  });

  elements.btnResetLab.addEventListener('click', async () => {
    if (!window.vlab) return;
    elements.btnResetLab.disabled = true;
    await window.vlab.resetLab().catch((err) => console.error(err));
    attachTerminal();
    resetTelemetry();
  });

  elements.btnLaunchFlood.addEventListener('click', async () => {
    if (!window.vlab || state.floodRunning) return;
    await window.vlab.startFlood(15).catch((err) => console.error(err));
  });

  elements.toggleMitigation.addEventListener('change', async (e) => {
    if (!window.vlab) return;
    if (e.target.checked) {
      await window.vlab.applyMitigation().catch(() => { e.target.checked = false; });
    } else {
      await window.vlab.removeMitigation().catch(() => { e.target.checked = true; });
    }
  });

  elements.btnTermInterrupt.addEventListener('click', () => {
    if (window.vlab) window.vlab.interruptTerminal();
  });

  elements.btnExportLog.addEventListener('click', async () => {
    if (!window.vlab) return;
    const res = await window.vlab.exportLogs();
    if (res && res.success) {
      appendLogEntry({ ts: new Date().toISOString(), level: 'success', source: 'app', message: `Activity log exported to: ${res.path}` });
    }
  });
}

async function fetchInitialStatus() {
  if (!window.vlab) return;
  const status = await window.vlab.getLabStatus().catch(() => null);
  if (status) updateStatusUI(status);
}

/* ==========================================================================
   UI State & Control Enabling
   ========================================================================== */
function updateStatusUI(status) {
  state.status = status.status || 'Stopped';
  state.isBusy = !!status.busy;
  state.mitigationActive = !!status.mitigationActive;
  state.floodRunning = !!status.floodRunning;

  const modeText = status.isSimulated && state.status === 'Running' ? 'Running (Simulated)' : state.status;
  elements.statusText.innerText = modeText;
  elements.statusPill.className = `status-pill ${state.status.toLowerCase()}`;

  updateControlState();
}

function updateControlState() {
  const isRunning = state.status === 'Running';
  const isStopped = state.status === 'Stopped';
  const isBusy = state.isBusy;

  elements.btnStartLab.disabled = isBusy || isRunning;
  elements.btnStopLab.disabled = isBusy || isStopped;
  elements.btnResetLab.disabled = isBusy || isStopped;

  elements.btnLaunchFlood.disabled = !isRunning || state.floodRunning;
  elements.toggleMitigation.disabled = !isRunning;
  elements.toggleMitigation.checked = state.mitigationActive;
}

/* ==========================================================================
   Telemetry & Real-Time Canvas Charts
   ========================================================================== */
function resetTelemetry() {
  state.metrics.cpu = new Array(state.historyLength).fill(0);
  state.metrics.pps = new Array(state.historyLength).fill(0);
  state.metrics.events = new Array(state.historyLength).fill(null);

  elements.statCpuVal.innerText = '0%';
  elements.statPpsVal.innerText = '0 PPS';
  elements.statMemVal.innerText = '0 MB';

  updateTargetHealthGauge(0, 0);
  drawCanvasCharts();
}

function addEventMarker(type) {
  state.metrics.events[state.metrics.events.length - 1] = type;
}

function updateMetricsUI(data) {
  const cpuPct = Math.round((data.cpu || 0) * 10) / 10;
  const pps = Math.round(data.pps || 0);
  const memMB = Math.round((data.memMB || 0) * 10) / 10;

  // Stat displays
  elements.statCpuVal.innerText = `${cpuPct}%`;
  elements.statPpsVal.innerText = `${pps.toLocaleString()} PPS`;
  elements.statMemVal.innerText = `${memMB} MB`;

  // Push into rolling window
  state.metrics.cpu.push(cpuPct); state.metrics.cpu.shift();
  state.metrics.pps.push(pps); state.metrics.pps.shift();
  state.metrics.events.push(null); state.metrics.events.shift();

  // Update Server Load Gauge
  updateTargetHealthGauge(cpuPct, pps);

  // Redraw Canvas Charts
  drawCanvasCharts();
}

function updateTargetHealthGauge(cpuPct, pps) {
  // Combine CPU % (0-30%) and Packets (0-50,000 PPS) into target load index
  const cpuFactor = (cpuPct / 30.0) * 50;
  const ppsFactor = Math.min(1.0, pps / 20000) * 50;
  const totalLoad = Math.min(100, Math.max(5, Math.round(cpuFactor + ppsFactor)));

  elements.healthGaugeBar.style.width = `${totalLoad}%`;

  if (totalLoad < 35) {
    elements.healthGaugeBar.style.backgroundColor = 'var(--neo-lime)';
    elements.targetHealthBadge.className = 'health-badge healthy';
    elements.targetHealthBadge.innerText = 'HEALTHY';
    elements.gaugeStatusDesc.innerText = 'Target CPU and packet intake operating within normal baseline parameters.';
  } else if (totalLoad < 70) {
    elements.healthGaugeBar.style.backgroundColor = 'var(--neo-yellow)';
    elements.targetHealthBadge.className = 'health-badge warning';
    elements.targetHealthBadge.innerText = 'ELEVATED LOAD';
    elements.gaugeStatusDesc.innerText = 'Warning: Target server experiencing elevated network packet load.';
  } else {
    elements.healthGaugeBar.style.backgroundColor = 'var(--neo-pink)';
    elements.targetHealthBadge.className = 'health-badge critical';
    elements.targetHealthBadge.innerText = 'CRITICAL (DoS)';
    elements.gaugeStatusDesc.innerText = 'CRITICAL: Target Server Struggling under ICMP Flood DoS Attack!';
  }
}

function drawCanvasCharts() {
  drawSingleChart(elements.chartCpuCanvas, state.metrics.cpu, 30, '#a5b4fc', 'CPU Utilization (%)');
  drawSingleChart(elements.chartPpsCanvas, state.metrics.pps, Math.max(100, Math.max(...state.metrics.pps) * 1.2), '#f472b6', 'Packets/sec (PPS)');
}

function drawSingleChart(canvas, dataSeries, maxVal, lineFillColor, yLabel) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  // Clear Canvas
  ctx.clearRect(0, 0, w, h);

  // Background Grid Lines
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  for (let y = 30; y < h; y += 30) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  const stepX = w / (dataSeries.length - 1);

  // Draw Vertical Event Annotations
  state.metrics.events.forEach((evt, idx) => {
    if (!evt) return;
    const x = idx * stepX;
    ctx.save();
    ctx.lineWidth = 3;
    if (evt === 'flood') {
      ctx.strokeStyle = '#fde047'; // Yellow
      ctx.fillStyle = '#000000';
    } else {
      ctx.strokeStyle = '#bef264'; // Lime
      ctx.fillStyle = '#000000';
    }
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();

    ctx.font = 'bold 11px "JetBrains Mono"';
    ctx.fillText(evt === 'flood' ? '⚡ FLOOD' : '🛡️ MITIGATION', x + 4, 18);
    ctx.restore();
  });

  // Calculate Points
  const points = dataSeries.map((val, idx) => {
    const x = idx * stepX;
    const y = h - (val / maxVal) * (h - 20) - 5;
    return { x, y: Math.max(5, Math.min(h - 5, y)) };
  });

  // Fill Area
  ctx.fillStyle = lineFillColor;
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.moveTo(points[0].x, h);
  points.forEach((p) => ctx.lineTo(p.x, p.y));
  ctx.lineTo(points[points.length - 1].x, h);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1.0;

  // Draw Thick Stroke
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  points.forEach((p) => ctx.lineTo(p.x, p.y));
  ctx.stroke();
}

/* ==========================================================================
   Embedded Attacker Terminal
   ========================================================================== */
function initTerminal() {
  if (typeof window.Terminal !== 'function') return;

  const term = new window.Terminal({
    cursorBlink: true,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 13,
    theme: {
      background: '#000000',
      foreground: '#ffffff',
      cursor: '#67e8f9',
    },
  });

  let fitAddon = null;
  if (window.FitAddon && window.FitAddon.FitAddon) {
    fitAddon = new window.FitAddon.FitAddon();
    term.loadAddon(fitAddon);
  }

  term.open(elements.terminalContainer);
  if (fitAddon) fitAddon.fit();

  state.terminal = term;
  state.terminalFitAddon = fitAddon;

  term.onData((data) => {
    if (window.vlab) window.vlab.writeTerminal(data);
  });

  term.writeln('\x1b[36m--- ICMP Attacker Shell (icmp-attacker) --- \x1b[0m');
  term.writeln('Click "Start Lab" to attach container terminal.\r\n');
}

async function attachTerminal() {
  if (!window.vlab || !state.terminal) return;
  try {
    const info = await window.vlab.openTerminal();
    elements.termStatusBadge.innerText = `${info.service} (${info.container})`;
    elements.termStatusBadge.style.backgroundColor = 'var(--neo-lime)';
    state.terminal.clear();
  } catch (err) {
    elements.termStatusBadge.innerText = 'Not Connected';
    state.terminal.writeln(`\r\n\x1b[31m[Terminal Error] ${err.message}\x1b[0m\r\n`);
  }
}

function detachTerminal() {
  if (state.terminal) {
    state.terminal.clear();
    state.terminal.writeln('\x1b[33m--- Terminal session closed ---\x1b[0m\r\n');
    elements.termStatusBadge.innerText = 'Not Connected';
    elements.termStatusBadge.style.backgroundColor = 'var(--color-white)';
  }
}

/* ==========================================================================
   Activity Log Stream
   ========================================================================== */
function appendLogEntry(entry) {
  const line = document.createElement('div');
  line.className = `log-entry ${entry.level || 'info'} ${entry.source || ''}`;
  const timeStr = entry.ts ? new Date(entry.ts).toLocaleTimeString() : new Date().toLocaleTimeString();
  line.innerText = `[${timeStr}] [${(entry.source || 'app').toUpperCase()}] ${entry.message}`;
  elements.logStream.appendChild(line);
  elements.logStream.scrollTop = elements.logStream.scrollHeight;
}
