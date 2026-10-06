'use strict';
/**
 * In-memory, per-lab activity log (ring buffer). Emits 'event' for every entry.
 */
const { EventEmitter } = require('events');

class LogService extends EventEmitter {
  constructor(max = 3000) {
    super();
    this.max = max;
    this.buffers = new Map();
  }

  add(key, level, source, message) {
    const entry = {
      ts: new Date().toISOString(),
      key: key || 'app',
      level: ['debug', 'info', 'warn', 'error', 'success'].includes(level) ? level : 'info',
      source: String(source || 'app'),
      message: String(message == null ? '' : message).slice(0, 8000),
    };
    let buf = this.buffers.get(entry.key);
    if (!buf) {
      buf = [];
      this.buffers.set(entry.key, buf);
    }
    buf.push(entry);
    if (buf.length > this.max) buf.splice(0, buf.length - this.max);
    this.emit('event', entry);
    return entry;
  }

  get(key) {
    return (this.buffers.get(key) || []).slice();
  }

  toText(key, { title, containerLogs } = {}) {
    const lines = [];
    lines.push(`# ${title || 'VLab activity log'} — exported ${new Date().toISOString()}`);
    lines.push('');
    for (const e of this.get(key)) {
      lines.push(`[${e.ts}] [${e.level.toUpperCase().padEnd(7)}] [${e.source}] ${e.message}`);
    }
    if (containerLogs) {
      lines.push('', '# ---- Last captured container logs ----', containerLogs);
    }
    return lines.join('\n') + '\n';
  }
}

module.exports = { LogService };
