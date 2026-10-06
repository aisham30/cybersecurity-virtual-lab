# ICMP Flood Attack Lab

## Aim

Demonstrate the observable effects of controlled ICMP traffic against an isolated Docker target.

## Architecture

The experiment consists of:

- Target container
- Simulator container
- Isolated Docker bridge network

The simulator can communicate only with the lab environment.

## Prerequisites

- Docker Desktop
- Docker Compose

## Start the Lab

Run:

    docker compose up -d

Check:

    docker compose ps

## Test Connectivity

Run:

    docker compose run --rm --profile attack simulator ping -c 4 target

## Run the Controlled Simulation

Run:

    docker compose --profile attack run --rm simulator

The simulator uses a fixed target and bounded packet count.

## Stop the Lab

Run:

    docker compose stop

## Reset the Lab

Run:

    docker compose down -v

## View Logs

Run:

    docker compose logs

## Safety

This experiment is designed for an isolated local Docker environment.

The simulator uses a fixed Docker service target and bounded traffic generation. It does not accept arbitrary Internet or LAN destinations.

## Learning Outcome

Students observe how ICMP traffic can be generated against a controlled target and can later correlate the traffic with network and system metrics.
