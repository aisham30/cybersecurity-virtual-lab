FROM python:3.12-slim

WORKDIR /app

COPY target.py .

HEALTHCHECK --interval=5s --timeout=3s --retries=3 CMD python -c "import os; os.kill(1, 0)"

CMD ["python", "target.py"]
