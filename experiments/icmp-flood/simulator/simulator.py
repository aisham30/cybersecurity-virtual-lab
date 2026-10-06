import json
import subprocess
import time

TARGET = "target"
COUNT = 20
INTERVAL = 0.2

successful = 0
failed = 0

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
        successful += 1
        print(f"ICMP packet {i + 1}/{COUNT}: reply received", flush=True)
    else:
        failed += 1
        print(f"ICMP packet {i + 1}/{COUNT}: no reply", flush=True)

    time.sleep(INTERVAL)

result_data = {
    "experiment": "ICMP-FLOOD-01",
    "target": TARGET,
    "packets_sent": COUNT,
    "successful": successful,
    "failed": failed,
    "packet_loss_percent": round((failed / COUNT) * 100, 2)
}

with open("/tmp/result.json", "w") as file:
    json.dump(result_data, file, indent=2)

print("ICMP simulation completed.", flush=True)
print(json.dumps(result_data), flush=True)
