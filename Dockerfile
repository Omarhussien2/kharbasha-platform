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
    libxrandr2 \
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

# Hugging Face recommends running as user 1000
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    PORT=7860 \
    PYTHONUNBUFFERED=1

WORKDIR $HOME/app

# Python deps
COPY --chown=user backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir playwright browser-use
RUN playwright install chromium

# App code + built frontend
COPY --chown=user backend/ ./backend/
COPY --chown=user frontend/dist/ ./static/

# Writable data dir for SQLite
RUN mkdir -p $HOME/app/data/db

ENV STATIC_DIR=$HOME/app/static \
    APP_NAME=kharbasha

EXPOSE 7860

# Run the FastAPI server (serves frontend + RPC endpoints)
CMD ["python", "backend/server.py"]
