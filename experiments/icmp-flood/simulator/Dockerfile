FROM alpine:3.21

RUN apk add --no-cache iputils python3

WORKDIR /app

COPY simulator.py .

CMD ["python3", "simulator.py"]
