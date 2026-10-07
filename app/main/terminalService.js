'use strict';
/**
 * Embedded terminal sessions attached ONLY to the container named in terminalService.
 * SAFETY: ALWAYS `docker exec -i <container> sh` — never a host shell.
 */
const { EventEmitter } = require('events');
const docker = require('./dockerService');
const { LabError } = require('./errors');

class TerminalService extends EventEmitter {
  constructor() {
    super();
    this.sessions = new Map();
  }

  async open(key, { containerName = 'icmp-attacker' }) {
    this.close(key);
    const child = docker.spawnStream([
      'exec',
      '-i',
      '-e',
      'PS1=attacker@icmp-flood $ ',
      '-e',
      'TERM=dumb',
      containerName,
      'sh',
      '-c',
      'echo __VLAB_TERM__; exec sh -i',
    ]);

    const s = { key, child, closed: false };
    this.sessions.set(key, s);

    const onOut = (d) => {
      let text = d.toString();
      text = text.replace('__VLAB_TERM__\r\n', '').replace('__VLAB_TERM__\n', '');
      text = text.replace(/^.*can't access tty; job control turned off\r?\n?/gm, '');
      if (!text) return;
      this.emit('data', { key, data: text });
    };

    child.stdout.on('data', onOut);
    child.stderr.on('data', onOut);
    child.on('error', (e) => this.emit('data', { key, data: `\r\n[terminal error] ${e.message}\r\n` }));
    child.on('close', (code) => {
      s.closed = true;
      if (this.sessions.get(key) === s) this.sessions.delete(key);
      this.emit('exit', { key, code });
    });

    return { container: containerName, service: 'attacker' };
  }

  write(key, data) {
    const s = this.sessions.get(key);
    if (!s || s.closed || typeof data !== 'string') return false;
    try {
      s.child.stdin.write(data);
      return true;
    } catch (_) {
      return false;
    }
  }

  interrupt(key) {
    const s = this.sessions.get(key);
    if (!s || s.closed) return false;
    try {
      s.child.stdin.write('\x03'); // Ctrl+C
      return true;
    } catch (_) {
      return false;
    }
  }

  close(key) {
    const s = this.sessions.get(key);
    if (!s) return;
    this.sessions.delete(key);
    try {
      s.child.stdin.end('exit\n');
    } catch (_) {}
    docker.killTree(s.child);
  }

  closeAll() {
    for (const k of [...this.sessions.keys()]) this.close(k);
  }
}

module.exports = { TerminalService };
