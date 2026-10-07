# VLab — Comprehensive Testing Checklist & Verification Guide

This document defines the testing checklist and procedures for validating the **VLab Virtual Cybersecurity Attack Simulation Lab** platform.

---

## 🧪 Testing Checklist

| # | Test Scenario | Description / Procedure | Expected Result | Status |
|---|---------------|-------------------------|-----------------|--------|
| **1** | **Fresh Install** | Clone repository and run `npm install && npm start`. | Application installs all dependencies cleanly without manual native build steps (e.g. no node-pty compilation required) and launches the Electron UI window. | ✅ Verified |
| **2** | **Experiment Discovery** | Launch app or click "Rescan Labs". | Automatically scans `/experiments/*/lab.yaml` and displays the `EXP00-demo` card without modifying app source code. | ✅ Verified |
| **3** | **Normal Lifecycle (Start Lab)** | Select `EXP00-demo` and click **Start Lab**. | Status indicator steps through manifest validation, Docker check, network creation, compose up, and health checks. Status transitions to **Running** and target web server on `http://127.0.0.1:3000` responds. | ✅ Verified |
| **4** | **Target App Interaction** | Open the **Lab** tab and click **Open Target** or test status API. | Target panel loads the web application UI and returns JSON health status. | ✅ Verified |
| **5** | **Embedded Terminal Execution** | Interact with the embedded attacker terminal at the bottom of the **Lab** tab. | Attacker shell opens (`attacker@exp00-demo $`). Commands run safely inside the container (e.g., `curl http://target:3000/api/status`). No host shell execution permitted. | ✅ Verified |
| **6** | **Live Metrics Telemetry** | View CPU, RAM, and RPS charts while running commands or clicking **Push Stress Metric Hook**. | Real-time sparkline charts update smoothly based on `docker stats` or injected metric hooks. | ✅ Verified |
| **7** | **Reset to Clean State** | Click **Reset Lab** while lab is running. | Lab executes Stop (teardown of containers, networks, override file) followed by Start, returning to a fresh clean state. | ✅ Verified |
| **8** | **Stop Lab & Clean Teardown** | Click **Stop Lab**. | Lab containers are removed, custom bridge network deleted, and no leftover Docker resources remain. | ✅ Verified |
| **9** | **Resource Isolation** | Execute network ping or curl commands from attacker terminal to private LAN IP or arbitrary host. | Attacker container bridge network disables IP masquerading, preventing outbound network egress outside the lab bridge. | ✅ Verified |
| **10** | **Error Handling & Validation** | Attempt to start an experiment with missing fields or forbidden compose options (`privileged: true`, `network_mode: host`, external host mounts). | UI detects invalid manifest/compose security violations, prevents execution, and displays clear human-readable error messages with a "View Logs" button. | ✅ Verified |
| **11** | **Quiz & Assessment** | Complete the self-assessment quiz in the **Quiz** tab. | Calculates correct/incorrect answers, displays score badge, pass/fail status, and detailed explanations. | ✅ Verified |
| **12** | **Leftover Cleanup Script** | Run `npm run check:leftovers` after stopping a lab. | Returns `Clean state confirmed: No leftover containers, networks, or volumes found.` | ✅ Verified |

---

## 🛠️ Automated Command Line Verification

Execute the following commands in the workspace root to verify manifest parsing and security rules:

```bash
# 1. Run unit test suite (manifest validation, security checks, quiz parser)
npm test

# 2. Validate all experiment folders in /experiments
npm run validate

# 3. Check for leftover Docker resources (containers, networks, volumes)
npm run check:leftovers

# 4. Force cleanup of any lingering VLab Docker resources
npm run cleanup
```
