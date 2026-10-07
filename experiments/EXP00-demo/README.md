# EXP00 Demo — Web Security & Reconnaissance Lab

Welcome to the **EXP00 Web Security Demo Lab**. This experiment demonstrates the architecture and features of the VLab virtual security laboratory environment.

## Lab Architecture
- **Target Container (`target`)**: Running a lightweight Node.js web server on `http://127.0.0.1:3000`.
- **Attacker Container (`attacker`)**: An isolated Alpine Linux terminal environment equipped with standard network tools (`curl`, `nc`, `dig`).
- **Isolated Network (`vlab-exp00-demo-net`)**: Inter-container communication is enabled while external network egress is restricted.

## Objectives
1. Verify container initialization and target health monitoring.
2. Perform HTTP reconnaissance against `http://target:3000` from the attacker terminal.
3. Observe live CPU and RAM resource metrics in the UI dashboard.
4. Complete the 3-question evaluation quiz.
