FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN pip install --no-cache-dir uv

COPY pyproject.toml ./
RUN uv sync --no-dev

COPY server.py anyhabit_client.py config.py ./

# For a container deployment, pass ANYHABIT_MCP_URL=http://backend:8000
# and usually use streamable-http.
CMD ["uv", "run", "python", "server.py"]
