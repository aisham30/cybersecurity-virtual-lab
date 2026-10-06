# Target container for ICMP Flood Demonstration (P3)
# Cybersecurity Virtual Lab
FROM alpine:3.20

# Install iputils for ICMP echo support and iptables for mitigation demonstration
RUN apk add --no-cache iputils iptables

# Copy target entrypoint script supporting ICMP rate-limiting mitigation
COPY target/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Predictable hostname set via orchestration, container announces readiness and stays active
CMD ["/entrypoint.sh"]
