# GPU Workers image for local AI models
# Contains: Qwen3-TTS, Heart Music, Audio Processor (Demucs), ComfyUI
FROM nvidia/cuda:12.4.0-runtime-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3.11 \
    python3.11-venv \
    python3-pip \
    ffmpeg \
    libsndfile1 \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Install Python dependencies for all workers
RUN pip3 install --no-cache-dir \
    torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124

RUN pip3 install --no-cache-dir \
    fastapi \
    uvicorn \
    pydantic \
    python-multipart \
    aiofiles \
    httpx \
    numpy \
    scipy \
    soundfile \
    librosa \
    demucs \
    transformers \
    accelerate \
    safetensors

# Copy worker scripts
COPY scripts/heart-worker.py /app/workers/heart-worker.py
COPY scripts/qwen-tts-worker.py /app/workers/qwen-tts-worker.py
COPY scripts/audio-processor-worker.py /app/workers/audio-processor-worker.py

# Copy supervisor config to manage all workers
COPY k8s/supervisord.conf /etc/supervisor/conf.d/workers.conf

# Install supervisor
RUN pip3 install supervisor

# Expose all worker ports
EXPOSE 8001 8002 8003 8188

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8001/health && curl -f http://localhost:8002/health && curl -f http://localhost:8003/health || exit 1

CMD ["supervisord", "-n", "-c", "/etc/supervisor/conf.d/workers.conf"]
