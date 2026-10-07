FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    iptables \
    iputils-ping \
    net-tools \
    procps \
 && rm -rf /var/lib/apt/lists/*
CMD ["tail", "-f", "/dev/null"]
