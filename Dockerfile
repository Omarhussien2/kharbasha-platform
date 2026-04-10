# Kharbasha Platform — HF Spaces Docker image
FROM python:3.11-slim

# System deps for Playwright / headless Chromium (used by browser-use)
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    librandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcursor1 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Python deps
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir playwright browser-use
RUN playwright install --with-deps chromium

# App code + built frontend
COPY backend/ ./backend/
COPY frontend/dist/ ./static/

# Writable data dir for SQLite (HF Spaces: /app is writable at runtime)
RUN mkdir -p /app/data/db && chmod -R 777 /app/data

ENV PORT=7860 \
    PYTHONUNBUFFERED=1 \
    STATIC_DIR=/app/static \
    APP_NAME=kharbasha

EXPOSE 7860

# Run the FastAPI server (serves frontend + RPC endpoints)
CMD ["python", "backend/server.py"]
