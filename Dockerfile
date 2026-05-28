FROM python:3.11-slim

# Install system dependencies (compilers for webrtcvad, tesseract-ocr, and ffmpeg)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    tesseract-ocr \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

# Copy requirements from backend and install
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Explicitly install webrtcvad
RUN pip install --no-cache-dir webrtcvad

# Copy the backend source files
COPY backend/ .

# Expose port (Cloud Run defaults to 8080 but exposes via $PORT env)
EXPOSE 8080

# Execute uvicorn server dynamically mapping to the system $PORT
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
