FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source into a 'backend' package directory
COPY . ./backend/

# Ensure Python treats the directory as a package
RUN touch ./backend/__init__.py

# Persistent storage for the SQLite database
RUN mkdir -p data

EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
