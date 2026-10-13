'use strict';
/**
 * Flood Attack Learning Platform — Renderer Application Controller
 * Handles view navigation, live demonstration telemetry, educational modals,
 * 25-chapter syllabus reading, 3-tier quiz engine, and PDF export delivery.
 */

// Global Application State
const state = {
  currentView: 'landing',
  status: 'Stopped',
  isBusy: false,
  floodRunning: false,
  floodDuration: 15,
  mitigationActive: false,
  activeMitigationMethod: null,
  selectedMitigationInModal: 'rate-limiting',
  theme: 'dark',
  exploredDefenses: new Set(['rate-limiting']),

  // Lab Telemetry (30-second rolling window)
  historyLength: 30,
  metrics: {
    cpu: new Array(30).fill(0),
    pps: new Array(30).fill(0),
    events: new Array(30).fill(null),
  },

  // Terminal
  terminal: null,
  terminalFitAddon: null,

  // Notes & Syllabus State
  currentChapterId: 1,
  isRevisionMode: false,
  chaptersRead: new Set(),

  // Quiz Engine State
  activeQuizTier: null,
  currentQuestionIndex: 0,
  quizAnswers: [], // Stores user selections: { selectedIndex, isCorrect, points }
  quizScore: 0,
  maxQuizScore: 0,

  // Telemetry Peak Tracker during flood
  peakPps: 0,
  peakCpu: 0,
  floodStartTime: null,

  // Overall User Learning Progress
  userStats: {
    chaptersRead: [],
    labSimulations: 0,
    quizzesCompleted: {}, // { easy: score, moderate: score, difficult: score }
    bestScore: 0,
  },
};

/* ==========================================================================
   Navigation Router — Top-level Guarantee
   ========================================================================== */
function navigateToView(viewName) {
  if (!viewName) return;
  if (typeof state !== 'undefined') state.currentView = viewName;
  console.log('Router navigating to view:', viewName);

  // Update tabs
  document.querySelectorAll('.nav-tab').forEach((t) => {
    const isTarget = t.getAttribute('data-view') === viewName;
    t.classList.toggle('active', isTarget);
  });

  // Update panels
  document.querySelectorAll('.view-panel').forEach((p) => {
    p.classList.remove('active');
    p.style.setProperty('display', 'none', 'important');
  });

  const targetPanel = document.getElementById(`view-${viewName}`);
  if (targetPanel) {
    targetPanel.classList.add('active');
    targetPanel.style.setProperty('display', 'block', 'important');
  }

  // Scroll viewport to top
  const viewport = document.querySelector('.viewport-area');
  if (viewport) viewport.scrollTop = 0;
  window.scrollTo(0, 0);

  // If entering lab, redraw canvas charts
  if (viewName === 'lab') {
    setTimeout(() => {
      if (typeof drawCanvasCharts === 'function') drawCanvasCharts();
      if (typeof updateDemoControlState === 'function') updateDemoControlState();
    }, 50);
  }

  // If entering notes, ensure chapter is rendered
  if (viewName === 'notes') {
    if (typeof state !== 'undefined' && !state.currentChapterId) state.currentChapterId = 1;
    const chId = (typeof state !== 'undefined' && state.currentChapterId) ? state.currentChapterId : 1;
    if (typeof renderChapter === 'function') renderChapter(chId);
  }

  if (typeof sfx !== 'undefined' && sfx && sfx.play) {
    try { sfx.play('click'); } catch (_) {}
  }
}
window.navigateToView = navigateToView;

/* ==========================================================================
   Initialization
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  try { initThemeToggle(); } catch (e) { console.warn('Theme init warning:', e); }
  try { loadStoredProgress(); } catch (e) { console.warn('Progress load warning:', e); }
  try { initRouter(); } catch (e) { console.warn('Router init warning:', e); }
  try { initLiveDemo(); } catch (e) { console.warn('Demo init warning:', e); }
  try { initScenariosFlipCards(); } catch (e) { console.warn('Scenarios init warning:', e); }
  try { initNotes(); } catch (e) { console.warn('Notes init warning:', e); }
  try { initQuiz(); } catch (e) { console.warn('Quiz init warning:', e); }
  try { initResources(); } catch (e) { console.warn('Resources init warning:', e); }
  try { initModals(); } catch (e) { console.warn('Modals init warning:', e); }
  try { updateGlobalProgressUI(); } catch (e) { console.warn('Progress UI warning:', e); }
  try { fetchInitialLabStatus(); } catch (e) { console.warn('Status fetch warning:', e); }
});

/* ==========================================================================
   Local Storage & Progress Persistence
   ========================================================================== */
function loadStoredProgress() {
  try {
    const raw = localStorage.getItem('vlab_user_progress');
    if (raw) {
      const parsed = JSON.parse(raw);
      state.userStats = Object.assign(state.userStats, parsed);
      state.chaptersRead = new Set(state.userStats.chaptersRead || []);
    }
  } catch (err) {
    console.warn('Failed to load stored progress:', err);
  }
}

function saveProgress() {
  try {
    state.userStats.chaptersRead = Array.from(state.chaptersRead);
    localStorage.setItem('vlab_user_progress', JSON.stringify(state.userStats));
    updateGlobalProgressUI();
  } catch (err) {
    console.warn('Failed to save progress:', err);
  }
}

function updateGlobalProgressUI() {
  // Total weight: 25 chapters (50%), 3 quizzes (30%), Lab simulation (20%)
  const chapterPct = Math.min(1, state.chaptersRead.size / 25) * 50;
  const quizCount = Object.keys(state.userStats.quizzesCompleted || {}).length;
  const quizPct = Math.min(1, quizCount / 3) * 30;
  const labPct = state.userStats.labSimulations > 0 ? 20 : 0;
  const total = Math.min(100, Math.round(chapterPct + quizPct + labPct));

  const progPill = document.getElementById('global-progress-text');
  const progBar = document.getElementById('main-progress-bar');
  if (progPill) progPill.innerText = `${total}%`;
  if (progBar) progBar.style.width = `${total}%`;

  // Landing stats
  const chStat = document.getElementById('stat-chapters-read');
  const labStat = document.getElementById('stat-lab-runs');
  const qStat = document.getElementById('stat-quizzes-completed');
  const bestStat = document.getElementById('stat-best-quiz-score');
  const badgeLevel = document.getElementById('badge-level-status');

  if (chStat) chStat.innerText = `${state.chaptersRead.size} / 25`;
  if (labStat) labStat.innerText = `${state.userStats.labSimulations}`;
  if (qStat) qStat.innerText = `${quizCount} / 3`;
  if (bestStat) bestStat.innerText = `${state.userStats.bestScore} pts`;

  if (badgeLevel) {
    if (total >= 90) badgeLevel.innerText = '🛡️ Cyber Defense Architect';
    else if (total >= 50) badgeLevel.innerText = '⚔️ Incident Responder';
    else if (total >= 20) badgeLevel.innerText = '🔍 Network Analyst';
    else badgeLevel.innerText = '🌱 Beginner Explorer';
  }
}

/* ==========================================================================
   Sound Effects (Web Audio API Synth — Muted by Default)
   ========================================================================== */
const sfx = {
  enabled: false,
  ctx: null,
  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  },
  play(type) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      const now = this.ctx.currentTime;
      if (type === 'click') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.05);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'alarm') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.linearRampToValueAtTime(130, now + 0.25);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'success') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.08);
        osc.frequency.setValueAtTime(783.99, now + 0.16);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      }
    } catch (_) {}
  }
};

/* ==========================================================================
   Theme Management — Light / Dark Mode System
   ========================================================================== */
function initThemeToggle() {
  const btnToggle = document.getElementById('btn-theme-toggle');
  if (!btnToggle) return;

  const storedTheme = localStorage.getItem('vlab_theme') || (document.body.classList.contains('theme-dark') ? 'dark' : 'light');
  applyTheme(storedTheme);

  // Prevent multiple event listeners from attaching on reload or re-init
  if (btnToggle._hasThemeListener) return;
  btnToggle._hasThemeListener = true;

  btnToggle.addEventListener('click', (e) => {
    e.preventDefault();
    const isCurrentlyDark = document.body.classList.contains('theme-dark');
    const nextTheme = isCurrentlyDark ? 'light' : 'dark';
    applyTheme(nextTheme);
    if (typeof sfx !== 'undefined' && sfx.play) {
      try { sfx.play('click'); } catch (_) {}
    }
  });
}

function applyTheme(theme) {
  const isDark = theme === 'dark';
  state.theme = theme;
  if (isDark) {
    document.body.classList.remove('theme-light');
    document.body.classList.add('theme-dark');
  } else {
    document.body.classList.remove('theme-dark');
    document.body.classList.add('theme-light');
  }
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('vlab_theme', theme);

  const iconEl = document.getElementById('theme-toggle-icon');
  const labelEl = document.getElementById('theme-toggle-label');
  if (iconEl) iconEl.innerText = isDark ? '🌙' : '☀️';
  if (labelEl) labelEl.innerText = isDark ? 'DARK' : 'LIGHT';

  // Redraw canvas charts if currently on lab view to match theme gridlines
  if (typeof drawCanvasCharts === 'function' && state.currentView === 'lab') {
    setTimeout(drawCanvasCharts, 30);
  }
}

/* ==========================================================================
   Router & View Navigation
   ========================================================================== */
function initRouter() {
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      sfx.play('click');
      const view = tab.getAttribute('data-view');
      navigateToView(view);
    });
  });

  const logo = document.getElementById('btn-logo-home');
  if (logo) logo.addEventListener('click', () => {
    sfx.play('click');
    navigateToView('landing');
  });

  // Landing CTAs
  const btnStartLearning = document.getElementById('btn-start-learning');
  if (btnStartLearning) btnStartLearning.addEventListener('click', () => {
    sfx.play('click');
    navigateToView('notes');
  });

  const btnJumpLive = document.getElementById('btn-jump-live-demo');
  if (btnJumpLive) btnJumpLive.addEventListener('click', () => {
    sfx.play('click');
    navigateToView('lab');
  });

  // 4 Hub Cards Click Handlers
  const cardLab = document.getElementById('card-nav-lab');
  if (cardLab) cardLab.addEventListener('click', () => navigateToView('lab'));

  const cardApps = document.getElementById('card-nav-apps');
  if (cardApps) cardApps.addEventListener('click', () => navigateToView('applications'));

  const cardNotes = document.getElementById('card-nav-notes');
  if (cardNotes) cardNotes.addEventListener('click', () => navigateToView('notes'));

  const cardQuiz = document.getElementById('card-nav-quiz');
  if (cardQuiz) cardQuiz.addEventListener('click', () => navigateToView('quiz'));

  // Also bind any cards by class
  document.querySelectorAll('.neo-hub-card, .big-action-card').forEach((card) => {
    card.addEventListener('click', () => {
      const view = card.getAttribute('data-view');
      if (view) navigateToView(view);
    });
  });
}


/* ==========================================================================
   LIVE DEMONSTRATION WORKSPACE
   ========================================================================== */
function initLiveDemo() {
  initTerminal();
  bindDemoControls();
  setupDemoSubscriptions();
}

function bindDemoControls() {
  const btnStartLab = document.getElementById('btn-start-lab');
  const btnStopLab = document.getElementById('btn-stop-lab');
  const btnResetLab = document.getElementById('btn-reset-lab');
  const btnLaunchFlood = document.getElementById('btn-launch-flood');
  const btnApplyMitigation = document.getElementById('btn-apply-mitigation');
  const btnRemoveMitigation = document.getElementById('btn-remove-mitigation');
  const btnExportLog = document.getElementById('btn-export-log');

  if (btnStartLab) {
    btnStartLab.addEventListener('click', async () => {
      if (!window.vlab) return;
      btnStartLab.disabled = true;
      appendLogEntry({ ts: new Date().toISOString(), level: 'info', source: 'lab', message: 'Starting isolated container environment…' });
      await window.vlab.startLab().catch((err) => {
        appendLogEntry({ ts: new Date().toISOString(), level: 'danger', source: 'lab', message: `Start failed: ${err.message}` });
      });
    });
  }

  if (btnStopLab) {
    btnStopLab.addEventListener('click', async () => {
      if (!window.vlab) return;
      btnStopLab.disabled = true;
      appendLogEntry({ ts: new Date().toISOString(), level: 'info', source: 'lab', message: 'Stopping container environment…' });
      await window.vlab.stopLab().catch((err) => console.error(err));
      resetTelemetry();
      removeDefenseUI();
    });
  }

  if (btnResetLab) {
    btnResetLab.addEventListener('click', async () => {
      if (!window.vlab) return;
      btnResetLab.disabled = true;
      appendLogEntry({ ts: new Date().toISOString(), level: 'warn', source: 'lab', message: 'Resetting lab environment & flushing rules…' });
      await window.vlab.resetLab().catch((err) => console.error(err));
      resetTelemetry();
      removeDefenseUI();
    });
  }

  // Pre-launch flood educational modal
  if (btnLaunchFlood) {
    btnLaunchFlood.addEventListener('click', () => {
      if (!window.vlab || state.floodRunning) return;
      openLaunchFloodModal();
    });
  }

  // Pre-mitigation educational modal
  if (btnApplyMitigation) {
    btnApplyMitigation.addEventListener('click', () => {
      if (!window.vlab) return;
      openMitigationModal();
    });
  }

  // Remove defense button
  if (btnRemoveMitigation) {
    btnRemoveMitigation.addEventListener('click', async () => {
      if (!window.vlab) return;
      await window.vlab.removeMitigation().catch((err) => console.error(err));
      removeDefenseUI();
    });
  }

  if (btnExportLog) {
    btnExportLog.addEventListener('click', async () => {
      if (!window.vlab) return;
      const res = await window.vlab.exportLogs();
      if (res && res.success) {
        appendLogEntry({ ts: new Date().toISOString(), level: 'success', source: 'app', message: `Activity log exported to: ${res.path}` });
      }
    });
  }
}

function setupDemoSubscriptions() {
  if (!window.vlab) return;

  window.vlab.onStatusChanged((status) => {
    updateLabStatusUI(status);
  });

  window.vlab.onMetricsData((data) => {
    updateMetricsUI(data);
  });

  window.vlab.onFloodState((data) => {
    state.floodRunning = data.running;
    updateDemoControlState();

    if (data.running) {
      addEventMarker('flood');
      state.peakPps = 0;
      state.peakCpu = 0;
      state.floodStartTime = Date.now();
      appendLogEntry({
        ts: new Date().toISOString(),
        level: 'warn',
        source: 'attacker',
        message: `⚡ ICMP Flood Attack launched (${data.duration || 15}s duration)`,
      });
    } else {
      // Flood completed! Show Results Summary
      appendLogEntry({
        ts: new Date().toISOString(),
        level: 'info',
        source: 'attacker',
        message: 'ICMP Flood Attack completed. Target server stabilizing.',
      });
      state.userStats.labSimulations += 1;
      saveProgress();
      openResultsSummaryModal();
    }
  });

  window.vlab.onMitigationState((data) => {
    state.mitigationActive = data.active;
    state.activeMitigationMethod = data.method || null;
    addEventMarker(data.active ? 'mitigation-on' : 'mitigation-off');

    if (data.active) {
      showDefenseActiveUI(data.readable || 'Active Defense Applied');
    } else {
      removeDefenseUI();
    }
  });

  window.vlab.onLogEvent((entry) => {
    appendLogEntry(entry);
  });
}

async function fetchInitialLabStatus() {
  if (!window.vlab) return;
  const status = await window.vlab.getLabStatus().catch(() => null);
  if (status) {
    updateLabStatusUI(status);
  }
}

function updateLabStatusUI(status) {
  const prevStatus = state.status;
  state.status = status.status || 'Stopped';
  state.isBusy = !!status.busy;
  state.mitigationActive = !!status.mitigationActive;
  state.floodRunning = !!status.floodRunning;

  const statusText = document.getElementById('lab-status-text');
  const statusPill = document.getElementById('lab-status-pill');

  let modeText = state.status;
  if (status.isSimulated && state.status === 'Running') modeText = 'Running (Simulated)';
  if (state.floodRunning) modeText = 'Flood Active';
  else if (state.mitigationActive) modeText = 'Protected (Mitigated)';

  if (statusText) statusText.innerText = modeText;
  if (statusPill) {
    statusPill.className = `status-pill ${state.status.toLowerCase()} ${state.floodRunning ? 'flood' : ''}`;
  }

  updateDemoControlState();
}

function updateDemoControlState() {
  const isRunning = state.status === 'Running';
  const isStopped = state.status === 'Stopped';
  const isBusy = state.isBusy;

  const btnStart = document.getElementById('btn-start-lab');
  const btnStop = document.getElementById('btn-stop-lab');
  const btnReset = document.getElementById('btn-reset-lab');
  const btnFlood = document.getElementById('btn-launch-flood');
  const btnMitigate = document.getElementById('btn-apply-mitigation');

  if (btnStart) btnStart.disabled = isBusy || isRunning;
  if (btnStop) btnStop.disabled = isBusy || isStopped;
  if (btnReset) btnReset.disabled = isBusy || isStopped;
  if (btnFlood) btnFlood.disabled = !isRunning || state.floodRunning;
  if (btnMitigate) btnMitigate.disabled = !isRunning;
}

function showDefenseActiveUI(readable) {
  const badge = document.getElementById('active-defense-badge');
  const title = document.getElementById('active-defense-title');
  const btnRemove = document.getElementById('btn-remove-mitigation');
  if (badge) badge.style.display = 'flex';
  if (title) title.innerText = `Active Defense: ${readable}`;
  if (btnRemove) btnRemove.style.display = 'inline-flex';
}

function removeDefenseUI() {
  const badge = document.getElementById('active-defense-badge');
  const btnRemove = document.getElementById('btn-remove-mitigation');
  if (badge) badge.style.display = 'none';
  if (btnRemove) btnRemove.style.display = 'none';
  state.activeMitigationMethod = null;
}

/* Telemetry & Canvas Charts */
function resetTelemetry() {
  state.metrics.cpu = new Array(state.historyLength).fill(0);
  state.metrics.pps = new Array(state.historyLength).fill(0);
  state.metrics.events = new Array(state.historyLength).fill(null);

  const cpu = document.getElementById('stat-cpu-val');
  const pps = document.getElementById('stat-pps-val');
  const mem = document.getElementById('stat-mem-val');
  if (cpu) cpu.innerText = '0%';
  if (pps) pps.innerText = '0 PPS';
  if (mem) mem.innerText = '0 MB';

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

  // Track peaks during flood
  if (state.floodRunning) {
    if (pps > state.peakPps) state.peakPps = pps;
    if (cpuPct > state.peakCpu) state.peakCpu = cpuPct;
  }

  const cpu = document.getElementById('stat-cpu-val');
  const ppsEl = document.getElementById('stat-pps-val');
  const mem = document.getElementById('stat-mem-val');
  if (cpu) cpu.innerText = `${cpuPct}%`;
  if (ppsEl) ppsEl.innerText = `${pps.toLocaleString()} PPS`;
  if (mem) mem.innerText = `${memMB} MB`;

  // Push to rolling window
  state.metrics.cpu.push(cpuPct); state.metrics.cpu.shift();
  state.metrics.pps.push(pps); state.metrics.pps.shift();
  state.metrics.events.push(null); state.metrics.events.shift();

  updateTargetHealthGauge(cpuPct, pps);
  drawCanvasCharts();
}

function updateTargetHealthGauge(cpuPct, pps) {
  const cpuFactor = (cpuPct / 30.0) * 50;
  const ppsFactor = Math.min(1.0, pps / 20000) * 50;
  const totalLoad = Math.min(100, Math.max(5, Math.round(cpuFactor + ppsFactor)));

  const bar = document.getElementById('health-gauge-bar');
  const badge = document.getElementById('target-health-badge');
  const desc = document.getElementById('gauge-status-desc');

  if (bar) bar.style.width = `${totalLoad}%`;

  if (totalLoad < 35) {
    if (bar) bar.style.backgroundColor = 'var(--neo-lime)';
    if (badge) {
      badge.className = 'health-badge healthy';
      badge.innerText = 'HEALTHY';
    }
    if (desc) desc.innerText = 'Target CPU and packet intake operating within normal parameters.';
  } else if (totalLoad < 70) {
    if (bar) bar.style.backgroundColor = 'var(--neo-yellow)';
    if (badge) {
      badge.className = 'health-badge warning';
      badge.innerText = 'ELEVATED LOAD';
    }
    if (desc) desc.innerText = 'Warning: Target server experiencing elevated network packet load.';
  } else {
    if (bar) bar.style.backgroundColor = 'var(--neo-red)';
    if (badge) {
      badge.className = 'health-badge critical';
      badge.innerText = 'CRITICAL (DoS)';
    }
    if (desc) desc.innerText = 'CRITICAL: Target Server Struggling under ICMP Flood DoS Attack!';
  }
}

function drawCanvasCharts() {
  const cCpu = document.getElementById('chart-cpu-canvas');
  const cPps = document.getElementById('chart-pps-canvas');
  if (cCpu) drawSingleChart(cCpu, state.metrics.cpu, 30, '#38bdf8', 'CPU %');
  if (cPps) drawSingleChart(cPps, state.metrics.pps, Math.max(100, Math.max(...state.metrics.pps) * 1.2), '#f472b6', 'PPS');
}

function drawSingleChart(canvas, dataSeries, maxVal, lineFillColor, yLabel) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  // Background Grid Lines
  const isDark = document.body.classList.contains('theme-dark') || (typeof state !== 'undefined' && state.theme === 'dark');
  ctx.strokeStyle = isDark ? '#262938' : '#e2e8f0';
  ctx.lineWidth = 1;
  for (let y = 25; y < h; y += 25) {
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
    ctx.lineWidth = 2;
    if (evt === 'flood') {
      ctx.strokeStyle = '#fde047';
      ctx.fillStyle = '#fde047';
    } else {
      ctx.strokeStyle = '#34d399';
      ctx.fillStyle = '#34d399';
    }
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();

    ctx.font = 'bold 10px "JetBrains Mono"';
    ctx.fillText(evt === 'flood' ? '⚡ FLOOD' : '🛡️ MITIGATION', x + 4, 14);
    ctx.restore();
  });

  // Calculate Points
  const points = dataSeries.map((val, idx) => {
    const x = idx * stepX;
    const y = h - (val / (maxVal || 1)) * (h - 20) - 5;
    return { x, y: Math.max(5, Math.min(h - 5, y)) };
  });

  // Fill Area
  ctx.fillStyle = lineFillColor;
  ctx.globalAlpha = 0.2;
  ctx.beginPath();
  ctx.moveTo(points[0].x, h);
  points.forEach((p) => ctx.lineTo(p.x, p.y));
  ctx.lineTo(points[points.length - 1].x, h);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1.0;

  // Draw Stroke Line
  ctx.strokeStyle = lineFillColor;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  points.forEach((p) => ctx.lineTo(p.x, p.y));
  ctx.stroke();
}

/* Attacker Terminal */
function initTerminal() {
  // Terminal UI removed. Method kept empty to satisfy existing calls.
}

function appendLogEntry(entry) {
  const logStream = document.getElementById('log-stream');
  if (!logStream) return;
  const line = document.createElement('div');
  line.className = `log-entry ${entry.level || 'info'} ${entry.source || ''}`;
  const timeStr = entry.ts ? new Date(entry.ts).toLocaleTimeString() : new Date().toLocaleTimeString();
  line.innerText = `[${timeStr}] [${(entry.source || 'app').toUpperCase()}] ${entry.message}`;
  logStream.appendChild(line);
  logStream.scrollTop = logStream.scrollHeight;
}

/* ==========================================================================
   EDUCATIONAL MODALS LOGIC
   ========================================================================== */
function initModals() {
  // Launch Flood Modal
  const mFlood = document.getElementById('modal-launch-flood');
  const btnCloseFlood = document.getElementById('btn-close-flood-modal');
  const btnCancelFlood = document.getElementById('btn-cancel-flood-modal');
  const btnConfirmFlood = document.getElementById('btn-confirm-start-flood');

  if (btnCloseFlood) btnCloseFlood.addEventListener('click', closeLaunchFloodModal);
  if (btnCancelFlood) btnCancelFlood.addEventListener('click', closeLaunchFloodModal);

  // Flood Lesson Stepper Navigation
  const stepperTabs = document.querySelectorAll('.lesson-step-tab');
  stepperTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-target');
      switchLessonSection(targetId);
      if (typeof sfx !== 'undefined' && sfx.play) sfx.play('click');
    });
  });

  // "See What Happens ->" Hook CTA button
  const btnSeeHappens = document.getElementById('btn-flood-see-happens');
  if (btnSeeHappens) {
    btnSeeHappens.addEventListener('click', () => {
      switchLessonSection('flood-sec-flow');
      setFlowAnimationMode('attack');
      if (typeof sfx !== 'undefined' && sfx.play) sfx.play('click');
    });
  }

  // Interactive Terminology Cards
  document.querySelectorAll('.term-card').forEach((tc) => {
    tc.addEventListener('click', () => {
      tc.classList.toggle('expanded');
      if (typeof sfx !== 'undefined' && sfx.play) sfx.play('click');
    });
    tc.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        tc.classList.toggle('expanded');
      }
    });
  });

  if (btnConfirmFlood) {
    btnConfirmFlood.addEventListener('click', async () => {
      closeLaunchFloodModal();
      if (!window.vlab || state.floodRunning) return;

      const checked = document.querySelector('input[name="flood-duration"]:checked');
      const sec = checked ? parseInt(checked.value, 10) : 15;
      state.floodDuration = sec;

      appendLogEntry({
        ts: new Date().toISOString(),
        level: 'warn',
        source: 'lab',
        message: `Student confirmed safe simulation execution (${sec}s duration against isolated target).`,
      });

      await window.vlab.startFlood(sec).catch((err) => {
        appendLogEntry({ ts: new Date().toISOString(), level: 'danger', source: 'attacker', message: `Launch error: ${err.message}` });
      });
    });
  }

  // Apply Mitigation Modal
  const mMit = document.getElementById('modal-apply-mitigation');
  const btnCloseMit = document.getElementById('btn-close-mitigation-modal');
  const btnCancelMit = document.getElementById('btn-cancel-mitigation-modal');
  const btnConfirmMit = document.getElementById('btn-confirm-apply-mitigation');

  if (btnCloseMit) btnCloseMit.addEventListener('click', closeMitigationModal);
  if (btnCancelMit) btnCancelMit.addEventListener('click', closeMitigationModal);

  // 5 Mitigation selectable cards
  const mitCards = document.querySelectorAll('.mitigation-card');
  mitCards.forEach((card) => {
    card.addEventListener('click', () => {
      const method = card.getAttribute('data-method');
      selectAndExploreMitigation(method);
    });
  });

  if (btnConfirmMit) {
    btnConfirmMit.addEventListener('click', async () => {
      closeMitigationModal();
      if (!window.vlab) return;

      const method = state.selectedMitigationInModal || 'rate-limiting';
      appendLogEntry({
        ts: new Date().toISOString(),
        level: 'info',
        source: 'lab',
        message: `Applying selected defense: ${method}…`,
      });

      await window.vlab.applyMitigation(method).catch((err) => {
        appendLogEntry({ ts: new Date().toISOString(), level: 'danger', source: 'target', message: `Mitigation error: ${err.message}` });
      });
    });
  }

  // Results Summary Modal
  const btnCloseRes = document.getElementById('btn-close-results-modal');
  const btnAckRes = document.getElementById('btn-ack-results-modal');
  if (btnCloseRes) btnCloseRes.addEventListener('click', closeResultsSummaryModal);
  if (btnAckRes) btnAckRes.addEventListener('click', closeResultsSummaryModal);
}

function switchLessonSection(sectionId) {
  document.querySelectorAll('.lesson-step-tab').forEach((t) => {
    t.classList.toggle('active', t.getAttribute('data-target') === sectionId);
  });
  document.querySelectorAll('.lesson-section').forEach((sec) => {
    sec.classList.toggle('active', sec.id === sectionId);
  });
  const targetEl = document.getElementById(sectionId);
  const scrollBody = document.querySelector('.lesson-scroll-body');
  if (scrollBody && targetEl) {
    scrollBody.scrollTo({ top: targetEl.offsetTop - 12, behavior: 'smooth' });
  }
}
window.switchLessonSection = switchLessonSection;

function setFlowAnimationMode(mode) {
  const isAttack = mode === 'attack';
  const btnAttack = document.getElementById('btn-flow-attack');
  const btnNormal = document.getElementById('btn-flow-normal');
  if (btnAttack) btnAttack.classList.toggle('active', isAttack);
  if (btnNormal) btnNormal.classList.toggle('active', !isAttack);

  const senderBadge = document.getElementById('flow-sender-badge');
  const senderDesc = document.getElementById('flow-sender-desc');
  const cpuFill = document.getElementById('flow-cpu-fill');
  const cpuText = document.getElementById('flow-cpu-text');
  const serverGlyph = document.getElementById('flow-server-glyph');
  const serverDesc = document.getElementById('flow-server-desc');
  const userGlyph = document.getElementById('flow-user-glyph');
  const userBadge = document.getElementById('flow-user-badge');
  const userDesc = document.getElementById('flow-user-desc');
  const streamPings = document.getElementById('flow-stream-pings');
  const streamUsers = document.getElementById('flow-stream-users');
  const caption = document.getElementById('flow-diagram-caption');

  if (isAttack) {
    if (senderBadge) {
      senderBadge.innerText = 'Rate: 35,000+ PPS';
      senderBadge.style.background = 'var(--neo-red)';
      senderBadge.style.color = '#fff';
    }
    if (senderDesc) senderDesc.innerText = 'Generates high-frequency ICMP Echo Requests without waiting for replies.';
    if (cpuFill) {
      cpuFill.style.width = '95%';
      cpuFill.style.background = 'var(--neo-red)';
    }
    if (cpuText) cpuText.innerText = 'CPU: 95% Locked';
    if (serverGlyph) {
      serverGlyph.innerText = '🔥';
      serverGlyph.classList.add('server-shaking');
    }
    if (serverDesc) serverDesc.innerText = 'Network card triggers SoftIRQs; OS CPU locked processing incoming echo buffers.';
    if (userGlyph) userGlyph.innerText = '⏳';
    if (userBadge) {
      userBadge.className = 'flow-status-pill status-dos';
      userBadge.style.background = 'var(--neo-pink)';
      userBadge.style.color = '#000';
      userBadge.innerText = '⛔ DoS: Connection Timed Out';
    }
    if (userDesc) userDesc.innerText = 'App requests queue up and time out. Server unable to service new TCP/HTTP sockets.';
    if (streamPings) streamPings.innerHTML = '<span class="fp-dot fpd-1">●</span><span class="fp-dot fpd-2">●</span><span class="fp-dot fpd-3">●</span>';
    if (streamUsers) streamUsers.innerHTML = '<span class="fp-dot fpd-u1">✖</span><span class="fp-dot fpd-u2">✖</span>';
    if (caption) caption.innerHTML = '<strong>Simulated Attack Mechanics:</strong> The attacker bombards the target with Echo Requests. Because the kernel allocates interrupt time for each packet header, high packet rates exhaust CPU capacity even before network bandwidth is saturated.';
  } else {
    if (senderBadge) {
      senderBadge.innerText = 'Rate: 2 PPS (Standard Ping)';
      senderBadge.style.background = 'var(--neo-lime)';
      senderBadge.style.color = '#000';
    }
    if (senderDesc) senderDesc.innerText = 'Administrator runs standard diagnostics: ping -c 4 target_server';
    if (cpuFill) {
      cpuFill.style.width = '4%';
      cpuFill.style.background = 'var(--neo-lime)';
    }
    if (cpuText) cpuText.innerText = 'CPU: 4% (Nominal)';
    if (serverGlyph) {
      serverGlyph.innerText = '🖥️';
      serverGlyph.classList.remove('server-shaking');
    }
    if (serverDesc) serverDesc.innerText = 'Server receives echo request, replies immediately with echo reply, CPU load negligible.';
    if (userGlyph) userGlyph.innerText = '😊';
    if (userBadge) {
      userBadge.className = 'flow-status-pill';
      userBadge.style.background = 'var(--neo-lime)';
      userBadge.style.color = '#000';
      userBadge.innerText = '✅ Healthy: HTTP 200 OK (12ms)';
    }
    if (userDesc) userDesc.innerText = 'Legitimate web requests are processed smoothly without delays or packet drops.';
    if (streamPings) streamPings.innerHTML = '<span class="fp-dot fpd-1" style="color: var(--neo-lime);">●</span>';
    if (streamUsers) streamUsers.innerHTML = '<span class="fp-dot fpd-u1" style="color: var(--neo-lime);">✔</span>';
    if (caption) caption.innerHTML = '<strong>Normal Operation:</strong> Legitimate diagnostic pings take negligible processing time. The server happily returns Echo Replies while simultaneously serving HTTP web requests.';
  }

  if (typeof sfx !== 'undefined' && sfx.play) sfx.play('click');
}
window.setFlowAnimationMode = setFlowAnimationMode;

function openLaunchFloodModal() {
  const m = document.getElementById('modal-launch-flood');
  if (m) {
    m.style.display = 'flex';
    switchLessonSection('flood-sec-hook');
    setFlowAnimationMode('attack');
  }
}

function closeLaunchFloodModal() {
  const m = document.getElementById('modal-launch-flood');
  if (m) m.style.display = 'none';
}

function openMitigationModal() {
  const m = document.getElementById('modal-apply-mitigation');
  if (m) {
    m.style.display = 'flex';

    // Update active defense shield indicator in modal
    const shieldName = document.getElementById('modal-defense-shield-name');
    const shieldState = document.getElementById('modal-defense-shield-state');
    if (shieldName && shieldState) {
      if (state.mitigationActive) {
        shieldName.innerText = `Active (${state.activeMitigationMethod || 'Protected'})`;
        const dot = shieldState.querySelector('.shield-dot');
        if (dot) dot.className = 'shield-dot dot-active';
      } else {
        shieldName.innerText = 'Exposed (No Filter)';
        const dot = shieldState.querySelector('.shield-dot');
        if (dot) dot.className = 'shield-dot dot-unprotected';
      }
    }

    const countEl = document.getElementById('defense-explored-count');
    if (countEl && state.exploredDefenses) {
      countEl.innerText = `${state.exploredDefenses.size} / 5`;
    }

    selectAndExploreMitigation(state.selectedMitigationInModal || 'rate-limiting');
  }
}

function closeMitigationModal() {
  const m = document.getElementById('modal-apply-mitigation');
  if (m) m.style.display = 'none';
}

function selectAndExploreMitigation(methodKey) {
  state.selectedMitigationInModal = methodKey;
  if (!state.exploredDefenses) state.exploredDefenses = new Set();
  state.exploredDefenses.add(methodKey);

  // Update counter
  const countEl = document.getElementById('defense-explored-count');
  if (countEl) countEl.innerText = `${state.exploredDefenses.size} / 5`;

  // Update card selection state
  document.querySelectorAll('.mitigation-card').forEach((c) => {
    c.classList.toggle('selected', c.getAttribute('data-method') === methodKey);
  });

  renderMitigationDetail(methodKey);

  const panel = document.getElementById('mitigation-detail-panel');
  if (panel) {
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (typeof sfx !== 'undefined' && sfx.play) sfx.play('click');
}
window.selectAndExploreMitigation = selectAndExploreMitigation;

function copyDefenseCode(codeText, btn) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(codeText).then(() => {
      if (btn) {
        const orig = btn.innerText;
        btn.innerText = '✓ COPIED!';
        setTimeout(() => { btn.innerText = orig; }, 1800);
      }
    }).catch(() => {});
  }
}
window.copyDefenseCode = copyDefenseCode;

function checkPredictAnswer(btn, isCorrect, explanation) {
  const container = btn.closest('.predict-quiz-box');
  if (!container) return;
  container.querySelectorAll('.predict-opt-btn').forEach((b) => {
    b.disabled = true;
    b.classList.remove('correct', 'wrong');
  });
  btn.classList.add(isCorrect ? 'correct' : 'wrong');
  const feedbackEl = container.querySelector('.predict-feedback');
  if (feedbackEl) {
    feedbackEl.style.display = 'block';
    feedbackEl.innerHTML = `<strong>${isCorrect ? '🎉 Correct!' : '⚠️ Not Quite:'}</strong> ${explanation}`;
  }
  if (typeof sfx !== 'undefined' && sfx.play) {
    sfx.play(isCorrect ? 'success' : 'alarm');
  }
}
window.checkPredictAnswer = checkPredictAnswer;

function renderMitigationDetail(methodKey) {
  const panel = document.getElementById('mitigation-detail-panel');
  if (!panel) return;

  const data = {
    'rate-limiting': {
      title: '1. Rate Limiting (iptables Linux Netfilter)',
      badge: 'DOCKER ACTIVE',
      badgeClass: 'badge-success',
      problem: 'High-frequency ping surges exhaust CPU interrupts (SoftIRQs) even before link capacity is saturated, blocking genuine user connections.',
      howItWorks: 'The Linux Netfilter kernel subsystem inspects incoming packet headers and admits packets up to a token bucket rate (1 ping per second with a burst of 5). Excess packets are silently dropped without generating replies.',
      analogy: 'A bank receptionist who admits 1 customer through the turnstile every 2 seconds, no matter how many are waiting outside. The queue cannot storm the counters.',
      code: 'iptables -A INPUT -p icmp --icmp-type echo-request -m limit --limit 1/s --limit-burst 5 -j ACCEPT\niptables -A INPUT -p icmp --icmp-type echo-request -j DROP',
      codeFlags: [
        '<code>-p icmp --icmp-type echo-request</code>: Targets ICMP Type 8 (Echo Requests/Pings) specifically without altering HTTP or TCP traffic.',
        '<code>-m limit --limit 1/s</code>: Enforces a token bucket ceiling admitting 1 packet per second.',
        '<code>--limit-burst 5</code>: Accommodates legitimate transient bursts of up to 5 initial pings.',
        '<code>-j ACCEPT / DROP</code>: Accepts compliant packets, then silently discards overflowing flood packets.'
      ],
      pros: 'Preserves diagnostic ping functionality for system administrators while capping CPU utilization below 5%. Zero external services required.',
      cons: 'If rate limits are configured too aggressively, legitimate multi-admin monitoring or diagnostic scripts could experience false-positive drops.',
      before: '35,000+ PPS flood locks container CPU at 95%. Legitimate web users experience 504 Gateway Timeouts.',
      after: 'Traffic throttled to 1 PPS. CPU stabilizes at &lt;5%, and HTTP 200 responses return to normal within milliseconds.',
      predictQuestion: 'What happens if a network administrator runs "ping -c 4 target_server" with rate limiting active?',
      predictOptions: [
        { text: 'A) The first 4 pings reply normally within milliseconds due to the burst allowance.', isCorrect: true },
        { text: 'B) The server completely drops all network connections including SSH.', isCorrect: false },
        { text: 'C) The server crashes because rate limiting only works on TCP packets.', isCorrect: false }
      ],
      predictExplanation: 'Because the rule includes <code>--limit-burst 5</code>, a standard 4-packet diagnostic ping passes immediately without being throttled!'
    },
    'firewall': {
      title: '2. Firewall Filtering (Total Protocol Drop)',
      badge: 'DOCKER ACTIVE',
      badgeClass: 'badge-success',
      problem: 'Processing every ICMP Echo Request consumes kernel memory and forces the CPU to generate an Echo Reply, wasting precious resources during a flood.',
      howItWorks: 'Evaluates packet headers at early kernel ingress and immediately discards matching ICMP Echo Requests before socket buffers or user-space processes are allocated.',
      analogy: 'A security bouncer who turns away anyone without an invitation card right at the front gate, not allowing them to step foot in the lobby.',
      code: 'iptables -A INPUT -p icmp --icmp-type echo-request -j DROP',
      codeFlags: [
        '<code>-A INPUT</code>: Appends the rule to the kernel incoming packet chain.',
        '<code>-p icmp --icmp-type echo-request</code>: Matches ping requests directly.',
        '<code>-j DROP</code>: Silently discards the packet without sending an ICMP Destination Unreachable response, saving outgoing bandwidth.'
      ],
      pros: 'Maximum possible CPU efficiency. Zero CPU cycles wasted creating replies, and zero outgoing network bandwidth consumed.',
      cons: 'Completely disables ping reachability testing. Legitimate administrators cannot test whether the server is alive via ping.',
      before: 'Continuous CPU thrashing servicing incoming Echo Requests; server becomes unresponsive to application traffic.',
      after: 'Packets dropped instantaneously at kernel boundary. CPU drops to 0%, completely neutralizing ping flood attacks.',
      predictQuestion: 'Why is "-j DROP" preferred over "-j REJECT" when mitigating a volumetric flood?',
      predictOptions: [
        { text: 'A) DROP discards silently; REJECT sends an ICMP error packet back, doubling bandwidth and CPU work.', isCorrect: true },
        { text: 'B) DROP encrypts the sender\'s hard drive.', isCorrect: false },
        { text: 'C) REJECT requires root permissions but DROP does not.', isCorrect: false }
      ],
      predictExplanation: 'Sending "Port Unreachable" or "Host Unreachable" ICMP responses for 35,000 PPS would cause the defender to flood their own network uplink!'
    },
    'monitoring': {
      title: '3. Traffic Anomaly Monitoring & Automated Alerts',
      badge: 'SIMULATED',
      badgeClass: 'badge-accent',
      problem: 'Attacks often ramp up in fractions of a second. Without real-time telemetry, sysadmins only discover outages after users complain.',
      howItWorks: 'Monitors incoming PPS, bandwidth rate, and CPU metrics in real time. When packet arrival exceeds baseline thresholds, automated webhooks or alarms notify security engineers.',
      analogy: 'A shopkeeper hearing loud shouting outside and pressing a silent alarm button before the storefront is stormed.',
      code: '# Prometheus / Telegraf Alert Rule\nALERT HighICMPVolume\n  IF rate(node_net_packets_total{proto="icmp"}[10s]) > 5000\n  FOR 3s\n  LABELS { severity = "page" }\n  ANNOTATIONS { summary = "Volumetric ICMP surge detected" }',
      codeFlags: [
        '<code>rate(...[10s])</code>: Measures packet arrival rate derivative over rolling 10-second window.',
        '<code>> 5000</code>: Threshold exceeding normal operating baseline by orders of magnitude.',
        '<code>FOR 3s</code>: Debounce protection ensuring brief network bursts don\'t trigger false alarms.'
      ],
      pros: 'Non-intrusive: zero chance of accidentally blocking legitimate users or breaking diagnostic workflows.',
      cons: 'Observation alone does not stop packets; it must be coupled with an automated response mechanism or firewall trigger.',
      before: 'Stealth volumetric surges cause unexplained application slowness; origin teams spend hours diagnosing.',
      after: 'Immediate alarm dispatched within 3 seconds of flood onset, allowing automated playbooks to activate shields.',
      predictQuestion: 'What is the primary limitation of traffic monitoring on its own?',
      predictOptions: [
        { text: 'A) It alerts you that an attack is occurring, but cannot block or drop packets by itself.', isCorrect: true },
        { text: 'B) It causes the server to consume twice as much network bandwidth.', isCorrect: false },
        { text: 'C) It can only monitor HTTP traffic, not ICMP.', isCorrect: false }
      ],
      predictExplanation: 'Monitoring provides visibility, but a defender must still apply an active firewall rule or routing change to filter malicious packets.'
    },
    'scrubbing': {
      title: '4. Network-Level Upstream Cloud DDoS Scrubbing',
      badge: 'SIMULATED',
      badgeClass: 'badge-accent',
      problem: 'Massive volumetric DDoS attacks (100 Gbps - 1+ Tbps) physically saturate the data center ISP uplink cable before packets even reach the server firewall.',
      howItWorks: 'BGP Anycast routes public internet traffic through globally distributed cloud scrubbing centers (e.g., Cloudflare, AWS Shield) where high-capacity hardware cleans traffic and tunnels clean packets to origin.',
      analogy: 'A highway bypass diverting heavy freight transport trucks away from narrow residential streets into an inspection weigh station.',
      code: '# Upstream Anycast BGP Announcement & GRE Tunnel\n# Public IP routed via Scrubbing Center: 198.51.100.1\nip tunnel add gre-clean mode gre remote 203.0.113.5 local 10.0.0.1\nip link set gre-clean up',
      codeFlags: [
        '<code>BGP Anycast</code>: Distributes single IP across 300+ global scrubbing points of presence.',
        '<code>mode gre</code>: Encapsulates filtered traffic so origin server receives only verified packets.'
      ],
      pros: 'Can absorb massive multi-Terabit volumetric floods that would incinerate local infrastructure. Protects against link saturation.',
      cons: 'Requires commercial cloud subscription; introduces slight 2-10ms network latency due to rerouting.',
      before: 'ISP uplink cable 100% saturated with junk packets; all traffic (including legitimate users) completely blocked.',
      after: 'Cloud scrubbing center absorbs 99.99% of flood traffic; only legitimate requests reach the origin server.',
      predictQuestion: 'Why is a local iptables firewall insufficient against a 50 Gbps flood if your internet connection is 1 Gbps?',
      predictOptions: [
        { text: 'A) The physical ISP cable saturates before packets can reach iptables, dropping everything upstream.', isCorrect: true },
        { text: 'B) iptables cannot process more than 10 packets per minute.', isCorrect: false },
        { text: 'C) Linux does not support gigabit network cards.', isCorrect: false }
      ],
      predictExplanation: 'If the incoming flood exceeds the bandwidth of the physical connection into the building, the ISP drops packets before your server can even inspect them!'
    },
    'capacity': {
      title: '5. Capacity & Load Management (Load Balancing)',
      badge: 'SIMULATED',
      badgeClass: 'badge-accent',
      problem: 'A single server instance has finite CPU cores and network queues. When traffic surges, single points of failure quickly collapse.',
      howItWorks: 'Uses horizontal autoscaling and reverse-proxy load balancers (e.g. Nginx, HAProxy, AWS ALB) to distribute incoming connections across multiple backend containers.',
      analogy: 'Opening 5 additional checkout counters at a supermarket when the queue stretches all the way into the aisles.',
      code: '# Nginx High-Availability Upstream Pool\nupstream app_cluster {\n  least_conn;\n  server 10.0.1.10:80 max_fails=3 fail_timeout=10s;\n  server 10.0.1.11:80 max_fails=3 fail_timeout=10s;\n  server 10.0.1.12:80 max_fails=3 fail_timeout=10s;\n}',
      codeFlags: [
        '<code>least_conn</code>: Distributes new requests to the server node with fewest active connections.',
        '<code>max_fails=3</code>: Automatically removes unhealthy or struggling nodes from the active pool.'
      ],
      pros: 'Absorbs legitimate traffic surges (concert sales, exam results) effortlessly. Eliminates single point of failure.',
      cons: 'Expensive to run; cannot withstand infinite botnet flood volumes without an accompanying upstream packet filter.',
      before: 'Single server instance hits 100% CPU lockup; all web and API requests fail with 500/503 errors.',
      after: 'Workload balanced across cluster; each node operates under 30% CPU with smooth failover redundancy.',
      predictQuestion: 'Can horizontal capacity scaling alone solve all DDoS attacks?',
      predictOptions: [
        { text: 'A) No, botnet attackers can scale traffic volume much cheaper and faster than defenders can add servers.', isCorrect: true },
        { text: 'B) Yes, adding more servers makes attacks mathematically impossible.', isCorrect: false },
        { text: 'C) Yes, load balancers automatically delete all incoming packets.', isCorrect: false }
      ],
      predictExplanation: 'Attackers can spin up tens of thousands of compromised devices at zero cost, making pure server scaling financially and technically unsustainable without packet filtering.'
    }
  };

  const item = data[methodKey] || data['rate-limiting'];
  const codeEscaped = item.code.replace(/'/g, "\\'").replace(/\n/g, '\\n');

  panel.innerHTML = `
    <div class="mit-panel-title-row">
      <div>
        <h3>${item.title}</h3>
        <span class="badge ${item.badgeClass}" style="margin-top: 4px; display: inline-block;">${item.badge}</span>
      </div>
      <button type="button" class="btn btn-defense btn-sm" onclick="closeMitigationModal(); window.vlab && window.vlab.applyMitigation('${methodKey}');">
        ⚡ Apply This Defense Now
      </button>
    </div>

    <!-- 1. The Problem -->
    <div class="mit-section-card">
      <h5>1. The Threat / Problem</h5>
      <p>${item.problem}</p>
    </div>

    <!-- 2. How the Defense Works -->
    <div class="mit-section-card">
      <h5>2. How the Defense Works</h5>
      <p>${item.howItWorks}</p>
    </div>

    <!-- 3. Real-Life Analogy -->
    <div class="mit-section-card" style="background: var(--neo-surface); border-left: 4px solid var(--neo-yellow);">
      <h5>3. Real-Life Analogy</h5>
      <p>${item.analogy}</p>
    </div>

    <!-- 4. Practical Example (Highlighted Code & Copy Button) -->
    <div class="mit-section-card">
      <h5>4. Practical Example &amp; Syntax</h5>
      <div class="code-snippet-box">
        <button type="button" class="btn-copy-code" onclick="copyDefenseCode('${codeEscaped}', this)">📋 COPY</button>
        <code>${item.code.replace(/\n/g, '<br>')}</code>
      </div>
    </div>

    <!-- 5. Strengths & Limitations -->
    <div class="mit-section-card">
      <h5>5. Strengths &amp; Limitations</h5>
      <div class="pros-cons-grid">
        <div class="pro-box">
          <strong style="color: var(--neo-green);">✓ Strengths:</strong><br>
          ${item.pros}
        </div>
        <div class="con-box">
          <strong style="color: var(--neo-red);">⚠️ Limitations:</strong><br>
          ${item.cons}
        </div>
      </div>
    </div>

    <!-- 6. Before & After Defense Comparison -->
    <div class="mit-section-card">
      <h5>6. Before &amp; After Defense Comparison</h5>
      <div class="before-after-comp">
        <div class="comp-pane without">
          <strong style="color: var(--neo-red);">❌ Without Defense:</strong><br>
          ${item.before}
        </div>
        <div class="comp-pane with">
          <strong style="color: var(--neo-green);">🛡️ With Defense:</strong><br>
          ${item.after}
        </div>
      </div>
    </div>

    <!-- 7. Predict the Outcome Knowledge Check -->
    <div class="predict-quiz-box">
      <h5 style="margin: 0 0 0.35rem 0; font-family: var(--font-display); font-size: 0.95rem; color: var(--neo-text);">
        🧠 Quick Knowledge Check: Predict the Outcome
      </h5>
      <p style="font-size: 0.8rem; color: var(--neo-text); margin-bottom: 0.5rem;">${item.predictQuestion}</p>
      <div class="predict-options-row">
        ${item.predictOptions.map(opt => `
          <button type="button" class="predict-opt-btn" onclick="checkPredictAnswer(this, ${opt.isCorrect}, '${item.predictExplanation.replace(/'/g, "\\'")}')">
            ${opt.text}
          </button>
        `).join('')}
      </div>
      <div class="predict-feedback" style="display: none;"></div>
    </div>
  `;
}

function openResultsSummaryModal() {
  const m = document.getElementById('modal-results-summary');
  const body = document.getElementById('results-modal-body');
  if (!m || !body) return;

  const peakPps = state.peakPps || 34500;
  const peakCpu = state.peakCpu || 28.5;

  body.innerHTML = `
    <div style="background: rgba(16, 185, 129, 0.12); border-left: 4px solid var(--neo-lime); padding: 0.85rem; border-radius: 4px; margin-bottom: 1rem;">
      <h3 style="color: var(--neo-lime); font-size: 0.95rem; margin-bottom: 0.25rem;">✅ Bounded Simulation Completed Successfully</h3>
      <p style="font-size: 0.82rem; color: var(--neo-text);">
        The attack ran for its fixed <strong>${state.floodDuration}s</strong> duration against the isolated test container.
        The container has safely recovered to its healthy baseline.
      </p>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1rem;">
      <div style="background: var(--neo-surface-alt); padding: 0.75rem; border-radius: 6px; border: 1px solid var(--neo-border-color);">
        <span style="font-size: 0.72rem; color: var(--neo-text-dim); text-transform: uppercase;">Observed Peak Packet Rate</span>
        <div style="font-family: var(--font-mono); font-size: 1.25rem; font-weight: 800; color: var(--neo-text);">${peakPps.toLocaleString()} PPS</div>
        <span style="font-size: 0.72rem; color: var(--neo-yellow);">Spike over ~2 PPS baseline</span>
      </div>
      <div style="background: var(--neo-surface-alt); padding: 0.75rem; border-radius: 6px; border: 1px solid var(--neo-border-color);">
        <span style="font-size: 0.72rem; color: var(--neo-text-dim); text-transform: uppercase;">Observed Peak CPU Utilization</span>
        <div style="font-family: var(--font-mono); font-size: 1.25rem; font-weight: 800; color: var(--neo-text);">${peakCpu}%</div>
        <span style="font-size: 0.72rem; color: var(--neo-red);">Approached 30% container cap</span>
      </div>
    </div>

    <h4 style="font-size: 0.85rem; color: var(--neo-cyan); margin-bottom: 0.35rem;">Educational Takeaways:</h4>
    <ul style="font-size: 0.8rem; color: var(--neo-text-muted); margin-left: 1.25rem; line-height: 1.5;">
      <li>During the flood, the Target Server Load Status shifted to <strong>CRITICAL (DoS)</strong> due to high interrupt overhead.</li>
      <li>If legitimate user traffic were arriving, the packets would experience high packet loss and latency timeouts.</li>
      <li>Try clicking <strong>"Apply Mitigation"</strong> to activate iptables rate limiting, then launch the flood again to observe how the defense protects the server!</li>
    </ul>
  `;

  m.style.display = 'flex';
}

function closeResultsSummaryModal() {
  const m = document.getElementById('modal-results-summary');
  if (m) m.style.display = 'none';
}

/* ==========================================================================
   VIEW 3: REAL-LIFE SCENARIOS — 8 DOMAIN PLAYGROUND
   ========================================================================== */
function initScenariosFlipCards() {
  const scenarios = EducationalData.scenarios;
  const grid = document.getElementById('eight-scenarios-grid') || document.getElementById('flip-cards-grid');
  if (!grid || !scenarios) return;

  grid.innerHTML = '';
  Object.keys(scenarios).forEach((key) => {
    const s = scenarios[key];
    const card = document.createElement('div');
    card.className = 'scenario-card-item card';
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `${s.domain} scenario card: ${s.title}`);

    card.innerHTML = `
      <div class="card-retro-header">
        <span class="retro-card-dots">•••</span>
        <span class="retro-card-tag">${s.domain.toUpperCase()}</span>
      </div>
      <div class="sc-card-body" style="padding: 1rem; text-align: center;">
        <div class="sc-icon" style="font-size: 2.8rem; margin-bottom: 0.5rem;">${s.icon}</div>
        <div class="sc-domain-badge" style="font-size: 0.75rem; font-weight: 800; color: var(--neo-text-dim); text-transform: uppercase; margin-bottom: 0.25rem;">${s.domain}</div>
        <h3 class="sc-title" style="font-family: var(--font-display); font-size: 1.2rem; color: var(--neo-text); margin: 0 0 0.5rem 0;">${s.title}</h3>
        <p class="sc-hook" style="font-size: 0.88rem; color: var(--neo-text-muted); font-style: italic; margin: 0 0 1rem 0;">"${s.hook}"</p>
      </div>
      <div class="sc-card-footer" style="padding: 0 1rem 1rem 1rem;">
        <button class="btn btn-primary btn-block sc-action-btn" onclick="sfx.play('click'); openScenarioMiniGame('${key}');">
          Try Scenario →
        </button>
      </div>
    `;

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        sfx.play('click');
        openScenarioMiniGame(key);
      }
    });

    grid.appendChild(card);
  });
}

function renderDomainMockInterface(domainKey, mode) {
  const isSpike = mode === 'spike';
  
  if (domainKey === 'transport') {
    return `
      <div class="card" style="padding: 1rem; border: 2px solid var(--neo-border-color); background: var(--neo-surface); color: var(--neo-text);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
          <strong style="font-size: 0.95rem; color: var(--neo-text);">🚌 TransitExpress Bus #402 — Express to Airport</strong>
          <span class="badge ${isSpike ? 'badge-danger' : 'badge-success'}">${isSpike ? '⚠️ High Load (Race Condition)' : '1 Seat Available'}</span>
        </div>
        <p style="font-size: 0.85rem; color: var(--neo-text-muted); margin-bottom: 0.75rem;">
          ${isSpike ? 'Five passengers are clicking "Book Seat 12B" simultaneously under high request volume!' : 'Select the final remaining seat (12B) and click Book.'}
        </p>
        
        <div class="bus-seats-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; max-width: 320px; margin: 0 auto 1rem auto; padding: 12px; background: var(--neo-surface-alt); border: 2px solid var(--neo-border-color);">
          <div class="seat-box booked" style="padding: 8px; text-align: center; background: var(--neo-surface-elevated); border: 1px solid var(--neo-border-color); font-size: 0.75rem; font-weight: 700; color: var(--neo-text-dim);">10A (Booked)</div>
          <div class="seat-box booked" style="padding: 8px; text-align: center; background: var(--neo-surface-elevated); border: 1px solid var(--neo-border-color); font-size: 0.75rem; font-weight: 700; color: var(--neo-text-dim);">10B (Booked)</div>
          <div class="seat-box booked" style="padding: 8px; text-align: center; background: var(--neo-surface-elevated); border: 1px solid var(--neo-border-color); font-size: 0.75rem; font-weight: 700; color: var(--neo-text-dim);">11A (Booked)</div>
          <div class="seat-box booked" style="padding: 8px; text-align: center; background: var(--neo-surface-elevated); border: 1px solid var(--neo-border-color); font-size: 0.75rem; font-weight: 700; color: var(--neo-text-dim);">11B (Booked)</div>
          <div class="seat-box booked" style="padding: 8px; text-align: center; background: var(--neo-surface-elevated); border: 1px solid var(--neo-border-color); font-size: 0.75rem; font-weight: 700; color: var(--neo-text-dim);">12A (Booked)</div>
          <div id="bus-seat-12b" class="seat-box available" style="padding: 8px; text-align: center; background: ${isSpike ? '#fca5a5' : '#86efac'}; color: #000; border: 2px solid var(--neo-border-color); font-size: 0.75rem; font-weight: 800; cursor: pointer;" onclick="handleBusSeatClick()">
            12B ${isSpike ? '⚠️ CONFLICT' : '(OPEN)'}
          </div>
          <div class="seat-box booked" style="padding: 8px; text-align: center; background: var(--neo-surface-elevated); border: 1px solid var(--neo-border-color); font-size: 0.75rem; font-weight: 700; color: var(--neo-text-dim);">13A (Booked)</div>
          <div class="seat-box booked" style="padding: 8px; text-align: center; background: var(--neo-surface-elevated); border: 1px solid var(--neo-border-color); font-size: 0.75rem; font-weight: 700; color: var(--neo-text-dim);">13B (Booked)</div>
        </div>

        <div id="bus-booking-msg" style="text-align: center; padding: 0.5rem; font-weight: 700; font-size: 0.85rem; border: 1px dashed var(--neo-border-color); background: ${isSpike ? 'rgba(239, 68, 68, 0.18)' : 'rgba(34, 197, 94, 0.18)'}; color: var(--neo-text);">
          ${isSpike 
            ? '🚨 DUPLICATE RESERVATION CONFLICT! Both Passenger #1 and Passenger #2 received confirmation for Seat 12B due to concurrency race conditions under flood traffic!' 
            : 'Seat 12B is available. Click seat or click button below to reserve.'}
        </div>
      </div>
    `;
  } else if (domainKey === 'healthcare') {
    return `
      <div class="card" style="padding: 1rem; border: 2px solid var(--neo-border-color); background: var(--neo-surface); color: var(--neo-text);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
          <strong style="font-size: 0.95rem; color: var(--neo-text);">🏥 Metro General Hospital — Appointment Scheduling</strong>
          <span class="badge ${isSpike ? 'badge-danger' : 'badge-success'}">${isSpike ? '504 GATEWAY TIMEOUT' : 'ONLINE'}</span>
        </div>
        <div style="padding: 0.75rem; border: 1px solid var(--neo-border-color); background: var(--neo-surface-alt); color: var(--neo-text); font-size: 0.85rem;">
          ${isSpike 
            ? '<p style="color: var(--neo-red); margin: 0; font-weight: 700;">❌ Connection timed out: 48,000 requests in queue. Patient lookup queries dropping. Emergency doctors cannot load patient chart history!</p>'
            : '<p style="margin: 0; color: var(--neo-text);">📅 Available Slot: <strong>Dr. Sharma (Cardiology) — 10:30 AM Tomorrow</strong>. Response time: 24ms.</p>'}
        </div>
      </div>
    `;
  } else if (domainKey === 'banking') {
    return `
      <div class="card" style="padding: 1rem; border: 2px solid var(--neo-border-color); background: var(--neo-surface); color: var(--neo-text);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
          <strong style="font-size: 0.95rem; color: var(--neo-text);">🏦 First National Online Banking — Customer Portal</strong>
          <span class="badge ${isSpike ? 'badge-danger' : 'badge-success'}">${isSpike ? 'SERVICE UNREACHABLE' : 'ACCOUNT ACTIVE'}</span>
        </div>
        <div style="padding: 0.75rem; border: 1px solid var(--neo-border-color); background: var(--neo-surface-alt); color: var(--neo-text); font-size: 0.85rem;">
          <p style="margin: 0 0 0.5rem 0; color: var(--neo-text);">Checking Balance: <strong>$4,250.00 USD</strong> (Data Integrity Safe)</p>
          ${isSpike 
            ? '<p style="color: var(--neo-red); margin: 0; font-weight: 700;">⚠️ Portal queue overwhelmed (38,000 req/s). Login attempts hanging. NOTE: Funds are secure; this is an Availability failure, NOT account theft!</p>'
            : '<p style="margin: 0; color: var(--neo-green); font-weight: 700;">✅ Ready for transfer or statement download. Latency: 32ms.</p>'}
        </div>
      </div>
    `;
  } else if (domainKey === 'ecommerce') {
    return `
      <div class="card" style="padding: 1rem; border: 2px solid var(--neo-border-color); background: var(--neo-surface); color: var(--neo-text);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
          <strong style="font-size: 0.95rem; color: var(--neo-text);">🛒 CyberShop — Midnight Flash Sale</strong>
          <span class="badge ${isSpike ? 'badge-danger' : 'badge-success'}">${isSpike ? 'CHECKOUT FROZEN' : 'STOCK AVAILABLE'}</span>
        </div>
        <div style="padding: 0.75rem; border: 1px solid var(--neo-border-color); background: var(--neo-surface-alt); color: var(--neo-text); font-size: 0.85rem;">
          <p style="margin: 0 0 0.5rem 0; color: var(--neo-text);">Item: <strong>Limited Edition Cyber Defense Hoodie ($49.00)</strong> • Stock: 8 items</p>
          ${isSpike 
            ? '<p style="color: var(--neo-red); margin: 0; font-weight: 700;">⚠️ 65,000 checkout clicks per second! Legitimate shoppers mixing with automated scalper bots. Cart service failing with 503 Service Unavailable!</p>'
            : '<p style="margin: 0; color: var(--neo-green); font-weight: 700;">✅ Cart response normal. Caching active.</p>'}
        </div>
      </div>
    `;
  } else if (domainKey === 'gaming') {
    return `
      <div class="card" style="padding: 1rem; border: 2px solid var(--neo-border-color); background: var(--neo-surface); color: var(--neo-text);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
          <strong style="font-size: 0.95rem; color: var(--neo-text);">🎮 Apex Arena — Competitive Ranked Match #881</strong>
          <span class="badge ${isSpike ? 'badge-danger' : 'badge-success'}">${isSpike ? 'HIGH PING: 920ms' : 'PING: 24ms'}</span>
        </div>
        <div style="padding: 0.75rem; border: 1px solid var(--neo-border-color); background: var(--neo-surface-alt); color: var(--neo-text); font-size: 0.85rem;">
          ${isSpike 
            ? '<p style="color: var(--neo-red); margin: 0; font-weight: 700;">❌ Severe packet loss (48%)! Rubber-banding, player desync, and disconnected clients due to UDP traffic burst!</p>'
            : '<p style="margin: 0; color: var(--neo-green); font-weight: 700;">✅ 128 tick rate, 0% packet loss. Responsive hit registration.</p>'}
        </div>
      </div>
    `;
  } else if (domainKey === 'education') {
    return `
      <div class="card" style="padding: 1rem; border: 2px solid var(--neo-border-color); background: var(--neo-surface); color: var(--neo-text);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
          <strong style="font-size: 0.95rem; color: var(--neo-text);">🎓 University Exam Portal — CS401 Final Submission</strong>
          <span class="badge ${isSpike ? 'badge-danger' : 'badge-success'}">${isSpike ? 'SUBMISSION DEADLOCK' : 'PORTAL OPEN'}</span>
        </div>
        <div style="padding: 0.75rem; border: 1px solid var(--neo-border-color); background: var(--neo-surface-alt); color: var(--neo-text); font-size: 0.85rem;">
          ${isSpike 
            ? '<p style="color: var(--neo-red); margin: 0; font-weight: 700;">⚠️ 10,000 students submitting PDF papers in the final 60 seconds! Database connection pool exhausted; legitimate upload requests timing out!</p>'
            : '<p style="margin: 0; color: var(--neo-green); font-weight: 700;">✅ Upload endpoint responding in 45ms. Database pool idle.</p>'}
        </div>
      </div>
    `;
  } else if (domainKey === 'cloud') {
    return `
      <div class="card" style="padding: 1rem; border: 2px solid var(--neo-border-color); background: var(--neo-surface); color: var(--neo-text);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
          <strong style="font-size: 0.95rem; color: var(--neo-text);">☁️ CloudGateway API Router — Microservices Cluster</strong>
          <span class="badge ${isSpike ? 'badge-danger' : 'badge-success'}">${isSpike ? 'WORKER CRASH (502)' : 'ALL INSTANCES HEALTHY'}</span>
        </div>
        <div style="padding: 0.75rem; border: 1px solid var(--neo-border-color); background: var(--neo-surface-alt); color: var(--neo-text); font-size: 0.85rem;">
          ${isSpike 
            ? '<p style="color: var(--neo-red); margin: 0; font-weight: 700;">⚠️ Incoming API requests surged to 85,000 req/s. Worker Instance 1 & 2 CPU pinned at 100%, causing cascading restarts!</p>'
            : '<p style="margin: 0; color: var(--neo-green); font-weight: 700;">✅ Worker 1 (18% CPU), Worker 2 (22% CPU), Worker 3 (15% CPU). Requests balanced smoothly.</p>'}
        </div>
      </div>
    `;
  } else {
    // communication
    return `
      <div class="card" style="padding: 1rem; border: 2px solid var(--neo-border-color); background: var(--neo-surface); color: var(--neo-text);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
          <strong style="font-size: 0.95rem; color: var(--neo-text);">💬 ChatBridge Message Broker — Queue Pipeline</strong>
          <span class="badge ${isSpike ? 'badge-danger' : 'badge-success'}">${isSpike ? 'QUEUE SATURATED' : 'QUEUE NORMAL'}</span>
        </div>
        <div style="padding: 0.75rem; border: 1px solid var(--neo-border-color); background: var(--neo-surface-alt); color: var(--neo-text); font-size: 0.85rem;">
          ${isSpike 
            ? '<p style="color: var(--neo-red); margin: 0; font-weight: 700;">⚠️ Backpressure failure: 14,000 unhandled messages pending in RAM buffer. Message delivery latency +16 seconds!</p>'
            : '<p style="margin: 0; color: var(--neo-green); font-weight: 700;">✅ Pending messages: 12. Average delivery delay: 15ms.</p>'}
        </div>
      </div>
    `;
  }
}

window.handleBusSeatClick = function() {
  const seat = document.getElementById('bus-seat-12b');
  const msg = document.getElementById('bus-booking-msg');
  if (seat && msg) {
    sfx.play('success');
    seat.style.backgroundColor = 'var(--neo-yellow)';
    seat.innerText = '12B (RESERVED)';
    msg.innerHTML = '✅ Booking Confirmed for Passenger #1! Seat 12B locked.';
  }
};

window.openScenarioMiniGame = function(domainKey) {
  const s = EducationalData.scenarios[domainKey];
  if (!s) return;

  const cardsView = document.getElementById('scenarios-cards-view');
  const gameView = document.getElementById('scenario-minigame-view');
  
  if (cardsView) cardsView.style.display = 'none';
  if (gameView) {
    gameView.style.display = 'block';
    gameView.innerHTML = `
      <div class="minigame-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
        <button class="btn btn-secondary btn-sm" onclick="sfx.play('click'); closeScenarioMiniGame()">← Return to All Scenarios</button>
        <div class="status-pill stopped" style="background: var(--neo-yellow); color: #000; font-weight: 800; border: 2px solid #000; font-size: 0.72rem; padding: 0.3rem 0.6rem;">
          ⚡ SIMULATED ENVIRONMENT — NO REAL SERVICES AFFECTED
        </div>
      </div>

      <div class="card" style="margin-bottom: 1.25rem; background: var(--neo-surface); color: var(--neo-text);">
        <div class="card-retro-header">
          <span class="retro-card-dots">•••</span>
          <span class="retro-card-tag">${s.domain.toUpperCase()} SIMULATOR</span>
        </div>
        <h2 style="font-family: var(--font-display); font-size: 1.8rem; margin: 0 0 0.25rem 0; color: var(--neo-text);">${s.icon} ${s.domain}: ${s.title}</h2>
        <p style="color: var(--neo-text-muted); font-size: 0.95rem; margin: 0;">${s.hook}</p>
      </div>

      <!-- 7-Stage Stepper Header -->
      <div class="minigame-stepper">
        <span class="step-pill active" id="step-pill-1">1. Situation</span>
        <span class="step-pill" id="step-pill-2">2. Normal</span>
        <span class="step-pill" id="step-pill-3">3. Spike</span>
        <span class="step-pill" id="step-pill-4">4. Diagnose</span>
        <span class="step-pill" id="step-pill-5">5. Defend</span>
        <span class="step-pill" id="step-pill-6">6. Recovery</span>
        <span class="step-pill" id="step-pill-7">7. Takeaway</span>
      </div>
      
      <div class="minigame-container">
        <!-- Stage 1 — Situation -->
        <div class="minigame-stage" id="mg-stage-1" style="display: block;">
          <div class="mg-panel">
            <div class="card-retro-header">
              <span class="retro-card-dots">•••</span>
              <span class="retro-card-tag">STAGE 1 / 7 • THE SITUATION</span>
            </div>
            <h3>What is Happening in this Real-Life System?</h3>
            <p style="font-size: 1rem; line-height: 1.6; margin-bottom: 1rem;">${s.situation}</p>
            <div class="mg-callout-box" style="padding: 1rem; border: 2px solid var(--neo-border-color); background: var(--neo-yellow); color: #000; margin-bottom: 1.25rem;">
              <strong>Core Engineering Concept:</strong> ${s.theory}
            </div>
            <p class="mg-instruction" style="font-size: 0.9rem; color: var(--neo-text-muted);">First, test the functioning mock application under normal baseline traffic.</p>
            <button class="btn btn-primary" onclick="sfx.play('click'); setMiniGameStage(2);">Launch Normal Operation View →</button>
          </div>
        </div>

        <!-- Stage 2 — Normal Operation -->
        <div class="minigame-stage" id="mg-stage-2" style="display: none;">
          <div class="mg-panel">
            <div class="card-retro-header">
              <span class="retro-card-dots">•••</span>
              <span class="retro-card-tag">STAGE 2 / 7 • NORMAL OPERATION</span>
            </div>
            <h3>Baseline Operation: Authentic Fictional System</h3>
            <p style="margin-bottom: 1rem;">Interact with the domain application below. Under normal traffic load, requests process instantly and resources stay healthy.</p>
            
            <div class="mg-health-gauge-box">
              <span class="mg-gauge-label">Service Health Indicator</span>
              <div class="gauge-bar-container">
                <div class="gauge-bar" style="width: 98%; background-color: var(--px-neon-green);"></div>
              </div>
              <span class="badge badge-success" style="align-self: flex-start; margin-top: 0.25rem;">OPTIMAL (98% HEALTHY)</span>
            </div>

            <!-- Domain-Specific Interactive Mock Component -->
            <div class="domain-mock-wrapper" id="domain-mock-container-normal" style="margin: 1.25rem 0;">
              ${renderDomainMockInterface(domainKey, 'normal')}
            </div>

            <div class="mg-metrics healthy">
              <div class="mg-metric"><span class="mg-label">Traffic Rate:</span> <span class="mg-val">${s.normal.rps}</span></div>
              <div class="mg-metric"><span class="mg-label">Response Time:</span> <span class="mg-val text-lime">${s.normal.latency}</span></div>
              <div class="mg-metric"><span class="mg-label">Active Queue:</span> <span class="mg-val">${s.normal.queue}</span></div>
              <div class="mg-metric"><span class="mg-label">System State:</span> <span class="mg-val text-lime">${s.normal.healthLabel}</span></div>
            </div>

            <p class="mg-instruction" style="margin-top: 1rem; color: var(--neo-text-muted);">Now, test what happens when a sudden massive traffic surge hits this service.</p>
            <button class="btn btn-attack" onclick="sfx.play('alarm'); setMiniGameStage(3);">Simulate Traffic Spike ⚡</button>
          </div>
        </div>

        <!-- Stage 3 — Simulate the Problem -->
        <div class="minigame-stage" id="mg-stage-3" style="display: none;">
          <div class="mg-panel alert">
            <div class="card-retro-header">
              <span class="retro-card-dots">•••</span>
              <span class="retro-card-tag">STAGE 3 / 7 • TRAFFIC SPIKE SIMULATION</span>
            </div>
            <h3>⚠️ Surge Detected: Service Under Critical Pressure!</h3>
            <p style="margin-bottom: 1rem;">An overwhelming rush of concurrent requests has hit the service endpoints!</p>

            <div class="mg-health-gauge-box">
              <span class="mg-gauge-label">Service Health Indicator</span>
              <div class="gauge-bar-container">
                <div class="gauge-bar" style="width: 15%; background-color: var(--px-neon-red);"></div>
              </div>
              <span class="badge badge-danger" style="align-self: flex-start; margin-top: 0.25rem;">CRITICAL DoS DEGRADATION (15%)</span>
            </div>

            <!-- Domain-Specific Overloaded Failure Mock -->
            <div class="domain-mock-wrapper" id="domain-mock-container-spike" style="margin: 1.25rem 0;">
              ${renderDomainMockInterface(domainKey, 'spike')}
            </div>

            <div class="mg-metrics critical">
              <div class="mg-metric"><span class="mg-label">Traffic Rate:</span> <span class="mg-val text-red">${s.spike.rps}</span></div>
              <div class="mg-metric"><span class="mg-label">Response Time:</span> <span class="mg-val text-red">${s.spike.latency}</span></div>
              <div class="mg-metric"><span class="mg-label">Active Queue:</span> <span class="mg-val text-red">${s.spike.queue}</span></div>
              <div class="mg-metric"><span class="mg-label">System State:</span> <span class="mg-val text-red">${s.spike.healthLabel}</span></div>
            </div>

            <p class="mg-instruction" style="margin-top: 1rem; color: var(--neo-text-muted);">Service degradation is verified. Let's inspect the telemetry signals to identify the exact root cause.</p>
            <button class="btn btn-primary" onclick="sfx.play('click'); setMiniGameStage(4);">Diagnose the Issue →</button>
          </div>
        </div>

        <!-- Stage 4 — Diagnose -->
        <div class="minigame-stage" id="mg-stage-4" style="display: none;">
          <div class="mg-panel">
            <div class="card-retro-header">
              <span class="retro-card-dots">•••</span>
              <span class="retro-card-tag">STAGE 4 / 7 • DIAGNOSE</span>
            </div>
            <h3>Diagnostic Analysis</h3>
            <p style="font-size: 1.05rem; font-weight: 700; margin-bottom: 1rem;">Inspection Question: ${s.diagnose.question}</p>
            
            <div class="mg-options" style="display: flex; flex-direction: column; gap: 0.75rem;">
              ${s.diagnose.options.map((opt, idx) => `
                <button class="btn btn-outline mg-diag-opt" style="text-align: left; padding: 0.9rem;" data-opt-idx="${idx}" onclick="sfx.play('click'); checkScenarioDiagnose('${domainKey}', ${idx});">
                  <span style="font-weight: 800; margin-right: 0.5rem;">${String.fromCharCode(65 + idx)}.</span> ${opt.text}
                </button>
              `).join('')}
            </div>

            <div id="mg-diagnose-feedback" style="display: none; margin-top: 1.25rem; padding: 1rem; border: 2px solid var(--neo-border-color); background: var(--neo-surface-alt);"></div>
          </div>
        </div>

        <!-- Stage 5 — Choose a Defense -->
        <div class="minigame-stage" id="mg-stage-5" style="display: none;">
          <div class="mg-panel">
            <div class="card-retro-header">
              <span class="retro-card-dots">•••</span>
              <span class="retro-card-tag">STAGE 5 / 7 • CHOOSE A DEFENSE</span>
            </div>
            <h3>Select a Suitable Defense Strategy</h3>
            <p style="margin-bottom: 1.25rem;">Choose a defense mechanism to deploy against this failure mode and observe the recovery:</p>
            <div class="mg-defenses" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;">
              ${s.defenses.map((opt, idx) => `
                <div class="card mg-defense-card" style="padding: 1rem; border: 2px solid var(--neo-border-color); background: var(--neo-surface); color: var(--neo-text); cursor: pointer; transition: transform 0.15s ease;" onclick="sfx.play('click'); applyScenarioDefense('${domainKey}', ${idx});">
                  <div class="card-retro-header">
                    <span class="retro-card-dots">•••</span>
                    <span class="retro-card-tag">DEFENSE OPTION ${idx + 1}</span>
                  </div>
                  <h4 style="font-family: var(--font-display); font-size: 1.1rem; color: var(--neo-text); margin: 0.5rem 0 0.25rem 0;">${opt.name}</h4>
                  <p style="font-size: 0.88rem; color: var(--neo-text-muted); margin-bottom: 1rem;">${opt.description}</p>
                  <button class="btn btn-primary btn-sm btn-block">Deploy Defense &rarr;</button>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Stage 6 — Recovery -->
        <div class="minigame-stage" id="mg-stage-6" style="display: none;">
          <div class="mg-panel success" id="mg-recovery-panel">
            <div class="card-retro-header">
              <span class="retro-card-dots">•••</span>
              <span class="retro-card-tag">STAGE 6 / 7 • RECOVERY</span>
            </div>
            <h3 id="mg-recovery-title" style="font-size: 1.4rem;">🛡️ Defense Evaluated</h3>
            <p id="mg-recovery-desc" style="font-size: 1rem; margin-bottom: 1.25rem; line-height: 1.5;"></p>

            <div class="mg-before-after" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem;">
              <div class="card" style="padding: 1rem; border: 2px solid var(--neo-red); background: var(--neo-surface-alt); color: var(--neo-text);">
                <strong style="color: var(--neo-red); display: block; margin-bottom: 0.5rem;">BEFORE DEFENSE (UNDER SURGE)</strong>
                <div class="mg-metrics critical">
                  <div class="mg-metric"><span>Latency:</span> <span class="text-red">${s.spike.latency}</span></div>
                  <div class="mg-metric"><span>Queue:</span> <span class="text-red">${s.spike.queue}</span></div>
                  <div class="mg-metric"><span>Status:</span> <span class="text-red">${s.spike.healthLabel}</span></div>
                </div>
              </div>
              <div class="card" style="padding: 1rem; border: 2px solid var(--neo-lime); background: var(--neo-surface-alt); color: var(--neo-text);">
                <strong style="color: var(--neo-lime); display: block; margin-bottom: 0.5rem;">AFTER DEFENSE (PROTECTED)</strong>
                <div class="mg-metrics healthy">
                  <div class="mg-metric"><span>Latency:</span> <span class="text-lime">${s.normal.latency}</span></div>
                  <div class="mg-metric"><span>Queue:</span> <span class="text-lime">${s.normal.queue}</span></div>
                  <div class="mg-metric"><span>Status:</span> <span class="text-lime">${s.normal.healthLabel}</span></div>
                </div>
              </div>
            </div>

            <div id="mg-recovery-actions" style="margin-top: 1rem;">
              <button class="btn btn-primary" onclick="sfx.play('click'); setMiniGameStage(7);">Review Learning Takeaway →</button>
            </div>
          </div>
        </div>

        <!-- Stage 7 — Learning Takeaway -->
        <div class="minigame-stage" id="mg-stage-7" style="display: none;">
          <div class="mg-panel success">
            <div class="card-retro-header">
              <span class="retro-card-dots">•••</span>
              <span class="retro-card-tag">STAGE 7 / 7 • COMPLETE</span>
            </div>
            <div style="text-align: center; margin-bottom: 1.5rem;">
              <div style="font-size: 3.5rem; margin-bottom: 0.5rem;">🏆</div>
              <h3 style="font-family: var(--font-display); font-size: 1.5rem; color: var(--neo-text);">Scenario Successfully Mastered!</h3>
              <p style="color: var(--neo-text-muted);">You observed the failure mode, accurately diagnosed the vulnerability, and applied effective defenses.</p>
            </div>
            <div class="mg-takeaway" style="padding: 1.25rem; border: 2px solid var(--neo-border-color); background: var(--neo-lime); color: #000; box-shadow: 3px 3px 0 var(--neo-shadow-color);">
              <strong style="font-size: 1rem; display: block; margin-bottom: 0.5rem;">Key Engineering Takeaway:</strong>
              <p style="font-size: 0.95rem; line-height: 1.6; margin: 0;">${s.takeaway}</p>
            </div>
            <div class="chaotic-actions" style="margin-top: 1.75rem; display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap;">
              <button class="btn btn-secondary" onclick="sfx.play('click'); closeScenarioMiniGame();">🎮 Try Another Scenario</button>
              <button class="btn btn-primary" onclick="sfx.play('click'); navigateToView('quiz');">🎯 Quiz Arena →</button>
            </div>
          </div>
        </div>

      </div>
    `;
  }
};

window.setMiniGameStage = function(stageNum) {
  for (let i = 1; i <= 7; i++) {
    const stageEl = document.getElementById(`mg-stage-${i}`);
    if (stageEl) stageEl.style.display = 'none';
    const pill = document.getElementById(`step-pill-${i}`);
    if (pill) {
      pill.classList.toggle('active', i === stageNum);
      pill.classList.toggle('completed', i < stageNum);
    }
  }
  const target = document.getElementById(`mg-stage-${stageNum}`);
  if (target) target.style.display = 'block';
};

window.checkScenarioDiagnose = function(domainKey, selectedIdx) {
  const s = EducationalData.scenarios[domainKey];
  const fb = document.getElementById('mg-diagnose-feedback');
  const option = s.diagnose.options[selectedIdx];
  const isCorrect = option.correct;
  
  if (isCorrect) sfx.play('success');
  else sfx.play('alarm');

  document.querySelectorAll('.mg-diag-opt').forEach((btn, idx) => {
    btn.classList.toggle('selected', idx === selectedIdx);
  });

  fb.style.display = 'block';
  fb.style.backgroundColor = 'var(--neo-surface-alt)';
  fb.style.border = `2px solid ${isCorrect ? 'var(--neo-lime)' : 'var(--neo-red)'}`;
  fb.style.color = 'var(--neo-text)';
  fb.innerHTML = `
    <strong style="color: ${isCorrect ? 'var(--neo-lime)' : 'var(--neo-red)'}; font-size: 1rem;">${isCorrect ? '✅ Correct Diagnosis!' : '❌ Incorrect Diagnosis'}</strong>
    <p style="margin-top: 0.5rem; font-size: 0.9rem; color: var(--neo-text);">${option.reason || (isCorrect ? 'You accurately identified the root vulnerability.' : 'Review the telemetry metrics and test another answer.')}</p>
    ${isCorrect ? `<button class="btn btn-primary btn-sm" style="margin-top: 0.75rem;" onclick="sfx.play('click'); setMiniGameStage(5);">Proceed to Deploy Defense →</button>` : ''}
  `;
};

window.applyScenarioDefense = function(domainKey, selectedIdx) {
  const s = EducationalData.scenarios[domainKey];
  const def = s.defenses[selectedIdx];
  
  setMiniGameStage(6);
  
  const recoveryPanel = document.getElementById('mg-recovery-panel');
  const title = document.getElementById('mg-recovery-title');
  const desc = document.getElementById('mg-recovery-desc');
  const actions = document.getElementById('mg-recovery-actions');

  if (def.success) {
    sfx.play('success');
    if (recoveryPanel) recoveryPanel.className = 'mg-panel success';
    if (title) title.innerText = '🛡️ Defense Successful!';
    if (desc) desc.innerText = def.effect;
    if (actions) {
      actions.innerHTML = `
        <button class="btn btn-primary" onclick="sfx.play('click'); setMiniGameStage(7);">View Key Takeaway →</button>
      `;
    }
  } else {
    sfx.play('alarm');
    if (recoveryPanel) recoveryPanel.className = 'mg-panel alert';
    if (title) title.innerText = '⚠️ Incomplete Defense Choice';
    if (desc) desc.innerText = def.effect;
    if (actions) {
      actions.innerHTML = `
        <div style="padding: 0.75rem; border: 1px solid var(--neo-border-color); background: var(--neo-yellow); color: #000; margin-bottom: 0.75rem; font-size: 0.85rem;">
          <strong>Security Analysis:</strong> ${def.explanation}
        </div>
        <button class="btn btn-secondary" onclick="sfx.play('click'); setMiniGameStage(5);">← Choose Another Defense</button>
      `;
    }
  }
};

window.closeScenarioMiniGame = function() {
  const cardsView = document.getElementById('scenarios-cards-view');
  const gameView = document.getElementById('scenario-minigame-view');
  if (gameView) {
    gameView.innerHTML = '';
    gameView.style.display = 'none';
  }
  if (cardsView) cardsView.style.display = 'block';
};

/* ==========================================================================
   VIEW 4: NOTES & LAST-MINUTE REVISION
   ========================================================================== */
function initNotes() {
  const searchInput = document.getElementById('notes-cards-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      handleNotesSearch(e.target.value);
    });
  }
}

window.handleNotesSearch = function(query) {
  const q = (query || '').toLowerCase().trim();
  const cards = document.querySelectorAll('.mini-resource-card');
  let matchCount = 0;

  cards.forEach((card) => {
    const title = (card.querySelector('.res-title')?.innerText || '').toLowerCase();
    const desc = (card.querySelector('.res-desc')?.innerText || '').toLowerCase();
    const filename = (card.querySelector('.res-filename')?.innerText || '').toLowerCase();

    const matches = !q || title.includes(q) || desc.includes(q) || filename.includes(q);
    card.style.display = matches ? 'flex' : 'none';
    if (matches) matchCount++;
  });

  const indicator = document.getElementById('notes-learning-indicator');
  if (indicator) {
    indicator.innerHTML = q 
      ? `<span style="font-weight: 800;">🔍 Search:</span> ${matchCount} of 5 PDFs match "${query}"`
      : `<span style="font-weight: 800;">📚 Resources:</span> 5 PDFs Ready to Download`;
  }
};

window.downloadPdfResource = async function(type) {
  sfx.play('click');
  if (!window.vlab) {
    alert('PDF Service is only accessible inside the desktop application.');
    return;
  }
  const res = await window.vlab.downloadPdf(type);
  if (res && res.success) {
    alert(`✅ PDF successfully saved to:\n${res.path}`);
  } else if (res && !res.cancelled && res.error) {
    alert(`Could not save PDF: ${res.error}`);
  }
};

window.previewPdfResource = async function(type) {
  sfx.play('click');
  if (!window.vlab) {
    alert('PDF preview is only accessible inside the desktop application.');
    return;
  }
  const res = await window.vlab.openPdf(type);
  if (res && !res.success) {
    alert(`Could not open PDF: ${res.error || 'File not found'}`);
  }
};

window.openShareNotesModal = function() {
  sfx.play('click');
  const m = document.getElementById('modal-share-notes');
  if (m) m.style.display = 'flex';
};

window.closeShareNotesModal = function() {
  const m = document.getElementById('modal-share-notes');
  if (m) m.style.display = 'none';
  const toast = document.getElementById('share-toast-msg');
  if (toast) toast.style.display = 'none';
};

function showShareToast(message) {
  const toast = document.getElementById('share-toast-msg');
  if (toast) {
    toast.innerText = message;
    toast.style.display = 'block';
    setTimeout(() => {
      if (toast) toast.style.display = 'none';
    }, 4000);
  }
}

window.shareNotesPage = async function() {
  sfx.play('click');
  const shareData = {
    title: 'Flood Attack Cybersecurity Notes',
    text: 'Check out these beginner-friendly Flood Attack cybersecurity notes!',
    url: window.location.href,
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      showShareToast('✅ Notes shared successfully via Web Share!');
      return;
    } catch (_) {}
  }

  await copyNotesPageLink();
};

window.copyNotesPageLink = async function() {
  sfx.play('click');
  const textToCopy = `Check out these beginner-friendly Flood Attack cybersecurity notes! (${window.location.href})`;
  try {
    await navigator.clipboard.writeText(textToCopy);
    showShareToast('📋 Notes link copied to clipboard!');
  } catch (_) {
    showShareToast('📋 Link: ' + window.location.href);
  }
};

window.shareSelectedPdf = async function() {
  sfx.play('click');
  const select = document.getElementById('share-pdf-select');
  const selectedType = select ? select.value : 'concept-deep-dive';
  const pdfNames = {
    'concept-deep-dive': 'Flood_Attack_Concept_Deep_Dive.pdf',
    'last-minute-revision': 'Flood_Attack_Last_Minute_Revision.pdf',
    'important-concepts': 'Flood_Attack_Important_Concepts.pdf',
    'definitions-glossary': 'Flood_Attack_Definitions_Glossary.pdf',
    'diagrams-and-charts': 'Flood_Attack_Diagrams_and_Charts.pdf',
  };
  const filename = pdfNames[selectedType] || 'Flood_Attack_Concept_Deep_Dive.pdf';

  if (navigator.share) {
    try {
      await navigator.share({
        title: `Flood Attack Study Guide: ${filename}`,
        text: `Here is the ${filename} cybersecurity study guide!`,
        url: window.location.href,
      });
      showShareToast(`✅ Shared ${filename} via Web Share!`);
      return;
    } catch (_) {}
  }

  await copySelectedPdfLink();
};

window.copySelectedPdfLink = async function() {
  sfx.play('click');
  const select = document.getElementById('share-pdf-select');
  const selectedType = select ? select.value : 'concept-deep-dive';
  const pdfNames = {
    'concept-deep-dive': 'Flood_Attack_Concept_Deep_Dive.pdf',
    'last-minute-revision': 'Flood_Attack_Last_Minute_Revision.pdf',
    'important-concepts': 'Flood_Attack_Important_Concepts.pdf',
    'definitions-glossary': 'Flood_Attack_Definitions_Glossary.pdf',
    'diagrams-and-charts': 'Flood_Attack_Diagrams_and_Charts.pdf',
  };
  const filename = pdfNames[selectedType] || 'Flood_Attack_Concept_Deep_Dive.pdf';
  const textToCopy = `Resource: ${filename} (Flood Attack Virtual Lab)`;

  try {
    await navigator.clipboard.writeText(textToCopy);
    showShareToast(`📋 Copied reference for ${filename} to clipboard!`);
  } catch (_) {
    showShareToast(`📋 ${filename}`);
  }
};

window.downloadSelectedPdfFromShare = function() {
  const select = document.getElementById('share-pdf-select');
  const selectedType = select ? select.value : 'concept-deep-dive';
  downloadPdfResource(selectedType);
};

function renderTocList(chaptersList) {
  const toc = document.getElementById('toc-list');
  if (!toc) return;

  toc.innerHTML = '';
  chaptersList.forEach((c) => {
    const item = document.createElement('div');
    item.className = `toc-item ${c.id === state.currentChapterId ? 'active' : ''}`;
    const readCheck = state.chaptersRead.has(c.id) ? '✓' : '';
    item.innerHTML = `<span>${c.id}. ${c.title}</span><span style="color: var(--neo-lime); font-size: 0.72rem;">${readCheck}</span>`;
    item.addEventListener('click', () => {
      state.isRevisionMode = false;
      toggleRevisionView(false);
      renderChapter(c.id);
    });
    toc.appendChild(item);
  });
}

function toggleRevisionView(showRevision) {
  const chView = document.getElementById('chapter-view');
  const revView = document.getElementById('revision-view');
  const btnRev = document.getElementById('btn-toggle-revision');

  if (chView && revView) {
    chView.style.display = showRevision ? 'none' : 'block';
    revView.style.display = showRevision ? 'block' : 'none';
  }

  if (btnRev) {
    btnRev.innerText = showRevision ? '📖 Back to 25 Chapters Syllabus' : '⚡ Last-Minute Revision Mode (5-10 Min)';
  }

  if (showRevision) {
    renderRevisionContent();
  }
}

function renderChapter(chId) {
  state.currentChapterId = chId;
  const c = EducationalData.chapters.find((x) => x.id === chId);
  const container = document.getElementById('chapter-view');
  if (!container || !c) return;

  // Mark chapter as read
  state.chaptersRead.add(chId);
  saveProgress();

  // Update TOC active highlight
  document.querySelectorAll('.toc-item').forEach((item) => {
    const text = item.innerText;
    item.classList.toggle('active', text.startsWith(`${chId}.`));
  });

  const prevId = chId > 1 ? chId - 1 : null;
  const nextId = chId < 25 ? chId + 1 : null;

  container.innerHTML = `
    <div class="chapter-header">
      <span class="chapter-badge">CHAPTER ${c.id} OF 25</span>
      <h2 class="chapter-title">${c.title}</h2>
    </div>

    <div class="definition-box">
      <strong>Simple Definition:</strong> ${c.definition}
    </div>

    <div class="notes-section-block">
      <h3>Detailed Explanation</h3>
      <p>${c.explanation}</p>
    </div>

    <div class="analogy-callout">
      <strong>Relatable Everyday Analogy:</strong><br>
      ${c.analogy}
    </div>

    <div class="notes-section-block">
      <h3>Practical Example</h3>
      <p>${c.example}</p>
    </div>

    ${c.diagram ? `
      <div class="notes-section-block">
        <h3>Architecture / Process Flow</h3>
        <div class="diagram-ascii-box">${c.diagram}</div>
      </div>
    ` : ''}

    <div class="notes-section-block">
      <h3>Key Vocabulary Terms</h3>
      <div class="key-terms-row">
        ${c.keyTerms.map((t) => `<span class="term-tag">${t}</span>`).join('')}
      </div>
    </div>

    <div class="review-qna-block">
      <h3 style="color: var(--neo-lime); font-size: 0.95rem; margin-bottom: 0.5rem;">Interactive Self-Check Review Questions</h3>
      ${c.qna.map((q, idx) => `
        <div class="qna-item" id="qna-item-${idx}">
          <div class="qna-question" onclick="this.parentElement.classList.toggle('open')">
            <span>Q${idx + 1}: ${q.q}</span>
            <span style="font-size: 0.75rem; color: var(--neo-cyan);">Show Answer ▼</span>
          </div>
          <div class="qna-answer">${q.a}</div>
        </div>
      `).join('')}
    </div>

    <div class="remember-summary-box">
      <strong>Remember This:</strong>
      <p style="font-size: 0.85rem; color: var(--text-main); margin-bottom: 0;">${c.summary}</p>
    </div>

    <div class="chapter-nav-buttons">
      ${prevId ? `<button class="btn btn-secondary" onclick="renderChapter(${prevId})">← Previous Chapter (${prevId})</button>` : '<div></div>'}
      ${nextId ? `<button class="btn btn-primary" onclick="renderChapter(${nextId})">Next Chapter (${nextId}) →</button>` : '<button class="btn btn-success" onclick="navigateToView(\'quiz\')">Take Mastery Quiz →</button>'}
    </div>
  `;
}

function renderRevisionContent() {
  const container = document.getElementById('revision-view');
  if (!container) return;

  const defs = EducationalData.revisionDefinitions;
  const cards = EducationalData.revisionFlashcards;

  container.innerHTML = `
    <div class="section-header-banner" style="border-bottom: 2px solid var(--neo-purple); padding-bottom: 1rem; margin-bottom: 1.5rem;">
      <h2 style="color: var(--neo-text);">⚡ Last-Minute Revision & High-Yield Exam Summary</h2>
      <p style="color: var(--neo-text-muted);">Revise the entire topic in 5 to 10 minutes. Includes 15 core definitions, comparison tables, and 15 interactive recall flashcards.</p>
    </div>

    <h3 style="color: var(--neo-cyan); font-size: 1.1rem; margin-bottom: 0.75rem;">1. One-Line Core Definitions</h3>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; margin-bottom: 2rem;">
      ${defs.map((d) => `
        <div style="background: var(--neo-surface); padding: 0.75rem 0.85rem; border: 2px solid var(--neo-border-color); box-shadow: 2px 2px 0 var(--neo-shadow-color);">
          <strong style="color: var(--neo-purple); font-size: 0.85rem; display: block; margin-bottom: 0.2rem;">${d.term}:</strong>
          <span style="font-size: 0.82rem; color: var(--neo-text); display: block;">${d.def}</span>
        </div>
      `).join('')}
    </div>

    <h3 style="color: var(--neo-cyan); font-size: 1.1rem; margin-bottom: 0.75rem;">2. Five-Stage Attack Lifecycle</h3>
    <div class="diagram-ascii-box" style="margin-bottom: 2rem;">
[Stage 1: Normal Baseline] ────> 2 PPS, CPU &lt; 5%, Status: HEALTHY
         │
         ▼
[Stage 2: Traffic Spike] ───────> Sudden influx; PPS surges to 35,000+
         │
         ▼
[Stage 3: Resource Pressure] ───> CPU interrupts reach core limit; Status: CRITICAL (DoS)
         │
         ▼
[Stage 4: Mitigation Active] ───> iptables rate-limiting engages; Netfilter drops excess
         │
         ▼
[Stage 5: Recovery] ────────────> Packet intake drops to 1-2 PPS; Target returns to HEALTHY!
    </div>

    <h3 style="color: var(--neo-cyan); font-size: 1.1rem; margin-bottom: 0.5rem;">3. Interactive Flashcards (Click to Reveal Answer)</h3>
    <div class="flashcards-grid">
      ${cards.map((fc, idx) => `
        <div class="flashcard" onclick="this.classList.toggle('revealed')">
          <div class="flashcard-q">Card ${idx + 1}: ${fc.q}</div>
          <div class="flashcard-a">${fc.a}</div>
          <span style="font-size: 0.68rem; color: var(--neo-text-dim); display: block; margin-top: 0.4rem;">Click card to flip</span>
        </div>
      `).join('')}
    </div>
  `;
}

/* ==========================================================================
   VIEW 5: QUIZ ARENA (3 LEVELS, 10 QUESTIONS EACH, MEDALS & REVIEW)
   ========================================================================== */
function initQuiz() {
  const startBtns = document.querySelectorAll('[data-start-tier]');
  startBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tier = btn.getAttribute('data-start-tier');
      startQuizTier(tier);
    });
  });
  renderQuizTierStats();
}

function renderQuizTierStats() {
  ['easy', 'moderate', 'difficult'].forEach((tier) => {
    const card = document.querySelector(`.quiz-tier-card[data-tier="${tier}"]`);
    if (!card) return;
    const best = state.userStats.quizzesCompleted ? state.userStats.quizzesCompleted[tier] : null;
    let badgeEl = card.querySelector('.tier-best-score-badge');
    if (!badgeEl) {
      badgeEl = document.createElement('div');
      badgeEl.className = 'tier-best-score-badge';
      badgeEl.style.cssText = 'margin-top: 0.5rem; font-size: 0.8rem; font-weight: 800; color: #000; padding: 3px 6px; border: 1px solid #000; background: var(--neo-yellow); display: inline-block;';
      card.querySelector('.tier-rules')?.after(badgeEl);
    }
    if (typeof best === 'number') {
      let medalIcon = '🔄';
      if (best >= 9) medalIcon = '🥇 Gold';
      else if (best >= 7) medalIcon = '🥈 Silver';
      else if (best >= 5) medalIcon = '🥉 Bronze';
      else medalIcon = '🔄 Reboot';
      badgeEl.innerText = `Best: ${best} / 10 (${medalIcon})`;
      badgeEl.style.display = 'inline-block';
    } else {
      badgeEl.style.display = 'none';
    }
  });
}

function startQuizTier(tierName) {
  state.activeQuizTier = tierName;
  state.currentQuestionIndex = 0;
  state.quizAnswers = [];
  state.quizScore = 0;

  const questions = EducationalData.quizzes[tierName] || [];
  state.maxQuizScore = questions.length; // strictly 10

  document.getElementById('quiz-level-select').style.display = 'none';
  document.getElementById('quiz-results-screen').style.display = 'none';
  document.getElementById('quiz-active-screen').style.display = 'block';

  renderCurrentQuizQuestion();
}

function renderCurrentQuizQuestion() {
  const screen = document.getElementById('quiz-active-screen');
  const questions = EducationalData.quizzes[state.activeQuizTier] || [];
  const q = questions[state.currentQuestionIndex];
  if (!screen || !q) return;

  const total = questions.length;
  const currentNum = state.currentQuestionIndex + 1;

  screen.innerHTML = `
    <div class="quiz-active-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 2px solid #000; padding-bottom: 0.5rem;">
      <span class="quiz-q-progress" style="font-weight: 800; font-family: var(--font-display); font-size: 1.1rem;">
        ${state.activeQuizTier.toUpperCase()} QUIZ • QUESTION ${currentNum} OF ${total}
      </span>
      <span class="quiz-score-live" style="font-weight: 800; background: var(--neo-yellow); padding: 4px 8px; border: 2px solid #000;">
        Current Score: ${state.quizScore} / ${total}
      </span>
    </div>

    <div class="card quiz-question-card" style="padding: 1.5rem; border: 2px solid var(--neo-border-color); background: var(--neo-surface); color: var(--neo-text);">
      <div style="font-size: 0.8rem; font-weight: 800; color: var(--neo-text-dim); text-transform: uppercase; margin-bottom: 0.4rem;">
        Topic: ${q.topic || 'Cybersecurity Concepts'}
      </div>
      <h3 class="quiz-question-prompt" style="font-size: 1.15rem; font-weight: 800; margin-bottom: 1.25rem; color: var(--neo-text);">
        ${currentNum}. ${q.question}
      </h3>

      <div class="quiz-options-list" id="quiz-options-list" style="display: flex; flex-direction: column; gap: 0.6rem;">
        ${q.options.map((opt, idx) => `
          <button class="quiz-option-btn" data-opt-idx="${idx}" onclick="handleOptionSelect(${idx})" style="text-align: left; padding: 0.85rem 1rem; border: 2px solid var(--neo-border-color); background: var(--neo-surface-alt); color: var(--neo-text); font-weight: 700; cursor: pointer; transition: all 0.1s ease;">
            <span style="font-weight: 900; margin-right: 0.5rem;">${String.fromCharCode(65 + idx)}.</span> ${opt}
          </button>
        `).join('')}
      </div>

      <div style="margin-top: 1.25rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: gap: 0.75rem;">
        <button class="btn btn-outline btn-xs" id="btn-quiz-hint" onclick="toggleQuizHint()">💡 Need a Hint?</button>
        <button class="btn btn-primary" id="btn-submit-answer" disabled onclick="submitQuizAnswer()">Submit Answer</button>
      </div>

      <div id="quiz-hint-box" class="quiz-hint-panel" style="display: none; margin-top: 1rem; padding: 0.75rem; border: 2px solid var(--neo-border-color); background: var(--neo-yellow); color: #000; font-size: 0.88rem;">
        <strong>Hint:</strong> ${q.hint}
      </div>

      <div id="quiz-explanation-box" class="quiz-explanation-panel" style="display: none; margin-top: 1rem; padding: 1rem; border: 2px solid var(--neo-border-color); background: var(--neo-surface-alt); color: var(--neo-text);"></div>
    </div>
  `;
}

let selectedOptionIndex = null;

window.handleOptionSelect = function (idx) {
  selectedOptionIndex = idx;
  document.querySelectorAll('.quiz-option-btn').forEach((btn) => {
    btn.classList.toggle('selected', parseInt(btn.getAttribute('data-opt-idx'), 10) === idx);
  });
  const subBtn = document.getElementById('btn-submit-answer');
  if (subBtn) subBtn.disabled = false;
};

window.toggleQuizHint = function () {
  const box = document.getElementById('quiz-hint-box');
  if (box) box.style.display = box.style.display === 'none' ? 'block' : 'none';
};

window.submitQuizAnswer = function () {
  if (selectedOptionIndex === null) return;

  const questions = EducationalData.quizzes[state.activeQuizTier] || [];
  const q = questions[state.currentQuestionIndex];
  const isCorrect = selectedOptionIndex === q.correct;
  const points = isCorrect ? 1 : 0;

  if (isCorrect) state.quizScore += points;

  state.quizAnswers.push({
    questionIndex: state.currentQuestionIndex,
    questionText: q.question,
    topic: q.topic || 'General Security',
    options: q.options,
    selectedIndex: selectedOptionIndex,
    correctIndex: q.correct,
    isCorrect,
    points,
    explanation: q.explanation,
    distractors: q.distractors || [],
  });

  if (isCorrect) sfx.play('success');
  else sfx.play('alarm');

  // Mark options visually
  document.querySelectorAll('.quiz-option-btn').forEach((btn) => {
    btn.disabled = true;
    const idx = parseInt(btn.getAttribute('data-opt-idx'), 10);
    if (idx === q.correct) {
      btn.style.backgroundColor = 'var(--neo-surface-alt)';
      btn.style.borderColor = 'var(--neo-lime)';
      btn.style.color = 'var(--neo-text)';
      btn.innerHTML += ' <span style="float: right; font-weight: 800; color: var(--neo-lime);">✓ CORRECT</span>';
    } else if (idx === selectedOptionIndex && !isCorrect) {
      btn.style.backgroundColor = 'var(--neo-surface-alt)';
      btn.style.borderColor = 'var(--neo-red)';
      btn.style.color = 'var(--neo-text)';
      btn.innerHTML += ' <span style="float: right; font-weight: 800; color: var(--neo-red);">✗ SELECTED</span>';
    }
  });

  // Show detailed explanation
  const expBox = document.getElementById('quiz-explanation-box');
  if (expBox) {
    expBox.style.display = 'block';
    expBox.style.backgroundColor = 'var(--neo-surface-alt)';
    expBox.style.borderColor = isCorrect ? 'var(--neo-lime)' : 'var(--neo-red)';
    expBox.style.color = 'var(--neo-text)';
    expBox.innerHTML = `
      <h4 style="margin: 0 0 0.5rem 0; color: ${isCorrect ? 'var(--neo-lime)' : 'var(--neo-red)'}; font-weight: 800;">
        ${isCorrect ? '✅ Correct Answer!' : '❌ Incorrect'}
      </h4>
      <p style="font-size: 0.9rem; line-height: 1.5; margin-bottom: 0.75rem; color: var(--neo-text);">${q.explanation}</p>
      ${q.distractors && q.distractors.length > 0 ? `
        <div class="distractor-notes" style="font-size: 0.82rem; color: var(--neo-text-muted); border-top: 1px dashed var(--neo-border-color); padding-top: 0.5rem;">
          <strong style="color: var(--neo-text); display: block; margin-bottom: 0.25rem;">Why other options are incorrect:</strong>
          ${q.distractors.map((d) => `<div>• ${d}</div>`).join('')}
        </div>
      ` : ''}
    `;
  }

  // Change submit button to Next Question / View Final Results
  const subBtn = document.getElementById('btn-submit-answer');
  if (subBtn) {
    const isLast = state.currentQuestionIndex === questions.length - 1;
    subBtn.innerText = isLast ? 'View Final Results →' : 'Next Question →';
    subBtn.onclick = isLast ? showQuizResults : goToNextQuizQuestion;
    subBtn.disabled = false;
  }
};

function goToNextQuizQuestion() {
  selectedOptionIndex = null;
  state.currentQuestionIndex += 1;
  renderCurrentQuizQuestion();
}

function showQuizResults() {
  document.getElementById('quiz-active-screen').style.display = 'none';
  const resScreen = document.getElementById('quiz-results-screen');
  if (!resScreen) return;

  const scoreOutOf10 = state.quizScore;
  const pct = Math.round((scoreOutOf10 / 10) * 100);
  const tier = state.activeQuizTier;

  // Persist score per level in local storage
  if (!state.userStats.quizzesCompleted) state.userStats.quizzesCompleted = {};
  const prevBest = state.userStats.quizzesCompleted[tier] || 0;
  if (scoreOutOf10 > prevBest) {
    state.userStats.quizzesCompleted[tier] = scoreOutOf10;
  }
  if (scoreOutOf10 > (state.userStats.bestScore || 0)) {
    state.userStats.bestScore = scoreOutOf10;
  }
  saveProgress();
  renderQuizTierStats();

  // Performance Medals logic based on user specification
  let medalIcon, medalName, resultQuote, playfulComment, nextStepText, nextStepAction;

  if (scoreOutOf10 >= 9) {
    medalIcon = '🥇';
    medalName = 'Gold — Packet Slayer';
    resultQuote = '“ABSOLUTE PACKET DEMON! The flood tried. You said NO.”';
    playfulComment = 'Flawless packet defense! The server didn\'t even break a sweat.';
    if (tier === 'easy') {
      nextStepText = 'Advance to Moderate Tier →';
      nextStepAction = "startQuizTier('moderate')";
    } else if (tier === 'moderate') {
      nextStepText = 'Challenge Difficult Packet Demon Tier →';
      nextStepAction = "startQuizTier('difficult')";
    } else {
      nextStepText = 'Test Skills in Real-Life Scenarios →';
      nextStepAction = "navigateToView('applications')";
    }
  } else if (scoreOutOf10 >= 7) {
    medalIcon = '🥈';
    medalName = 'Silver — Firewall Pro';
    resultQuote = '“Security expert energy. The server survived, and so did your brain.”';
    playfulComment = 'Strong defensive instincts with just a couple of technical blind spots.';
    if (tier === 'easy') {
      nextStepText = 'Review Mistakes, then Start Moderate →';
      nextStepAction = "startQuizTier('moderate')";
    } else if (tier === 'moderate') {
      nextStepText = 'Review Mistakes, then Start Difficult →';
      nextStepAction = "startQuizTier('difficult')";
    } else {
      nextStepText = 'Review Mistakes and Cement Mastery →';
      nextStepAction = "openReviewMistakesModal()";
    }
  } else if (scoreOutOf10 >= 5) {
    medalIcon = '🥉';
    medalName = 'Bronze — Rookie Defender';
    resultQuote = '“You\'re getting there! Patch a few knowledge gaps and run it back.”';
    playfulComment = 'The server took some damage and CPU was pinned, but you held the line!';
    nextStepText = 'Review Weak Topics in Notes →';
    nextStepAction = "navigateToView('notes')";
  } else {
    medalIcon = '🔄';
    medalName = 'Reboot Medal — Comeback Loading';
    resultQuote = '“Even firewalls need updates. Revise the basics and make your comeback.”';
    playfulComment = 'No panic. Every network engineer crashed a few servers before becoming a pro!';
    nextStepText = 'Revise Notes & Fast Revision Guide →';
    nextStepAction = "navigateToView('notes')";
  }

  // Extract up to three topics to revise based on incorrect answers
  const incorrectAnswers = state.quizAnswers.filter((a) => !a.isCorrect);
  const weakTopics = Array.from(new Set(incorrectAnswers.map((a) => a.topic || a.questionText))).slice(0, 3);

  let weakTopicsHtml = '';
  if (weakTopics.length > 0) {
    weakTopicsHtml = `
      <div class="weak-topics-box" style="margin: 1.25rem 0; padding: 1rem; border: 2px solid var(--neo-border-color); background: var(--neo-surface-alt); text-align: left;">
        <h4 style="margin: 0 0 0.5rem 0; color: var(--neo-red); font-family: var(--font-display); font-size: 1rem;">
          ⚠️ Targeted Revision Topics (${weakTopics.length}):
        </h4>
        <ul style="margin: 0; padding-left: 1.25rem; font-size: 0.88rem; color: var(--neo-text);">
          ${weakTopics.map((t) => `<li style="margin-bottom: 0.25rem;"><strong>${t}</strong></li>`).join('')}
        </ul>
      </div>
    `;
  }

  resScreen.innerHTML = `
    <div class="card chaotic-results-card ${scoreOutOf10 >= 9 ? 'confetti-active' : ''}" style="max-width: 680px; margin: 0 auto; padding: 2rem; border: 3px solid var(--neo-border-color); background: var(--neo-surface); color: var(--neo-text); text-align: center; box-shadow: 6px 6px 0 var(--neo-shadow-color);">
      
      <!-- Medal Entrance Visualizer -->
      <div class="medal-award-banner" style="margin-bottom: 1rem; animation: bounceIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
        <div class="medal-icon-big" style="font-size: 4.5rem; line-height: 1; filter: drop-shadow(2px 2px 0 var(--neo-shadow-color));">${medalIcon}</div>
        <div class="medal-title-tag" style="display: inline-block; margin-top: 0.5rem; padding: 0.35rem 1rem; border: 2px solid var(--neo-border-color); background: var(--neo-yellow); color: #000; font-family: var(--font-display); font-size: 1.15rem; font-weight: 800;">
          ${medalName}
        </div>
      </div>

      <div class="chaotic-score-circle" style="margin: 1rem auto; padding: 1rem; border: 2px solid var(--neo-border-color); background: var(--neo-surface-alt); display: inline-block; min-width: 180px;">
        <div style="font-size: 2.5rem; font-weight: 900; font-family: var(--font-display); color: var(--neo-text);">${scoreOutOf10} / 10</div>
        <div style="font-size: 1rem; font-weight: 800; color: var(--neo-text-muted);">${pct}% ACCURACY</div>
      </div>

      <blockquote style="font-size: 1.1rem; font-weight: 800; color: var(--neo-text); margin: 1rem 0 0.5rem 0; font-style: italic;">
        ${resultQuote}
      </blockquote>
      <p style="font-size: 0.95rem; color: var(--neo-text-muted); margin: 0 0 1rem 0;">${playfulComment}</p>

      ${weakTopicsHtml}

      <div class="recommended-next-box" style="margin: 1.25rem 0; padding: 0.75rem; border: 2px solid var(--neo-border-color); background: var(--neo-lime); color: #000; font-size: 0.9rem; font-weight: 800;">
        💡 Recommended Next Step: ${scoreOutOf10 >= 9 ? 'You are ready for the next challenge!' : 'Targeted revision will give you the edge.'}
      </div>

      <div class="chaotic-actions" style="display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; margin-top: 1.5rem;">
        <button class="btn btn-secondary" onclick="sfx.play('click'); startQuizTier('${tier}')">↺ Try Again</button>
        <button class="btn btn-warning" onclick="sfx.play('click'); openReviewMistakesModal()">🔍 Review Mistakes</button>
        <button class="btn btn-primary" onclick="sfx.play('click'); ${nextStepAction}">Continue Learning →</button>
        <button class="btn btn-outline" onclick="sfx.play('click'); returnToQuizSelect()">Level Select</button>
      </div>

    </div>
  `;

  resScreen.style.display = 'block';

  if (scoreOutOf10 >= 9) {
    triggerConfetti();
  } else if (scoreOutOf10 >= 7) {
    triggerSilverCelebration();
  }
}

window.triggerConfetti = function() {
  const container = document.querySelector('.chaotic-results-card');
  if (!container) return;
  for (let i = 0; i < 35; i++) {
    const conf = document.createElement('div');
    conf.className = 'confetti-piece';
    conf.style.left = Math.random() * 100 + '%';
    conf.style.animationDelay = Math.random() * 1.5 + 's';
    conf.style.backgroundColor = ['#f472b6', '#38bdf8', '#34d399', '#fde047', '#a855f7'][Math.floor(Math.random() * 5)];
    container.appendChild(conf);
  }
};

window.triggerSilverCelebration = function() {
  const container = document.querySelector('.chaotic-results-card');
  if (!container) return;
  for (let i = 0; i < 15; i++) {
    const star = document.createElement('div');
    star.className = 'confetti-piece';
    star.style.left = Math.random() * 100 + '%';
    star.style.animationDelay = Math.random() * 1.5 + 's';
    star.style.backgroundColor = '#94a3b8';
    container.appendChild(star);
  }
};

window.openReviewMistakesModal = function() {
  const modal = document.getElementById('modal-review-mistakes');
  const body = document.getElementById('review-mistakes-body');
  if (!modal || !body) return;

  if (!state.quizAnswers || state.quizAnswers.length === 0) {
    body.innerHTML = '<p>No questions answered in this session yet.</p>';
  } else {
    body.innerHTML = state.quizAnswers.map((item, idx) => {
      const isCorrect = item.isCorrect;
      const userSelectedText = item.options[item.selectedIndex] || 'None';
      const correctText = item.options[item.correctIndex] || 'None';

      return `
        <div class="card" style="margin-bottom: 1rem; padding: 1rem; border: 2px solid var(--neo-border-color); background: var(--neo-surface); color: var(--neo-text);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span style="font-weight: 800; font-size: 0.85rem; color: var(--neo-text-muted);">QUESTION ${idx + 1} OF 10 • TOPIC: ${item.topic}</span>
            <span class="badge ${isCorrect ? 'badge-success' : 'badge-danger'}">${isCorrect ? '✓ CORRECT' : '✗ INCORRECT'}</span>
          </div>
          <p style="font-weight: 800; font-size: 0.95rem; margin-bottom: 0.75rem; color: var(--neo-text);">${item.questionText}</p>
          
          <div style="font-size: 0.85rem; margin-bottom: 0.5rem;">
            <div><strong>Your Answer:</strong> <span style="color: ${isCorrect ? 'var(--neo-lime)' : 'var(--neo-red)'}; font-weight: 700;">${userSelectedText}</span></div>
            ${!isCorrect ? `<div><strong>Correct Answer:</strong> <span style="color: var(--neo-lime); font-weight: 700;">${correctText}</span></div>` : ''}
          </div>

          <div style="font-size: 0.85rem; color: var(--neo-text-muted); border-top: 1px dashed var(--neo-border-color); padding-top: 0.5rem;">
            <strong style="color: var(--neo-text);">Explanation:</strong> ${item.explanation}
          </div>
        </div>
      `;
    }).join('');
  }

  modal.style.display = 'flex';
};

window.closeReviewMistakesModal = function() {
  const modal = document.getElementById('modal-review-mistakes');
  if (modal) modal.style.display = 'none';
};

window.returnToQuizSelect = function () {
  document.getElementById('quiz-results-screen').style.display = 'none';
  document.getElementById('quiz-active-screen').style.display = 'none';
  document.getElementById('quiz-level-select').style.display = 'block';
  renderQuizTierStats();
};

/* ==========================================================================
   VIEW 6: RESOURCES & CLEANUP COMPATIBILITY
   ========================================================================== */
function initResources() {
  // Legacy stubs kept for backwards compatibility
}

// Global functions for inline HTML buttons
window.navigateToView = navigateToView;

