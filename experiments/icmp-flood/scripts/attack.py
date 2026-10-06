import subprocess
import time

TARGET = "icmp-target"
PACKETS = 100
INTERVAL = 0.05
MAX_RUNTIME = 10

print("=== ICMP Flood Demonstration ===")
print(f"Target: {TARGET}")
print(f"Packets: {PACKETS}")
print(f"Interval: {INTERVAL}s")
print(f"Maximum runtime: {MAX_RUNTIME}s")
print("Target is restricted to the isolated Docker lab.")

start = time.time()

result = subprocess.run(
    [
        "ping",
        "-c", str(PACKETS),
        "-i", str(INTERVAL),
        TARGET
    ],
    capture_output=True,
    text=True,
    timeout=MAX_RUNTIME
)

elapsed = time.time() - start

print(result.stdout)
print(f"Attack simulation completed in {elapsed:.2f}s")
print(f"Exit code: {result.returncode}")
