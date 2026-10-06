FROM alpine:3.20

RUN apk add --no-cache iputils python3

COPY scripts/attack.py /attack.py

CMD ["python3", "/attack.py"]
