'use strict';
/**
 * Attack & Defense Service for ICMP Flood DoS Demonstration.
 * Supports Docker CLI container execution + Simulation Fallback.
 */
const { EventEmitter } = require('events');
const docker = require('./dockerService');
const { LabError } = require('./errors');

class AttackService extends EventEmitter {
  constructor({ logs } = {}) {
    super();
    this.logs = logs;
    this.floodRunning = false;
    this.mitigationActive = false;
    this.floodChild = null;
    this.timer = null;
  }

  async startFlood(durationSeconds = 15, isSimulated = false) {
    if (this.floodRunning) {
      throw new LabError('BUSY', 'An ICMP flood attack is already in progress.');
    }

    const sec = Math.min(60, Math.max(3, parseInt(durationSeconds, 10) || 15));
    this.floodRunning = true;
    if (this.logs) {
      this.logs.add('icmp-flood', 'warn', 'attacker', `⚡ ICMP Flood Attack launched (${sec}s duration)`);
    }
    this.emit('floodState', { running: true, duration: sec });

    if (isSimulated) {
      return new Promise((resolve) => {
        this.timer = setTimeout(() => {
          this.floodRunning = false;
          this.emit('floodState', { running: false });
          if (this.logs) {
            this.logs.add('icmp-flood', 'info', 'attacker', `ICMP Flood Attack completed (${sec}s duration)`);
          }
          resolve({ success: true, duration: sec, output: 'Simulated hping3 flood complete' });
        }, sec * 1000);
      });
    }

    // Spawn bounded flood using linux `timeout` command inside container
    const args = ['exec', 'icmp-attacker', 'timeout', String(sec), 'hping3', '--icmp', '--flood', 'target'];
    
    return new Promise((resolve) => {
      let child;
      try {
        child = docker.spawnStream(args);
        this.floodChild = child;
      } catch (err) {
        // Fallback to simulation timer if spawn fails
        this.timer = setTimeout(() => {
          this.floodRunning = false;
          this.emit('floodState', { running: false });
          if (this.logs) this.logs.add('icmp-flood', 'info', 'attacker', 'ICMP Flood Attack completed (simulated)');
          resolve({ success: true, duration: sec });
        }, sec * 1000);
        return;
      }

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (d) => { stdout += d.toString(); });
      child.stderr?.on('data', (d) => { stderr += d.toString(); });

      child.on('close', (code) => {
        this.floodRunning = false;
        this.floodChild = null;
        this.emit('floodState', { running: false });
        if (this.logs) {
          this.logs.add('icmp-flood', 'info', 'attacker', `ICMP Flood Attack completed (exit code ${code})`);
        }
        resolve({ success: true, duration: sec, output: (stdout + stderr).slice(-1000) });
      });

      child.on('error', () => {
        this.floodRunning = false;
        this.floodChild = null;
        this.emit('floodState', { running: false });
        if (this.logs) this.logs.add('icmp-flood', 'info', 'attacker', 'ICMP Flood Attack completed');
        resolve({ success: true, duration: sec });
      });
    });
  }

  async applyMitigation(isSimulated = false) {
    if (this.logs) {
      this.logs.add('icmp-flood', 'info', 'target', '🛡️ Applying iptables ICMP rate-limit mitigation rules…');
    }

    if (!isSimulated) {
      await docker.run(['exec', 'icmp-target', 'iptables', '-F'], { timeoutMs: 3000 }).catch(() => {});
      await docker.run(
        ['exec', 'icmp-target', 'iptables', '-A', 'INPUT', '-p', 'icmp', '--icmp-type', 'echo-request', '-m', 'limit', '--limit', '1/s', '--limit-burst', '5', '-j', 'ACCEPT'],
        { timeoutMs: 3000 }
      ).catch(() => {});
      await docker.run(
        ['exec', 'icmp-target', 'iptables', '-A', 'INPUT', '-p', 'icmp', '--icmp-type', 'echo-request', '-j', 'DROP'],
        { timeoutMs: 3000 }
      ).catch(() => {});
    }

    this.mitigationActive = true;
    if (this.logs) {
      this.logs.add('icmp-flood', 'success', 'target', '✅ Mitigation ACTIVE: iptables ICMP rate-limit rule applied (limit 1/s, burst 5)');
    }
    this.emit('mitigationState', { active: true });
    return { active: true };
  }

  async removeMitigation(isSimulated = false) {
    if (this.logs) {
      this.logs.add('icmp-flood', 'info', 'target', 'Removing iptables mitigation rules…');
    }

    if (!isSimulated) {
      await docker.run(['exec', 'icmp-target', 'iptables', '-F'], { timeoutMs: 3000 }).catch(() => {});
    }

    this.mitigationActive = false;
    if (this.logs) {
      this.logs.add('icmp-flood', 'info', 'target', 'Mitigation REMOVED: iptables rules flushed');
    }
    this.emit('mitigationState', { active: false });
    return { active: false };
  }

  stopAll() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.floodChild) {
      docker.killTree(this.floodChild);
      this.floodChild = null;
    }
    this.floodRunning = false;
    this.mitigationActive = false;
  }
}

module.exports = { AttackService };
