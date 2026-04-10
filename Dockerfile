# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Install system dependencies for Playwright and browser-use
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

# Set the working directory
WORKDIR /app

# Copy backend requirements and install them
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir uvicorn playwright browser-use
RUN playwright install --with-deps chromium

# Copy the backend and frontend dist files
COPY backend/ ./backend/
COPY frontend/dist/ ./static/

# Environment variables for Hugging Face
ENV PORT=7860
ENV PYTHONUNBUFFERED=1

# Expose the port Hugging Face expects
EXPOSE 7860

# Create a simple FastAPI runner if main.py doesn't have one, 
# or run main.py directly if it hosts the server
CMD ["python", "backend/main.py"]
