# Multi-stage Dockerfile for AI Smart Attendance System
# Optimized for 1-click Railway deployment

# --- Stage 1: Build Frontend ---
FROM node:20-alpine AS frontend-builder
WORKDIR /build

COPY ai-attendance-system/frontend/package*.json ./
RUN npm install

COPY ai-attendance-system/frontend ./
RUN npm run build

# --- Stage 2: Runtime Environment ---
FROM python:3.10-slim

WORKDIR /app

# Install minimal system dependencies for OpenCV & healthchecks
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY ai-attendance-system/backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Copy backend source code
COPY ai-attendance-system/backend ./backend

# Copy AI model & dataset
COPY ai-attendance-system/ai-model ./ai-model

# Copy pre-built frontend distribution into backend static directory
COPY --from=frontend-builder /build/dist ./backend/static

# Copy startup script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Environment settings
ENV PYTHONUNBUFFERED=1
ENV PORT=8000
ENV AI_MODEL_DIR=/app/ai-model

WORKDIR /app/backend

EXPOSE 8000

CMD ["/bin/sh", "/app/start.sh"]
