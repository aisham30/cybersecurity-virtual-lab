import subprocess
import sys
import time

TARGET = "target"
COUNT = 20
INTERVAL = 0.2

print("ICMP Lab Simulator", flush=True)
print(f"Target: {TARGET}", flush=True)
print(f"Packets: {COUNT}", flush=True)
print(f"Interval: {INTERVAL}s", flush=True)

for i in range(COUNT):
    result = subprocess.run(
        ["ping", "-c", "1", "-W", "1", TARGET],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    if result.returncode == 0:
        print(f"ICMP packet {i + 1}/{COUNT}: reply received", flush=True)
    else:
        print(f"ICMP packet {i + 1}/{COUNT}: no reply", flush=True)

    time.sleep(INTERVAL)

print("ICMP simulation completed.", flush=True)
