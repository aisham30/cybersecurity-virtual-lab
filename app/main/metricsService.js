'use strict';
/**
 * Real-time metrics polling service for the ICMP Flood DoS demonstration.
 * Supports Docker Engine stats + Automatic Simulated Telemetry Mode if Docker is offline.
 */
const { EventEmitter } = require('events');
const docker = require('./dockerService');

function parsePair(s) {
  const [a, b] = String(s || '').split('/');
  const parseMB = (v) => {
    const m = String(v || '').trim().match(/^([\d.]+)\s*([a-zA-Z]*)$/);
    if (!m) return 0;
    const u = (m[2] || 'b').toLowerCase();
    const mult = { k: 1e3, m: 1e6, g: 1e9, kib: 1024, mib: 1024 ** 2, gib: 1024 ** 3 }[u] || 1;
    return (parseFloat(m[1]) * mult) / (1024 ** 2);
  };
  return [parseMB(a), parseMB(b)];
}

function parseIcmpInMsgs(snmpText) {
  if (!snmpText) return 0;
  const lines = String(snmpText).split(/\r?\n/);
  for (let i = 0; i < lines.length - 1; i++) {
    if (lines[i].startsWith('Icmp:')) {
      const headers = lines[i].trim().split(/\s+/);
      const values = lines[i + 1].trim().split(/\s+/);
      const echoIdx = headers.indexOf('InEchos');
      if (echoIdx !== -1 && values[echoIdx] != null) {
        return parseInt(values[echoIdx], 10) || 0;
      }
      const msgsIdx = headers.indexOf('InMsgs');
      if (msgsIdx !== -1 && values[msgsIdx] != null) {
        return parseInt(values[msgsIdx], 10) || 0;
      }
    }
  }
  return 0;
}

class MetricsService extends EventEmitter {
  constructor({ attackService } = {}) {
    super();
    this.attackService = attackService;
    this.active = false;
    this.isSimulated = false;
    this.timer = null;
    this.prevIcmpCount = null;
    this.prevTs = null;
  }

  start({ simulated = false } = {}) {
    this.stop();
    this.active = true;
    this.isSimulated = simulated;
    this.prevIcmpCount = null;
    this.prevTs = null;
    this._loop();
  }

  stop() {
    this.active = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  async _loop() {
    if (!this.active) return;
    const started = Date.now();

    if (this.isSimulated) {
      this._simulatedStep();
    } else {
      await this._dockerStep();
    }

    if (this.active) {
      const wait = Math.max(200, 1000 - (Date.now() - started));
      this.timer = setTimeout(() => this._loop(), wait);
    }
  }

  _simulatedStep() {
    const isFlood = this.attackService ? this.attackService.floodRunning : false;
    const isMitigated = this.attackService ? this.attackService.mitigationActive : false;
    const now = Date.now();

    let cpuPct = 1.5 + Math.random() * 2.0;
    let pps = Math.floor(Math.random() * 4);
    let memMB = 18.2 + Math.random() * 0.5;

    if (isFlood) {
      if (!isMitigated) {
        // High DoS Spike
        cpuPct = 25.5 + Math.random() * 4.2;
        pps = Math.floor(32000 + Math.random() * 15000);
        memMB = 24.5 + Math.random() * 2.0;
      } else {
        // Rate-Limited Flood
        cpuPct = 4.5 + Math.random() * 2.5;
        pps = Math.floor(1 + Math.random() * 4);
        memMB = 19.8 + Math.random() * 0.8;
      }
    }

    this.emit('data', {
      ts: now,
      cpu: cpuPct,
      memMB,
      memLimitMB: 128,
      memPct: (memMB / 128) * 100,
      pps,
      source: 'simulated',
    });
  }

  async _dockerStep() {
    try {
      const [statsRes, snmpRes] = await Promise.all([
        docker.run(['stats', '--no-stream', '--format', '{{json .}}', 'icmp-target'], { timeoutMs: 3000 }).catch(() => null),
        docker.run(['exec', 'icmp-target', 'cat', '/proc/net/snmp'], { timeoutMs: 3000 }).catch(() => null),
      ]);

      let cpuPct = 0;
      let memMB = 0;
      let memLimitMB = 128;
      let memPct = 0;

      if (statsRes && statsRes.code === 0 && statsRes.stdout) {
        try {
          const json = JSON.parse(statsRes.stdout.trim());
          cpuPct = parseFloat(String(json.CPUPerc || '0').replace('%', '')) || 0;
          memPct = parseFloat(String(json.MemPerc || '0').replace('%', '')) || 0;
          const [u, l] = parsePair(json.MemUsage);
          memMB = u;
          if (l) memLimitMB = l;
        } catch (_) {}
      }

      const now = Date.now();
      let pps = 0;
      if (snmpRes && snmpRes.code === 0 && snmpRes.stdout) {
        const icmpCount = parseIcmpInMsgs(snmpRes.stdout);
        if (this.prevIcmpCount != null && this.prevTs != null) {
          const dt = (now - this.prevTs) / 1000;
          if (dt > 0) {
            pps = Math.max(0, Math.round((icmpCount - this.prevIcmpCount) / dt));
          }
        }
        this.prevIcmpCount = icmpCount;
        this.prevTs = now;
      }

      if (this.active) {
        this.emit('data', {
          ts: now,
          cpu: cpuPct,
          memMB,
          memLimitMB,
          memPct,
          pps,
          source: 'docker',
        });
      }
    } catch (_) {
      // Fall back to simulation if docker query fails
      this._simulatedStep();
    }
  }
}

module.exports = { MetricsService, parseIcmpInMsgs };
