# VLab — Cybersecurity Attack Simulation Virtual Lab Platform

**VLab** is a local-first, isolated, Docker-based virtual cybersecurity laboratory designed for college and university courses. It enables students to safely simulate, visualize, and analyze cybersecurity attacks (such as SQL Injection, ARP Spoofing, DoS, XSS, etc.) within isolated local container environments.

---

## 🏗️ Platform Architecture

```
+-----------------------------------------------------------------------------------+
|                                  ELECTRON UI                                      |
|  +-------------------+  +-------------------+  +-------------------+  +------------+  |
|  | Dashboard & Cards |  | Theory & Guidance |  | Embedded Webview  |  | xterm.js   |  |
|  | & Filters         |  | Markdown Viewer   |  | Target Panel      |  | Attacker   |  |
|  +-------------------+  +-------------------+  +-------------------+  +------------+  |
+------------------------------------------|----------------------------------------+
                                           | Safe IPC (contextBridge)
                                           v
+-----------------------------------------------------------------------------------+
|                         LAB MANAGER (Electron Main Process)                       |
|  - Auto-discovers experiments (/experiments/*/lab.yaml)                           |
|  - Static compose security analyzer (blocks privileged mode, host net/mounts)     |
|  - Child process execution via safe argument arrays (shell: false)                |
|  - Metrics telemetry service & activity log ring buffer                           |
+------------------------------------------|----------------------------------------+
                                           | Docker CLI (spawn)
                                           v
+-----------------------------------------------------------------------------------+
|                        ISOLATED DOCKER CONTAINER ENVIRONMENT                      |
|                                                                                   |
|  [ Custom Isolated Bridge Network: com.vlab.managed=true ]                        |
|                                                                                   |
|  +--------------------------------+              +-----------------------------+  |
|  | Target Service (Node.js/Web)     |              | Attacker Service (Alpine)   |  |
|  | - Port 127.0.0.1:3000:3000       |<------------>| - Terminal: docker exec -i  |  |
|  +--------------------------------+              +-----------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 🛠️ Prerequisites

1. **Node.js**: `v18.0.0` or higher ([Download Node.js](https://nodejs.org/))
2. **Docker Desktop**: With Docker Engine and Docker Compose v2 ([Download Docker Desktop](https://www.docker.com/products/docker-desktop/))
   - *Ensure Docker Desktop is started and shows "Engine Running" before starting a lab session.*

---

## 🚀 Quick Start Guide

```bash
# 1. Clone the repository
git clone https://github.com/your-org/cybersecurity-virtual-lab.git
cd cybersecurity-virtual-lab

# 2. Install dependencies (cross-platform, no native build steps required)
npm install

# 3. Launch the VLab Application
npm start
```

---

## 🧪 Testing & Validation Commands

```bash
# Run unit test suite (manifest loader, compose analyzer, quiz validator)
npm test

# Validate all experiment folders in /experiments
npm run validate

# Check for any leftover Docker containers, networks, or volumes
npm run check:leftovers

# Force cleanup of all VLab managed Docker resources
npm run cleanup
```

---

## 📁 Project Structure

```
cybersecurity-virtual-lab/
├── app/
│   ├── main/                  # Electron main process & orchestration
│   │   ├── main.js            # Entry point & window lifecycle
│   │   ├── labManager.js      # Lab lifecycle (start, stop, reset, health)
│   │   ├── dockerService.js   # Safe Docker CLI wrapper (child_process.spawn)
│   │   ├── manifestLoader.js  # Manifest loader & compose security analyzer
│   │   ├── metricsService.js   # Real-time docker stats & simulated telemetry
│   │   ├── terminalService.js  # Container terminal launcher (docker exec -i)
│   │   ├── logService.js      # In-memory activity log ring buffer
│   │   ├── errors.js          # Human-readable typed error classes & hints
│   │   └── ipc.js             # IPC event handlers
│   ├── preload/
│   │   └── preload.js         # Secure contextBridge IPC whitelist API
│   └── renderer/              # User Interface
│       ├── index.html         # Application layout & component containers
│       ├── styles.css         # Modern dark theme design system
│       └── app.js             # Renderer state management & event handlers
├── experiments/
│   ├── EXP00-demo/            # Fully functional end-to-end demo experiment
│   └── _template/             # Template folder for teammate experiment creation
├── tests/                     # Test suites & CLI validation scripts
├── README.md                  # System documentation & reference
└── TESTING.md                 # Testing checklist & verification matrix
```

---

## 👩‍💻 Adding a New Experiment (Teammate Guide)

To add a new experiment, copy `experiments/_template` into a new folder inside `experiments/` (e.g. `experiments/EXP01-sqli`) and populate the contract files:

### Folder Structure Requirement
```
experiments/EXP01-sqli/
├── lab.yaml               # Experiment manifest contract
├── docker-compose.yml     # Compose configuration
├── README.md              # Quick overview document
├── Guidance.md            # Step-by-step procedure
├── content/
│   └── theory.md          # Theoretical background
└── assets/
    └── quiz.json          # Multiple-choice evaluation quiz
```

### `lab.yaml` Field Reference

```yaml
id: EXP01                              # Unique identifier (required)
name: SQL Injection Vulnerability Lab # Display title (required)
mode: CONTAINER                        # SIMULATION | CONTAINER | NETWORK_LAB
compose: docker-compose.yml            # Relative path to compose file
network: isolated                      # isolated | internal
limits:
  memory: 512m                         # Memory limit (e.g., 256m, 512m, 1g)
  cpu: 1                               # Max CPU cores (0.1 to 4)
  pids: 256                            # Max process IDs limit
targetUrl: http://localhost:3000       # Target web service URL (must point to 127.0.0.1)
terminalService: attacker              # Compose service name to attach embedded terminal
metrics:
  type: docker                         # docker | simulated
  requestsService: target              # Optional service name to monitor HTTP log rate
content:
  readme: README.md
  guidance: Guidance.md
  theory: content/theory.md
  quiz: assets/quiz.json
aim: Learn to identify and exploit SQL injection vulnerabilities in a target web application.
objectives:
  - Understand SQL query structure and parameter escaping
  - Inject SQL payloads into vulnerable login forms
tags:
  - Web Security
  - SQLi
difficulty: Intermediate
duration: 30 mins
references:
  - title: OWASP SQL Injection Guide
    url: https://owasp.org/www-community/attacks/SQL_Injection
```

### 🔒 Security Constraints & Manifest Validation Rules
The Lab Manager automatically validates every `lab.yaml` and `docker-compose.yml` file upon startup. It will **refuse to run** any experiment that violates safety rules:
1. **No Host Network**: `network_mode: host` is strictly forbidden.
2. **No Privileged Mode**: `privileged: true` is not permitted.
3. **No Unsafe Host Mounts**: Volume mounts like `/etc:/etc` or `~/.ssh:/ssh` are blocked; host mounts must remain strictly within the experiment's own folder (e.g., `./target:/app`).
4. **Port Binding**: Host ports must be explicitly bound to `127.0.0.1` (e.g. `"127.0.0.1:3000:3000"`). Broad bindings (`0.0.0.0`) are forbidden so labs are not exposed to the local network.

---

## ❓ Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| **"Docker is not installed"** | Docker CLI executable not found in PATH | Install Docker Desktop and restart the application. |
| **"Docker Desktop is not running"** | Docker daemon engine stopped | Open Docker Desktop and wait until it indicates "Engine Running", then click "Rescan Labs". |
| **"Port is already in use"** | Another service on the host is using the target port | Stop the host service using the port or update `ports` in `docker-compose.yml`. |
| **"Manifest Invalid / Unsafe Settings"** | Forbidden options detected in compose file | Click "View Logs" or inspect `npm run validate` output to view exact security rule violations. |
