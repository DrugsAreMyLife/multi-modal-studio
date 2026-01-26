# GPU Workers image for local AI models
# Contains: Qwen3-TTS, Heart Music, Audio Processor (Demucs), ComfyUI
# Supports: RTX 5090 (32GB, SM 10.0), RTX 4090 (24GB, SM 8.9)
FROM nvidia/cuda:12.6.3-runtime-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
# CUDA arch for RTX 4090 (8.9) and RTX 5090 (10.0 / Blackwell)
ENV TORCH_CUDA_ARCH_LIST="8.9;10.0"

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3.11 \
    python3.11-venv \
    python3-pip \
    ffmpeg \
    libsndfile1 \
    libcudnn9-cuda-12 \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Install Python dependencies for all workers
# CUDA 12.6 supports both RTX 5090 (Blackwell) and RTX 4090 (Ada Lovelace)
RUN pip3 install --no-cache-dir \
    torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu126

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
    safetensors \
    flash-attn \
    xformers

# Copy worker scripts
COPY scripts/heart-worker.py /app/workers/heart-worker.py
COPY scripts/qwen-tts-worker.py /app/workers/qwen-tts-worker.py
COPY scripts/audio-processor-worker.py /app/workers/audio-processor-worker.py
COPY scripts/hunyuan-video-worker.py /app/workers/hunyuan-video-worker.py
COPY scripts/personaplex-worker.py /app/workers/personaplex-worker.py

# Copy supervisor config to manage all workers
COPY k8s/supervisord.conf /etc/supervisor/conf.d/workers.conf

# Install supervisor
RUN pip3 install supervisor

# Expose all worker ports
EXPOSE 8001 8002 8003 8007 8015 8188

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
    CMD curl -f http://localhost:8001/health && curl -f http://localhost:8002/health && curl -f http://localhost:8003/health || exit 1

CMD ["supervisord", "-n", "-c", "/etc/supervisor/conf.d/workers.conf"]
