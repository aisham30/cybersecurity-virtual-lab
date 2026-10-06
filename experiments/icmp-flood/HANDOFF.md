# ICMP-FLOOD-01 Infrastructure Handoff

## Owner

Person 2 - Docker / Infrastructure

## Experiment

ICMP Flood Attack

## Directory

experiments/icmp-flood/

## Architecture

The experiment contains:

- target container
- simulator container
- isolated Docker network

The target is the controlled lab endpoint.

The simulator generates bounded ICMP traffic only toward the Docker service named 	arget.

## Network

Docker network:

    lab-network

The network is configured as:

    internal: true

No host ports are exposed.

## Resource Limits

Target:

    CPU: 0.50
    Memory: 128 MB

Simulator:

    CPU: 0.50
    Memory: 128 MB

## Lifecycle

Start lab:

    docker compose up -d

Run experiment:

    docker compose --profile attack run --rm simulator

Stop lab:

    docker compose stop

Reset lab:

    docker compose down -v

Status:

    docker compose ps

Logs:

    docker compose logs

## Electron Integration

Electron should use the provided scripts rather than allowing students to execute arbitrary shell commands.

Start:

    powershell -ExecutionPolicy Bypass -File ".\scripts\lab.ps1" start

Attack:

    powershell -ExecutionPolicy Bypass -File ".\scripts\lab.ps1" attack

Status:

    powershell -ExecutionPolicy Bypass -File ".\scripts\lab.ps1" status

Machine-readable status:

    powershell -ExecutionPolicy Bypass -File ".\scripts\status-json.ps1"

Logs:

    powershell -ExecutionPolicy Bypass -File ".\scripts\lab.ps1" logs

Stop:

    powershell -ExecutionPolicy Bypass -File ".\scripts\lab.ps1" stop

Reset:

    powershell -ExecutionPolicy Bypass -File ".\scripts\lab.ps1" reset

## Safety Boundary

The simulator has:

- fixed Docker target
- bounded packet count
- fixed interval
- no arbitrary destination
- no Internet/LAN targeting

The experiment is intended to run only inside the isolated Docker lab.

## Health

The target has a Docker health check.

Electron should wait until the target reports healthy before enabling the experiment action.

## Metrics

Useful Docker-level metrics include:

    docker stats --no-stream

Useful lifecycle information includes:

    docker compose ps

Container logs contain simulator progress and experiment results.

## Testing

Infrastructure test:

    powershell -ExecutionPolicy Bypass -File ".\tests\test-infrastructure.ps1"

The test starts the target, checks health, runs the simulator and cleans up.

## Integration Flow

    Start Lab
        |
        v
    Target starts
        |
        v
    Target becomes healthy
        |
        v
    Enable Run Experiment
        |
        v
    Simulator runs
        |
        v
    Results / Metrics
        |
        v
    Stop or Reset
