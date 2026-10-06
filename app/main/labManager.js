'use strict';
/**
 * Lab Manager — orchestrates the ICMP Flood DoS demonstration lab lifecycle.
 * Supports Docker Engine execution + Seamless Simulation Fallback if Docker is offline.
 */
const { EventEmitter } = require('events');
const docker = require('./dockerService');
const { LabError, classifyDockerError, toErrorPayload } = require('./errors');

class LabManager extends EventEmitter {
  constructor({ composeDir, logs, metrics, attack, terminals }) {
    super();
    this.composeDir = composeDir;
    this.logs = logs;
    this.metrics = metrics;
    this.attack = attack;
    this.terminals = terminals;

    this.status = 'Stopped';
    this.error = null;
    this.busy = false;
    this.isSimulated = false;
  }

  getStatus() {
    return {
      key: 'icmp-flood',
      status: this.status,
      busy: this.busy,
      error: this.error,
      isSimulated: this.isSimulated,
      mitigationActive: this.attack.mitigationActive,
      floodRunning: this.attack.floodRunning,
    };
  }

  _setStatus(status, patch = {}) {
    const prev = this.status;
    this.status = status;
    if (patch.error !== undefined) this.error = patch.error;
    if (prev !== status) {
      const lvl = status === 'Error' ? 'error' : status === 'Running' ? 'success' : 'info';
      this.logs.add('icmp-flood', lvl, 'lab', `Status: ${prev} → ${status}`);
    }
    this.emit('status', this.getStatus());
  }

  async start() {
    if (this.busy) throw new LabError('BUSY', 'Operation in progress. Please wait.');
    if (this.status === 'Running') return this.getStatus();

    this.busy = true;
    this._setStatus('Starting', { error: null });
    this.logs.add('icmp-flood', 'info', 'lab', 'Lab Start requested.');

    try {
      // 1. Check Docker installed & running
      const d = await docker.checkDocker();
      if (!d.ok) {
        this.isSimulated = true;
        this.logs.add('icmp-flood', 'warn', 'docker', `⚠️ Docker Engine unavailable (${d.error.message}). Activating Interactive Simulation Mode.`);
        this._setStatus('Running', { error: null });
        this.metrics.start({ simulated: true });
        return this.getStatus();
      }

      this.isSimulated = false;

      // 2. Clean up any leftover containers/networks from previous run
      await this._teardownQuiet();

      // 3. docker compose up -d --build
      this.logs.add('icmp-flood', 'info', 'docker', 'Building and launching ICMP Flood lab containers…');
      const r = await docker.run(['compose', '-f', 'docker-compose.yml', 'up', '-d', '--build'], {
        timeoutMs: 180000,
        Cwd: this.composeDir,
      });

      if (r.code !== 0) {
        throw classifyDockerError(r.stderr || r.stdout, 'START_FAILED', 'Failed to start lab containers.');
      }

      this._setStatus('Running', { error: null });
      this.logs.add('icmp-flood', 'success', 'lab', 'Lab is RUNNING. Target container (icmp-target) and Attacker container (icmp-attacker) active.');

      // 4. Start real-time metrics telemetry
      this.metrics.start({ simulated: false });

      return this.getStatus();
    } catch (e) {
      // Fallback to simulation mode if Docker startup fails
      this.isSimulated = true;
      this.logs.add('icmp-flood', 'warn', 'lab', `Docker container startup issue (${e.message}). Activating Interactive Simulation Fallback.`);
      this._setStatus('Running', { error: null });
      this.metrics.start({ simulated: true });
      return this.getStatus();
    } finally {
      this.busy = false;
      this.emit('status', this.getStatus());
    }
  }

  async stop() {
    if (this.busy) throw new LabError('BUSY', 'Operation in progress. Please wait.');

    this.busy = true;
    this._setStatus('Stopping');
    this.logs.add('icmp-flood', 'info', 'lab', 'Lab Stop requested.');

    try {
      this.attack.stopAll();
      this.metrics.stop();
      this.terminals.closeAll();

      if (!this.isSimulated) {
        await this._teardownQuiet();
      }

      this.isSimulated = false;
      this._setStatus('Stopped', { error: null });
      this.logs.add('icmp-flood', 'info', 'lab', 'Lab STOPPED. All containers and networks removed cleanly.');
      return this.getStatus();
    } catch (e) {
      this._setStatus('Error', { error: toErrorPayload(e) });
      throw e;
    } finally {
      this.busy = false;
      this.emit('status', this.getStatus());
    }
  }

  async reset() {
    this.logs.add('icmp-flood', 'info', 'lab', 'Reset requested: Stop + Start from clean state.');
    await this.stop();
    return this.start();
  }

  async _teardownQuiet() {
    try {
      await docker.run(['compose', '-f', 'docker-compose.yml', 'down', '-v', '--remove-orphans', '--timeout', '5'], {
        timeoutMs: 60000,
        Cwd: this.composeDir,
      });
    } catch (_) {}
    try {
      await docker.removeLabResources('icmp-flood');
    } catch (_) {}
  }

  async openTerminal() {
    if (this.status !== 'Running') {
      throw new LabError('TERMINAL_UNAVAILABLE', 'Start the lab first to attach the attacker terminal.');
    }
    if (this.isSimulated) {
      return { container: 'icmp-attacker (simulated)', service: 'attacker' };
    }
    const info = await this.terminals.open('icmp-flood', {
      project: 'cybersecurity-virtual-lab',
      service: 'attacker',
      containerName: 'icmp-attacker',
    });
    this.logs.add('icmp-flood', 'info', 'terminal', `Terminal attached to container "${info.container}" (icmp-attacker).`);
    return info;
  }

  async cleanupOrphans() {
    const d = await docker.checkDocker();
    if (!d.ok) {
      return { ok: false, docker: d };
    }
    const r = await docker.cleanupManaged();
    return { ok: true, removed: r };
  }

  async shutdown() {
    this.attack.stopAll();
    this.metrics.stop();
    this.terminals.closeAll();
    if (!this.isSimulated) {
      await this._teardownQuiet();
    }
  }
}

module.exports = { LabManager };
