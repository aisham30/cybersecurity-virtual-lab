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

    const s = { key, child, closed: false, isSimulated: false };
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

  openSimulated(key, { containerName = 'icmp-attacker (simulated)' } = {}) {
    this.close(key);
    let currentInput = '';
    const s = {
      key,
      isSimulated: true,
      closed: false,
      writeSimulated: (data) => {
        for (const char of data) {
          if (char === '\r' || char === '\n') {
            this.emit('data', { key, data: '\r\n' });
            const cmd = currentInput.trim();
            currentInput = '';
            this.handleSimulatedCmd(key, cmd);
          } else if (char === '\x7f' || char === '\b') {
            if (currentInput.length > 0) {
              currentInput = currentInput.slice(0, -1);
              this.emit('data', { key, data: '\b \b' });
            }
          } else if (char === '\x03') {
            currentInput = '';
            this.emit('data', { key, data: '^C\r\nattacker@icmp-flood $ ' });
          } else {
            currentInput += char;
            this.emit('data', { key, data: char });
          }
        }
      }
    };
    this.sessions.set(key, s);
    setTimeout(() => {
      this.emit('data', { key, data: 'attacker@icmp-flood $ ' });
    }, 50);
    return { container: containerName, service: 'attacker' };
  }

  handleSimulatedCmd(key, cmd) {
    if (!cmd) {
      this.emit('data', { key, data: 'attacker@icmp-flood $ ' });
      return;
    }
    let output = '';
    if (cmd.startsWith('ping')) {
      output = 'PING target (172.28.0.2): 56 data bytes\r\n' +
               '64 bytes from 172.28.0.2: icmp_seq=0 ttl=64 time=0.412 ms\r\n' +
               '64 bytes from 172.28.0.2: icmp_seq=1 ttl=64 time=0.385 ms\r\n' +
               '--- target ping statistics ---\r\n2 packets transmitted, 2 packets received, 0.0% packet loss\r\n';
    } else if (cmd.startsWith('curl')) {
      output = 'HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\n{"status":"ok","server":"icmp-target","load":"normal"}\r\n';
    } else if (cmd.startsWith('hping3')) {
      output = 'HPING target (eth0 172.28.0.2): icmp mode set, 28 headers + 0 data bytes\r\n' +
               'len=46 ip=172.28.0.2 ttl=64 id=1234 flags=none rtt=0.5 ms\r\n';
    } else if (cmd === 'clear') {
      this.emit('data', { key, data: '\x1bc' });
      this.emit('data', { key, data: 'attacker@icmp-flood $ ' });
      return;
    } else {
      output = `sh: ${cmd}: command executed successfully\r\n`;
    }
    this.emit('data', { key, data: output + 'attacker@icmp-flood $ ' });
  }

  write(key, data) {
    const s = this.sessions.get(key);
    if (!s || s.closed || typeof data !== 'string') return false;
    if (s.isSimulated) {
      s.writeSimulated(data);
      return true;
    }
    try {
      // Translate carriage returns (\r) to linefeeds (\n) so non-TTY sh receives EOL signal
      const payload = data.replace(/\r\n?/g, '\n');
      s.child.stdin.write(payload);

      // Echo input locally for non-TTY docker exec mode
      for (let i = 0; i < data.length; i++) {
        const char = data[i];
        if (char === '\r' || char === '\n') {
          this.emit('data', { key, data: '\r\n' });
        } else if (char === '\x7f' || char === '\b') {
          this.emit('data', { key, data: '\b \b' });
        } else if (char === '\x03') {
          this.emit('data', { key, data: '^C\r\n' });
        } else if (char >= ' ' || char === '\t') {
          this.emit('data', { key, data: char });
        }
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  interrupt(key) {
    const s = this.sessions.get(key);
    if (!s || s.closed) return false;
    if (s.isSimulated) {
      s.writeSimulated('\x03');
      return true;
    }
    try {
      s.child.stdin.write('\x03');
      return true;
    } catch (_) {
      return false;
    }
  }

  close(key) {
    const s = this.sessions.get(key);
    if (!s) return;
    this.sessions.delete(key);
    if (!s.isSimulated && s.child) {
      try {
        s.child.stdin.end('exit\n');
      } catch (_) {}
      docker.killTree(s.child);
    }
  }

  closeAll() {
    for (const k of [...this.sessions.keys()]) this.close(k);
  }
}

module.exports = { TerminalService };
