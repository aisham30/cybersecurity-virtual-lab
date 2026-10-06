'use strict';
/**
 * Human-readable, typed errors shared by the Lab Manager and the UI.
 * Every error that reaches the renderer is serialised with toErrorPayload().
 */

const HINTS = {
  DOCKER_NOT_INSTALLED:
    'Install Docker Desktop (https://www.docker.com/products/docker-desktop/), start it once, then restart this app.',
  DOCKER_NOT_RUNNING:
    'Start Docker Desktop and wait until it shows "Engine running", then try again.',
  COMPOSE_MISSING:
    'Docker Compose v2 (with "--wait" support) is required. Update Docker Desktop to a recent version.',
  MANIFEST_INVALID:
    "Fix the errors in the experiment's lab.yaml / docker-compose.yml, then click \"Rescan\" on the dashboard.",
  COMPOSE_UNSAFE:
    "This experiment's docker-compose.yml uses a forbidden option (privileged, host network, host mounts, public ports…). Ask the experiment author to fix it.",
  PORT_IN_USE:
    'Another program (or another lab) is using this port. Close it, or change the host port in docker-compose.yml.',
  IMAGE_FAILED:
    'The first start needs internet access to pull images. Check your connection, or the Dockerfile for build errors. Click "View logs" for details.',
  HEALTH_TIMEOUT:
    'The lab did not become ready in time. Click "View logs" to see the container output, then try Reset Lab.',
  CONTAINER_CRASHED:
    'A lab container stopped unexpectedly. Click "View logs" to see why, then use Reset Lab.',
  START_FAILED: 'Click "View logs" for the full Docker output.',
  TIMEOUT: 'A Docker command took too long. Docker may be busy or low on resources; try again.',
  BUSY: 'Wait for the current operation to finish.',
  ANOTHER_RUNNING: 'Only one lab can run at a time (keeps resource use low and avoids port clashes).',
  TERMINAL_UNAVAILABLE: 'Start the lab first. The terminal only attaches to the lab\'s own container.',
  ABORTED: '',
};

class LabError extends Error {
  constructor(code, message, { hint, details } = {}) {
    super(message);
    this.name = 'LabError';
    this.code = code || 'UNKNOWN';
    this.hint = hint != null ? hint : HINTS[this.code] || '';
    this.details = details ? String(details).slice(0, 20000) : '';
  }

  static from(payload) {
    if (payload instanceof LabError) return payload;
    const p = payload || {};
    return new LabError(p.code || 'UNKNOWN', p.message || 'Unknown error', { hint: p.hint, details: p.details });
  }

  toJSON() {
    return { code: this.code, message: this.message, hint: this.hint, details: this.details };
  }
}

function toErrorPayload(err) {
  if (err instanceof LabError) return err.toJSON();
  return {
    code: 'UNKNOWN',
    message: (err && err.message) || String(err),
    hint: '',
    details: (err && err.stack) || '',
  };
}

/**
 * Map raw Docker CLI stderr to a typed, friendly LabError.
 */
function classifyDockerError(stderr, fallbackCode = 'START_FAILED', fallbackMessage = 'Docker command failed.') {
  const s = String(stderr || '');

  if (
    /error during connect|cannot connect to the docker daemon|is the docker daemon running|docker daemon is not running|dockerDesktopLinuxEngine|docker_engine.*(cannot find|no such file|not found)|the system cannot find the file specified/i.test(
      s
    )
  ) {
    return new LabError('DOCKER_NOT_RUNNING', 'Docker Desktop is not running.', { details: s });
  }

  if (/port is already allocated|address already in use|ports are not available|only one usage of each socket address/i.test(s)) {
    const m = s.match(/(?:127\.0\.0\.1|0\.0\.0\.0|\[::1?\]|localhost):(\d{1,5})/);
    return new LabError('PORT_IN_USE', m ? `Port ${m[1]} is already in use.` : 'A required port is already in use.', { details: s });
  }

  if (
    /pull access denied|manifest unknown|manifest for .* not found|failed to resolve reference|failed to solve|failed to build|error pulling|tls handshake timeout|no such host|i\/o timeout|repository does not exist|failed to fetch|toomanyrequests/i.test(
      s
    )
  ) {
    return new LabError('IMAGE_FAILED', 'Failed to pull or build a lab image.', { details: s });
  }

  if (/'compose' is not a docker command|unknown (shorthand )?flag|unknown command "compose"/i.test(s)) {
    return new LabError('COMPOSE_MISSING', 'Docker Compose v2 is not available (or is too old).', { details: s });
  }

  if (/is unhealthy|dependency failed to start|did not become healthy/i.test(s)) {
    return new LabError('HEALTH_TIMEOUT', 'A lab container did not become healthy.', { details: s });
  }

  if (/exited with code|has exited|container .* exited/i.test(s)) {
    return new LabError('CONTAINER_CRASHED', 'A lab container exited during startup.', { details: s });
  }

  return new LabError(fallbackCode, fallbackMessage, { details: s });
}

module.exports = { LabError, toErrorPayload, classifyDockerError, HINTS };
