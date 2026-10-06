#!/bin/sh
set -e

echo "[ICMP Target] Starting target container..."

# Check if ICMP rate limiting mitigation is enabled
if [ "${ENABLE_MITIGATION}" = "true" ] || [ "${ENABLE_MITIGATION}" = "1" ]; then
    RATE="${ICMP_RATE_LIMIT:-5/s}"
    BURST="${ICMP_RATE_BURST:-5}"
    echo "[ICMP Target Mitigation] ENABLING ICMP rate-limiting firewall rules:"
    echo "  - Allow ICMP echo-requests up to ${RATE} (burst: ${BURST})"
    echo "  - Drop excess ICMP echo-requests exceeding the threshold"

    # Configure iptables rate limiting for incoming ICMP echo requests
    iptables -A INPUT -p icmp --icmp-type echo-request -m limit --limit "${RATE}" --limit-burst "${BURST}" -j ACCEPT
    iptables -A INPUT -p icmp --icmp-type echo-request -j DROP
    echo "[ICMP Target Mitigation] Firewall rules active. Status: PROTECTED."
else
    echo "[ICMP Target Mitigation] Mitigation disabled (ENABLE_MITIGATION=${ENABLE_MITIGATION:-false}). Status: UNPROTECTED."
fi

echo "[ICMP Target] Lab target is ready and listening for ICMP requests on hostname: icmp-target"

# Graceful termination handler
trap 'echo "[ICMP Target] Target shutting down"; exit 0' SIGTERM SIGINT

# Keep container alive
sleep infinity &
wait
