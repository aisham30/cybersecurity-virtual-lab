# Theoretical Background — Isolated Security Virtualization

## 1. Local-First Container Isolation
Traditional cybersecurity labs often rely on full Virtual Machines (VMs) which require gigabytes of disk space and substantial CPU resources. Containerization using **Docker** enables lightweight, reproducible environments with near-instant startup times.

### Key Isolation Mechanisms
- **Linux Namespaces**: Isolate process IDs (`pid`), network interfaces (`net`), mount points (`mnt`), and user IDs (`user`).
- **Control Groups (cgroups)**: Enforce strict CPU cores, memory limits, and process ID limits to prevent host system denial of service.
- **Bridge Network Segregation**: Disables IP masquerading on custom bridge networks, preventing lab containers from sending packets to the student's local LAN or public Internet.

```
       +-------------------------------------------------------------+
       |                        HOST OS                              |
       |                                                             |
       |  +-------------------------------------------------------+  |
       |  |                 Electron UI / Lab Manager              |  |
       |  +---------------------------+---------------------------+  |
       |                              | IPC (127.0.0.1)              |
       |                              v                              |
       |  +-------------------------------------------------------+  |
       |  |         Docker Engine (Isolated Lab Network)          |  |
       |  |                                                       |  |
       |  |  +-------------------+        +--------------------+  |  |
       |  |  | Attacker Container|        |  Target Container  |  |  |
       |  |  | (Alpine Shell)    |------->|  (Node.js App)     |  |  |
       |  |  +-------------------+        +--------------------+  |  |
       |  +-------------------------------------------------------+  |
       +-------------------------------------------------------------+
```

## 2. HTTP Protocol Reconnaissance
Web application assessment relies on inspecting raw HTTP requests and responses. Key header fields include:
- **`Host`**: Indicates the target domain or IP.
- **`User-Agent`**: Identifies the client software making the request.
- **`Content-Type`**: Defines the media type of the payload (e.g., `application/json`).
- **`Status Codes`**: `200 OK`, `404 Not Found`, `500 Server Error`.

In this demo lab, students practice issuing command-line HTTP requests via `curl` from within the attacker container to understand client-server interactions.
