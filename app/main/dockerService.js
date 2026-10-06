'use strict';
/**
 * Thin, safe wrapper around the Docker CLI.
 *
 * SAFETY: every call uses child_process.spawn with an ARGUMENT ARRAY and shell:false.
 * Nothing is ever concatenated into a shell string.
 */
const { spawn } = require('child_process');
const { LabError, classifyDockerError, toErrorPayload } = require('./errors');

const DOCKER = process.env.VLAB_DOCKER_BIN || 'docker';
const LABEL_MANAGED = 'com.vlab.managed';
const LABEL_LAB = 'com.vlab.lab';
const MAX_CAPTURE = 2 * 1024 * 1024; // keep at most 2 MB of output per command

function childEnv() {
  return { ...process.env, DOCKER_CLI_HINTS: 'false', COMPOSE_MENU: 'false', BUILDKIT_PROGRESS: 'plain' };
}

function mapSpawnError(err) {
  if (err && err.code === 'ENOENT') {
    return new LabError('DOCKER_NOT_INSTALLED', 'Docker is not installed (the "docker" command was not found).');
  }
  return new LabError('START_FAILED', `Could not run docker: ${err && err.message}`);
}

function assertArgs(args) {
  if (!Array.isArray(args) || args.some((a) => typeof a !== 'string')) {
    throw new TypeError('docker args must be an array of strings');
  }
}

function killTree(child) {
  if (!child || child.exitCode !== null) return;
  try {
    child.kill('SIGTERM');
  } catch (_) {
    /* ignore */
  }
  setTimeout(() => {
    try {
      if (child.exitCode === null) child.kill('SIGKILL');
    } catch (_) {
      /* ignore */
    }
  }, 3000).unref();
}

/**
 * Splits a stream of chunks into complete lines.
 */
function lineSplitter(onLine) {
  let buf = '';
  return (chunk) => {
    buf += chunk.toString();
    const parts = buf.split(/\r?\n/);
    buf = parts.pop();
    if (buf.length > 64 * 1024) {
      parts.push(buf);
      buf = '';
    }
    for (const p of parts) if (p.length) onLine(p);
  };
}

/**
 * Run a docker command and resolve with { code, stdout, stderr }.
 * Rejects only for: docker missing, timeout, abort.
 */
function run(args, opts = {}) {
  assertArgs(args);
  const { timeoutMs = 60000, signal, onStdout, onStderr, input } = opts;
  return new Promise((resolve, reject) => {
    if (signal && signal.aborted) return reject(new LabError('ABORTED', 'Operation cancelled.'));
    let child;
    try {
      child = spawn(DOCKER, args, { shell: false, windowsHide: true, env: childEnv() });
    } catch (e) {
      return reject(mapSpawnError(e));
    }
    let stdout = '';
    let stderr = '';
    let done = false;
    let timer = null;

    const onAbort = () => {
      killTree(child);
      finish(() => reject(new LabError('ABORTED', 'Operation cancelled.')));
    };
    const finish = (fn) => {
      if (done) return;
      done = true;
      if (timer) clearTimeout(timer);
      if (signal) signal.removeEventListener('abort', onAbort);
      fn();
    };

    if (timeoutMs > 0) {
      timer = setTimeout(() => {
        killTree(child);
        finish(() =>
          reject(
            new LabError('TIMEOUT', `Docker command timed out after ${Math.round(timeoutMs / 1000)}s (docker ${args.slice(0, 4).join(' ')} …).`, {
              details: stderr,
            })
          )
        );
      }, timeoutMs);
    }
    if (signal) signal.addEventListener('abort', onAbort, { once: true });

    child.stdout.on('data', (d) => {
      const s = d.toString();
      stdout += s;
      if (stdout.length > MAX_CAPTURE) stdout = stdout.slice(-MAX_CAPTURE);
      if (onStdout) onStdout(s);
    });
    child.stderr.on('data', (d) => {
      const s = d.toString();
      stderr += s;
      if (stderr.length > MAX_CAPTURE) stderr = stderr.slice(-MAX_CAPTURE);
      if (onStderr) onStderr(s);
    });
    child.on('error', (e) => finish(() => reject(mapSpawnError(e))));
    child.on('close', (code) => finish(() => resolve({ code: code == null ? -1 : code, stdout, stderr })));
    try {
      if (input != null) child.stdin.end(input);
      else child.stdin.end();
    } catch (_) {
      /* ignore */
    }
  });
}

/** Like run() but throws a classified LabError on a non-zero exit code. */
async function runOk(args, opts = {}, fallbackCode = 'START_FAILED', fallbackMessage = 'Docker command failed.') {
  const r = await run(args, opts);
  if (r.code !== 0) throw classifyDockerError(r.stderr || r.stdout, fallbackCode, fallbackMessage);
  return r;
}

/** Spawn a long-running docker process (logs -f, exec -i). Caller owns the child. */
function spawnStream(args) {
  assertArgs(args);
  const child = spawn(DOCKER, args, { shell: false, windowsHide: true, env: childEnv() });
  return child;
}

/* ------------------------------------------------------------------ */
/* Health / environment                                                */
/* ------------------------------------------------------------------ */

async function checkDocker() {
  try {
    const v = await run(['version', '--format', '{{.Server.Version}}'], { timeoutMs: 20000 });
    const serverVersion = v.stdout.trim();
    if (v.code !== 0 || !serverVersion) {
      throw classifyDockerError(v.stderr || v.stdout, 'DOCKER_NOT_RUNNING', 'Docker Desktop is not running.');
    }
    const c = await run(['compose', 'version', '--short'], { timeoutMs: 15000 });
    if (c.code !== 0) {
      throw new LabError('COMPOSE_MISSING', 'Docker Compose v2 is not available.', { details: c.stderr });
    }
    return { ok: true, serverVersion, composeVersion: c.stdout.trim() };
  } catch (e) {
    return { ok: false, error: toErrorPayload(e) };
  }
}

/* ------------------------------------------------------------------ */
/* Networks                                                            */
/* ------------------------------------------------------------------ */

/**
 * Create the per-lab isolated bridge network.
 *  - "isolated": bridge with IP masquerading disabled -> containers cannot reach the
 *    Internet / LAN, but ports bound to 127.0.0.1 still work for the student.
 *  - "internal": fully internal network (no published ports at all).
 */
async function createNetwork(name, labId, { internal = false } = {}, signal) {
  const args = ['network', 'create', '--driver', 'bridge', '--label', `${LABEL_MANAGED}=true`, '--label', `${LABEL_LAB}=${labId}`];
  if (internal) args.push('--internal');
  else if (process.env.VLAB_NETWORK_MASQUERADE !== '1') {
    args.push('--opt', 'com.docker.network.bridge.enable_ip_masquerade=false');
  }
  args.push(name);
  return runOk(args, { timeoutMs: 30000, signal }, 'START_FAILED', `Could not create isolated network "${name}".`);
}

/* ------------------------------------------------------------------ */
/* Containers                                                          */
/* ------------------------------------------------------------------ */

function splitLines(s) {
  return String(s || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

async function listProjectContainers(project) {
  const r = await run(
    [
      'ps',
      '-a',
      '--filter',
      `label=com.docker.compose.project=${project}`,
      '--format',
      '{{.ID}}\t{{.Names}}\t{{.State}}\t{{.Status}}\t{{.Label "com.docker.compose.service"}}',
    ],
    { timeoutMs: 15000 }
  );
  if (r.code !== 0) throw classifyDockerError(r.stderr, 'START_FAILED', 'Could not list lab containers.');
  return splitLines(r.stdout).map((l) => {
    const [id, name, state, status, service] = l.split('\t');
    return { id, name, state: (state || '').toLowerCase(), status, service };
  });
}

async function getServiceContainerId(project, service) {
  const r = await run(
    [
      'ps',
      '-q',
      '--filter',
      `label=com.docker.compose.project=${project}`,
      '--filter',
      `label=com.docker.compose.service=${service}`,
      '--filter',
      'status=running',
    ],
    { timeoutMs: 15000 }
  );
  if (r.code !== 0) throw classifyDockerError(r.stderr, 'TERMINAL_UNAVAILABLE', 'Could not find the terminal container.');
  return splitLines(r.stdout)[0] || null;
}

async function stats(ids) {
  if (!ids.length) return [];
  const r = await run(['stats', '--no-stream', '--format', '{{json .}}', ...ids], { timeoutMs: 15000 });
  if (r.code !== 0) throw classifyDockerError(r.stderr, 'START_FAILED', 'docker stats failed.');
  const out = [];
  for (const l of splitLines(r.stdout)) {
    try {
      out.push(JSON.parse(l));
    } catch (_) {
      /* ignore partial lines */
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Cleanup (label based)                                               */
/* ------------------------------------------------------------------ */

async function listByLabel(label) {
  const [c, n, v] = await Promise.all([
    run(['ps', '-aq', '--filter', `label=${label}`], { timeoutMs: 20000 }),
    run(['network', 'ls', '-q', '--filter', `label=${label}`], { timeoutMs: 20000 }),
    run(['volume', 'ls', '-q', '--filter', `label=${label}`], { timeoutMs: 20000 }),
  ]);
  for (const r of [c, n, v]) {
    if (r.code !== 0) throw classifyDockerError(r.stderr, 'START_FAILED', 'Could not list lab resources.');
  }
  return { containers: splitLines(c.stdout), networks: splitLines(n.stdout), volumes: splitLines(v.stdout) };
}

async function removeByLabel(label) {
  const found = await listByLabel(label);
  if (found.containers.length) await run(['rm', '-f', '-v', ...found.containers], { timeoutMs: 60000 });
  if (found.networks.length) await run(['network', 'rm', ...found.networks], { timeoutMs: 30000 });
  if (found.volumes.length) await run(['volume', 'rm', '-f', ...found.volumes], { timeoutMs: 30000 });
  return { containers: found.containers.length, networks: found.networks.length, volumes: found.volumes.length };
}

const listManaged = (labId) => listByLabel(labId ? `${LABEL_LAB}=${labId}` : `${LABEL_MANAGED}=true`);
const removeLabResources = (labId) => removeByLabel(`${LABEL_LAB}=${labId}`);
const cleanupManaged = () => removeByLabel(`${LABEL_MANAGED}=true`);

module.exports = {
  DOCKER,
  LABEL_MANAGED,
  LABEL_LAB,
  run,
  runOk,
  spawnStream,
  lineSplitter,
  killTree,
  checkDocker,
  createNetwork,
  listProjectContainers,
  getServiceContainerId,
  stats,
  listManaged,
  removeLabResources,
  cleanupManaged,
};
