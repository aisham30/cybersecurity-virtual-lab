'use strict';
/**
 * Discovers experiments (experiments/<folder>/lab.yaml), validates manifests and
 * statically analyses docker-compose.yml for forbidden / unsafe settings.
 *
 * Pure Node (no Electron) so it can be unit-tested with `npm test`.
 */
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const MODES = ['SIMULATION', 'CONTAINER', 'NETWORK_LAB'];
const NETWORKS = ['isolated', 'internal'];
const METRIC_TYPES = ['docker', 'simulated'];
const CONTENT_KEYS = ['readme', 'guidance', 'theory', 'quiz', 'references'];
const CONTENT_DEFAULTS = {
  readme: 'README.md',
  guidance: 'Guidance.md',
  theory: 'content/theory.md',
  quiz: 'assets/quiz.json',
};
const ALLOWED_HOST_IPS = ['127.0.0.1', '::1'];
const FORBIDDEN_CAPS = new Set([
  'ALL',
  'SYS_ADMIN',
  'SYS_MODULE',
  'SYS_RAWIO',
  'SYS_PTRACE',
  'SYS_BOOT',
  'SYS_TIME',
  'DAC_READ_SEARCH',
  'MAC_ADMIN',
  'MAC_OVERRIDE',
  'BPF',
  'PERFMON',
  'SYSLOG',
]);
const MAX_FILE_BYTES = 1024 * 1024;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function isInside(base, target) {
  const rel = path.relative(path.resolve(base), path.resolve(base, target));
  if (rel === '') return true;
  if (path.isAbsolute(rel)) return false;
  return rel.split(/[\\/]/)[0] !== '..';
}

function parseMemory(v) {
  const m = String(v || '')
    .trim()
    .match(/^(\d+(?:\.\d+)?)\s*([kmg])b?$/i);
  if (!m) return null;
  const mult = { k: 1024, m: 1024 ** 2, g: 1024 ** 3 }[m[2].toLowerCase()];
  return Math.round(parseFloat(m[1]) * mult);
}

function isPlainObject(o) {
  return o !== null && typeof o === 'object' && !Array.isArray(o);
}

function asArray(v) {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

/* ------------------------------------------------------------------ */
/* Compose analysis                                                    */
/* ------------------------------------------------------------------ */

function parsePort(p) {
  if (typeof p === 'number') return { hostIp: '', published: '', target: String(p) };
  if (isPlainObject(p)) {
    return {
      hostIp: p.host_ip ? String(p.host_ip) : '',
      published: p.published != null && p.published !== '' ? String(p.published) : '',
      target: String(p.target),
    };
  }
  let s = String(p).split('/')[0].trim();
  let hostIp = '';
  const v6 = s.match(/^\[([^\]]+)\]:(.*)$/);
  if (v6) {
    hostIp = v6[1];
    s = v6[2];
    const parts = s.split(':');
    return parts.length >= 2 ? { hostIp, published: parts[0], target: parts[1] } : { hostIp, published: '', target: parts[0] };
  }
  const parts = s.split(':');
  if (parts.length >= 3) return { hostIp: parts[0], published: parts[1], target: parts[2] };
  if (parts.length === 2) return { hostIp: '', published: parts[0], target: parts[1] };
  return { hostIp: '', published: '', target: parts[0] };
}

function expandPorts(published) {
  const m = String(published).match(/^(\d+)(?:-(\d+))?$/);
  if (!m) return [];
  const a = parseInt(m[1], 10);
  const b = m[2] ? parseInt(m[2], 10) : a;
  const out = [];
  for (let i = a; i <= b && out.length < 50; i++) out.push(i);
  return out;
}

function parseVolume(v) {
  if (isPlainObject(v)) {
    return { type: v.type || 'volume', source: v.source != null ? String(v.source) : '', target: String(v.target || '') };
  }
  const s = String(v);
  let src;
  let rest;
  const drive = s.match(/^([A-Za-z]:[\\/][^:]*)(?::(.*))?$/);
  if (drive) {
    src = drive[1];
    rest = drive[2] || '';
  } else {
    const i = s.indexOf(':');
    if (i === -1) return { type: 'volume', source: '', target: s };
    src = s.slice(0, i);
    rest = s.slice(i + 1);
  }
  const target = rest.split(':')[0];
  const isPath = /^(\.|\/|~|\$|[A-Za-z]:[\\/]|\\\\)/.test(src) || /[\\/]/.test(src);
  return { type: isPath ? 'bind' : 'volume', source: src, target };
}

function checkHostPath(errors, where, src, dir) {
  const s = String(src || '');
  if (!s) return;
  if (/docker\.sock|docker_engine/i.test(s)) {
    errors.push(`${where}: mounting the Docker socket ("${s}") is forbidden.`);
    return;
  }
  if (s.startsWith('~')) {
    errors.push(`${where}: host mount "${s}" points into the user's home directory (outside the experiment folder).`);
    return;
  }
  if (s.includes('$')) {
    errors.push(`${where}: host mount "${s}" uses variables; use a plain relative path like ./data.`);
    return;
  }
  if (!dir || !isInside(dir, s)) {
    errors.push(`${where}: host mount "${s}" is outside the experiment folder. Only paths like ./something are allowed.`);
  }
}

/**
 * Analyse a compose document (raw YAML or `docker compose config` output).
 * Returns { errors, warnings, services, hostPorts }.
 */
function analyzeCompose(doc, dir) {
  const errors = [];
  const warnings = [];
  const hostPorts = [];
  if (!isPlainObject(doc) || !isPlainObject(doc.services) || !Object.keys(doc.services).length) {
    errors.push('docker-compose.yml has no "services" section.');
    return { errors, warnings, services: [], hostPorts };
  }
  const services = Object.keys(doc.services);

  for (const [name, svc] of Object.entries(doc.services)) {
    if (!isPlainObject(svc)) continue;
    const where = `service "${name}"`;

    if (svc.privileged === true || String(svc.privileged).toLowerCase() === 'true') {
      errors.push(`${where}: "privileged: true" is not allowed.`);
    }
    if (svc.network_mode != null) {
      const nm = String(svc.network_mode);
      if (nm === 'host') errors.push(`${where}: "network_mode: host" is not allowed (labs must stay on the isolated lab network).`);
      else if (nm.startsWith('container:')) errors.push(`${where}: "network_mode: ${nm}" is not allowed.`);
      else if (nm !== 'none' && !nm.startsWith('service:') && nm !== 'bridge') {
        errors.push(`${where}: "network_mode: ${nm}" is not allowed.`);
      }
    }
    for (const k of ['pid', 'ipc', 'uts', 'userns_mode', 'cgroup']) {
      if (svc[k] != null && String(svc[k]) === 'host') errors.push(`${where}: "${k}: host" is not allowed.`);
    }
    for (const cap of asArray(svc.cap_add)) {
      const c = String(cap).toUpperCase().replace(/^CAP_/, '');
      if (FORBIDDEN_CAPS.has(c)) errors.push(`${where}: capability "${cap}" is not allowed (NET_ADMIN / NET_RAW are OK).`);
    }
    if (asArray(svc.devices).length) errors.push(`${where}: "devices" (host device access) is not allowed.`);
    for (const so of asArray(svc.security_opt)) {
      if (/unconfined/i.test(String(so))) errors.push(`${where}: security_opt "${so}" is not allowed.`);
    }
    if (svc.volumes_from != null) errors.push(`${where}: "volumes_from" is not allowed.`);

    for (const v of asArray(svc.volumes)) {
      const vol = parseVolume(v);
      if (vol.type === 'bind') checkHostPath(errors, where, vol.source, dir);
      else if (vol.type === 'npipe') errors.push(`${where}: named-pipe mounts are not allowed.`);
    }

    for (const p of asArray(svc.ports)) {
      const port = parsePort(p);
      if (!port.published) {
        errors.push(`${where}: port "${typeof p === 'object' ? JSON.stringify(p) : p}" must bind a fixed host port to 127.0.0.1, e.g. "127.0.0.1:8080:80".`);
        continue;
      }
      if (!ALLOWED_HOST_IPS.includes(port.hostIp)) {
        errors.push(
          `${where}: port "${typeof p === 'object' ? JSON.stringify(p) : p}" must be bound to 127.0.0.1 (e.g. "127.0.0.1:${port.published}:${port.target}") so the lab is not exposed to the LAN.`
        );
        continue;
      }
      hostPorts.push(...expandPorts(port.published));
    }

    if (svc.build != null) {
      const ctx = typeof svc.build === 'string' ? svc.build : svc.build && svc.build.context;
      if (ctx != null) {
        if (/^(https?:|git@|github\.com)/i.test(String(ctx))) errors.push(`${where}: remote build contexts are not allowed.`);
        else if (!isInside(dir, String(ctx))) errors.push(`${where}: build context "${ctx}" is outside the experiment folder.`);
      }
    }
    for (const f of asArray(svc.env_file)) {
      const p = isPlainObject(f) ? f.path : f;
      if (p != null && !isInside(dir, String(p))) errors.push(`${where}: env_file "${p}" is outside the experiment folder.`);
    }
    if (svc.extends && isPlainObject(svc.extends) && svc.extends.file && !isInside(dir, String(svc.extends.file))) {
      errors.push(`${where}: extends.file is outside the experiment folder.`);
    }
    if (svc.deploy && svc.deploy.resources) {
      warnings.push(`${where}: deploy.resources is ignored; set limits in lab.yaml instead.`);
    }
  }

  for (const [nname, ndef] of Object.entries(doc.networks || {})) {
    if (!isPlainObject(ndef)) continue;
    if (nname === 'default' && ndef.external) continue; // only produced by our own override
    if (ndef.external) errors.push(`network "${nname}": external networks are not allowed.`);
    if (ndef.driver && !['bridge'].includes(String(ndef.driver))) {
      errors.push(`network "${nname}": driver "${ndef.driver}" is not allowed (only bridge).`);
    }
  }
  for (const [vname, vdef] of Object.entries(doc.volumes || {})) {
    if (!isPlainObject(vdef)) continue;
    if (vdef.external) errors.push(`volume "${vname}": external volumes are not allowed.`);
    const dev = vdef.driver_opts && (vdef.driver_opts.device || vdef.driver_opts.o);
    if (dev && /bind/.test(String(vdef.driver_opts.o || '')) && vdef.driver_opts.device) {
      checkHostPath(errors, `volume "${vname}"`, vdef.driver_opts.device, dir);
    }
  }
  for (const section of ['secrets', 'configs']) {
    for (const [n, def] of Object.entries(doc[section] || {})) {
      if (isPlainObject(def) && def.file && !isInside(dir, String(def.file))) {
        errors.push(`${section.slice(0, -1)} "${n}": file is outside the experiment folder.`);
      }
      if (isPlainObject(def) && def.external) errors.push(`${section.slice(0, -1)} "${n}": external ${section} are not allowed.`);
    }
  }

  return { errors, warnings, services, hostPorts: [...new Set(hostPorts)] };
}

/* ------------------------------------------------------------------ */
/* Manifest validation                                                 */
/* ------------------------------------------------------------------ */

function validateManifest(raw, dir) {
  const errors = [];
  const warnings = [];
  if (!isPlainObject(raw)) {
    return { manifest: null, errors: ['lab.yaml must be a YAML mapping (key: value pairs).'], warnings };
  }
  const m = {};

  // id / name / mode
  if (typeof raw.id !== 'string' && typeof raw.id !== 'number') errors.push('Missing required field "id" (e.g. EXP03).');
  else if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,39}$/.test(String(raw.id))) {
    errors.push(`"id" must contain only letters, digits, "-" or "_" (got "${raw.id}").`);
  }
  m.id = raw.id != null ? String(raw.id) : '';

  if (typeof raw.name !== 'string' || !raw.name.trim()) errors.push('Missing required field "name".');
  m.name = typeof raw.name === 'string' ? raw.name.trim() : m.id;

  const mode = typeof raw.mode === 'string' ? raw.mode.trim().toUpperCase() : '';
  if (!MODES.includes(mode)) errors.push(`"mode" must be one of ${MODES.join(' | ')} (got "${raw.mode == null ? '' : raw.mode}").`);
  m.mode = mode || 'CONTAINER';

  // descriptive (optional)
  m.description = typeof raw.description === 'string' ? raw.description.trim() : '';
  m.aim = typeof raw.aim === 'string' ? raw.aim.trim() : '';
  m.objectives = asArray(raw.objectives).filter((o) => typeof o === 'string');
  m.difficulty = typeof raw.difficulty === 'string' ? raw.difficulty : '';
  m.duration = raw.duration != null ? String(raw.duration) : '';
  m.tags = asArray(raw.tags).map(String);
  m.references = asArray(raw.references)
    .map((r) => (typeof r === 'string' ? { title: r, url: r } : isPlainObject(r) ? { title: String(r.title || r.url || ''), url: String(r.url || '') } : null))
    .filter((r) => r && r.title);
  for (const r of m.references) {
    if (r.url && !/^https?:\/\//i.test(r.url)) warnings.push(`Reference "${r.title}" has a non-http(s) URL and will not be clickable.`);
  }

  // compose
  const needsCompose = m.mode !== 'SIMULATION';
  m.compose = typeof raw.compose === 'string' ? raw.compose : needsCompose ? 'docker-compose.yml' : null;
  if (needsCompose) {
    if (!isInside(dir, m.compose)) errors.push(`"compose" path "${m.compose}" is outside the experiment folder.`);
    else if (!fs.existsSync(path.join(dir, m.compose))) errors.push(`Compose file "${m.compose}" not found (required for mode ${m.mode}).`);
  }

  // network
  m.network = raw.network == null ? 'isolated' : String(raw.network);
  if (!NETWORKS.includes(m.network)) errors.push(`"network" must be one of ${NETWORKS.join(' | ')} (got "${m.network}").`);

  // limits
  const lim = isPlainObject(raw.limits) ? raw.limits : {};
  m.limits = {
    memory: lim.memory != null ? String(lim.memory) : '512m',
    cpu: lim.cpu != null ? Number(lim.cpu) : 1,
    pids: lim.pids != null ? Number(lim.pids) : 256,
  };
  const memBytes = parseMemory(m.limits.memory);
  if (memBytes == null) errors.push(`limits.memory "${m.limits.memory}" is invalid (use e.g. 256m, 1g).`);
  else if (memBytes < 32 * 1024 ** 2 || memBytes > 4 * 1024 ** 3) errors.push('limits.memory must be between 32m and 4g.');
  if (!Number.isFinite(m.limits.cpu) || m.limits.cpu < 0.1 || m.limits.cpu > 4) errors.push('limits.cpu must be a number between 0.1 and 4.');
  if (!Number.isInteger(m.limits.pids) || m.limits.pids < 16 || m.limits.pids > 4096) errors.push('limits.pids must be an integer between 16 and 4096.');
  m.limits.memoryBytes = memBytes;

  // targetUrl
  m.targetUrl = null;
  if (raw.targetUrl != null && raw.targetUrl !== '') {
    try {
      const u = new URL(String(raw.targetUrl));
      if (!['http:', 'https:'].includes(u.protocol)) errors.push('targetUrl must start with http:// or https://');
      else if (!['localhost', '127.0.0.1', '[::1]'].includes(u.hostname)) errors.push('targetUrl must point to localhost / 127.0.0.1 (never a LAN or Internet host).');
      else if (!u.port) errors.push('targetUrl must include an explicit port, e.g. http://127.0.0.1:8080');
      else m.targetUrl = u.toString();
    } catch (_) {
      errors.push(`targetUrl "${raw.targetUrl}" is not a valid URL.`);
    }
  }

  // terminal
  m.terminalService = raw.terminalService != null && raw.terminalService !== '' ? String(raw.terminalService) : null;
  if (needsCompose && !m.terminalService) warnings.push('No "terminalService" set: the embedded terminal will be disabled.');

  // metrics
  const met = isPlainObject(raw.metrics) ? raw.metrics : {};
  m.metrics = {
    type: met.type != null ? String(met.type) : needsCompose ? 'docker' : 'simulated',
    requestsService: met.requestsService != null ? String(met.requestsService) : null,
    intervalMs: met.intervalMs != null ? Number(met.intervalMs) : 1500,
  };
  if (!METRIC_TYPES.includes(m.metrics.type)) errors.push(`metrics.type must be one of ${METRIC_TYPES.join(' | ')}.`);
  if (!needsCompose && m.metrics.type === 'docker') {
    warnings.push('SIMULATION mode has no containers: metrics.type forced to "simulated".');
    m.metrics.type = 'simulated';
  }
  if (!Number.isFinite(m.metrics.intervalMs) || m.metrics.intervalMs < 1000 || m.metrics.intervalMs > 10000) m.metrics.intervalMs = 1500;

  // content
  const c = isPlainObject(raw.content) ? raw.content : {};
  m.content = {};
  for (const k of CONTENT_KEYS) {
    const declared = c[k] != null && c[k] !== '';
    const rel = declared ? String(c[k]) : CONTENT_DEFAULTS[k];
    if (!rel) continue;
    if (!isInside(dir, rel)) {
      errors.push(`content.${k} "${rel}" is outside the experiment folder.`);
      continue;
    }
    if (fs.existsSync(path.join(dir, rel))) m.content[k] = rel;
    else if (declared) errors.push(`content.${k} file "${rel}" not found.`);
  }

  // timeouts / misc
  m.timeoutMinutes = raw.timeoutMinutes != null ? Number(raw.timeoutMinutes) : 60;
  if (!Number.isFinite(m.timeoutMinutes) || m.timeoutMinutes < 1 || m.timeoutMinutes > 240) errors.push('timeoutMinutes must be between 1 and 240.');
  m.startTimeoutSeconds = raw.startTimeoutSeconds != null ? Number(raw.startTimeoutSeconds) : 180;
  if (!Number.isFinite(m.startTimeoutSeconds) || m.startTimeoutSeconds < 10 || m.startTimeoutSeconds > 1800) {
    errors.push('startTimeoutSeconds must be between 10 and 1800.');
  }
  m.quizRequiresLab = raw.quizRequiresLab !== false;

  return { manifest: m, errors, warnings };
}

/* ------------------------------------------------------------------ */
/* Quiz                                                                */
/* ------------------------------------------------------------------ */

function validateQuiz(raw) {
  const errors = [];
  const src = Array.isArray(raw) ? { questions: raw } : raw;
  if (!isPlainObject(src) || !Array.isArray(src.questions) || !src.questions.length) {
    return { quiz: null, errors: ['quiz.json must contain a non-empty "questions" array.'] };
  }
  const questions = [];
  src.questions.slice(0, 100).forEach((q, i) => {
    const n = i + 1;
    if (!isPlainObject(q)) return errors.push(`Question ${n} must be an object.`);
    const text = q.question || q.text;
    if (typeof text !== 'string' || !text.trim()) return errors.push(`Question ${n}: missing "question" text.`);
    const options = asArray(q.options).map(String);
    if (options.length < 2 || options.length > 8) return errors.push(`Question ${n}: needs 2–8 "options".`);
    let answer = q.answer;
    if (typeof answer === 'string' && !/^\d+$/.test(answer)) answer = options.indexOf(answer);
    answer = Number(answer);
    if (!Number.isInteger(answer) || answer < 0 || answer >= options.length) {
      return errors.push(`Question ${n}: "answer" must be the 0-based index of the correct option (or its exact text).`);
    }
    questions.push({ id: q.id != null ? String(q.id) : `q${n}`, question: text.trim(), options, answer, explanation: q.explanation ? String(q.explanation) : '' });
  });
  const passScore = Number.isFinite(Number(src.passScore)) ? Number(src.passScore) : 60;
  return { quiz: errors.length ? null : { title: src.title ? String(src.title) : 'Quiz', passScore, questions }, errors };
}

/* ------------------------------------------------------------------ */
/* Loading                                                             */
/* ------------------------------------------------------------------ */

function projectName(id) {
  const slug = String(id || 'lab')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '');
  return `vlab-${slug || 'lab'}`;
}

function loadOne(dir) {
  const folder = path.basename(dir);
  const entry = {
    key: folder,
    folder,
    dir,
    id: folder,
    valid: false,
    errors: [],
    warnings: [],
    manifest: null,
    composeInfo: { services: [], hostPorts: [] },
  };
  const file = ['lab.yaml', 'lab.yml'].map((f) => path.join(dir, f)).find((f) => fs.existsSync(f));
  if (!file) {
    entry.errors.push('lab.yaml not found.');
    return entry;
  }
  let raw;
  try {
    const text = fs.readFileSync(file, 'utf8');
    raw = yaml.load(text);
  } catch (e) {
    entry.errors.push(`lab.yaml is not valid YAML: ${e.reason || e.message}${e.mark ? ` (line ${e.mark.line + 1})` : ''}`);
    return entry;
  }
  const { manifest, errors, warnings } = validateManifest(raw, dir);
  entry.manifest = manifest;
  entry.errors.push(...errors);
  entry.warnings.push(...warnings);
  if (manifest && manifest.id) entry.id = manifest.id;

  if (manifest && manifest.mode !== 'SIMULATION' && manifest.compose && isInside(dir, manifest.compose)) {
    const composePath = path.join(dir, manifest.compose);
    if (fs.existsSync(composePath)) {
      try {
        const doc = yaml.load(fs.readFileSync(composePath, 'utf8'));
        const a = analyzeCompose(doc, dir);
        entry.errors.push(...a.errors);
        entry.warnings.push(...a.warnings);
        entry.composeInfo = { services: a.services, hostPorts: a.hostPorts };
        if (manifest.terminalService && a.services.length && !a.services.includes(manifest.terminalService)) {
          entry.errors.push(`terminalService "${manifest.terminalService}" is not a service in ${manifest.compose} (services: ${a.services.join(', ')}).`);
        }
        if (manifest.metrics.requestsService && a.services.length && !a.services.includes(manifest.metrics.requestsService)) {
          entry.warnings.push(`metrics.requestsService "${manifest.metrics.requestsService}" is not a compose service.`);
        }
        if (manifest.network === 'internal' && a.hostPorts.length) {
          entry.errors.push('network "internal" cannot publish ports; remove "ports" or use network: isolated.');
        }
        if (manifest.targetUrl) {
          const port = Number(new URL(manifest.targetUrl).port);
          if (a.hostPorts.length && !a.hostPorts.includes(port)) {
            entry.warnings.push(`targetUrl port ${port} is not published by any service (published: ${a.hostPorts.join(', ') || 'none'}).`);
          }
        }
      } catch (e) {
        entry.errors.push(`${manifest.compose} is not valid YAML: ${e.reason || e.message}`);
      }
    }
  }

  if (manifest) {
    entry.project = projectName(manifest.id);
    entry.networkName = `${entry.project}-net`;
  }
  entry.valid = entry.errors.length === 0;
  return entry;
}

function loadAll(root) {
  const experiments = [];
  if (!fs.existsSync(root)) return { root, experiments, error: `Experiments folder not found: ${root}` };
  const dirs = fs
    .readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_') && !d.name.startsWith('.'))
    .map((d) => path.join(root, d.name))
    .filter((d) => fs.existsSync(path.join(d, 'lab.yaml')) || fs.existsSync(path.join(d, 'lab.yml')));

  for (const d of dirs) experiments.push(loadOne(d));

  // duplicate ids
  const seen = new Map();
  for (const e of experiments) {
    const k = e.id.toLowerCase();
    if (seen.has(k)) {
      e.errors.push(`Duplicate id "${e.id}" (also used by folder "${seen.get(k)}").`);
      e.valid = false;
    } else seen.set(k, e.folder);
  }
  experiments.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  return { root, experiments, error: null };
}

/** Read a content file declared in the manifest. */
function readContent(entry, which) {
  if (!CONTENT_KEYS.includes(which)) throw new Error(`Unknown content type "${which}".`);
  const rel = entry.manifest && entry.manifest.content && entry.manifest.content[which];
  if (!rel) return null;
  const full = path.resolve(entry.dir, rel);
  if (!isInside(entry.dir, full)) throw new Error('Content path escapes the experiment folder.');
  const st = fs.statSync(full);
  if (st.size > MAX_FILE_BYTES) throw new Error(`${rel} is larger than 1 MB.`);
  const text = fs.readFileSync(full, 'utf8');
  if (which === 'quiz') {
    let raw;
    try {
      raw = JSON.parse(text);
    } catch (e) {
      return { path: rel, quiz: null, errors: [`quiz.json is not valid JSON: ${e.message}`] };
    }
    const { quiz, errors } = validateQuiz(raw);
    return { path: rel, quiz, errors };
  }
  return { path: rel, text };
}

module.exports = {
  MODES,
  NETWORKS,
  isInside,
  parseMemory,
  parsePort,
  parseVolume,
  analyzeCompose,
  validateManifest,
  validateQuiz,
  projectName,
  loadOne,
  loadAll,
  readContent,
};
