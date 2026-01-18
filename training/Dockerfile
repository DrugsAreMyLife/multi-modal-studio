# Use NVIDIA CUDA base image with Python
FROM nvidia/cuda:11.8.0-runtime-ubuntu22.04

WORKDIR /workspace

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy training script and config
COPY train_lora.py .
COPY config_schema.json .

# Create data directories
RUN mkdir -p /data/datasets /data/outputs

# Set environment variables
ENV HF_HOME=/data/cache
ENV CUDA_VISIBLE_DEVICES=0

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python3 -c "import torch; print(f'CUDA available: {torch.cuda.is_available()}')" || exit 1

# Default command
ENTRYPOINT ["python3", "train_lora.py"]
CMD ["--help"]
