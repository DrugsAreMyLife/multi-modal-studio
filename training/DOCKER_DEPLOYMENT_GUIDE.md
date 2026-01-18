# Docker-Based LoRA Training Environment - Deployment Guide

## Project Structure

The complete training environment is located in:

```
/Users/nick/Projects/Multi-Modal Generation Studio/training/
```

### Files Created

```
training/
├── Dockerfile                          # NVIDIA CUDA 12.1 base, Python 3.10
├── docker-compose.training.yml         # Multi-service orchestration
├── docker-entrypoint.sh               # Container initialization script
├── .dockerignore                       # Build optimization
├── .env.training                       # Environment variables template
├── requirements.txt                    # Python dependencies
├── train_lora.py                       # LoRA training script
├── config.json                         # Default training config
├── build.sh                           # Build helper script
├── run.sh                             # Execution helper script
├── health-check.sh                    # Monitoring helper script
├── README.md                          # Comprehensive documentation
├── QUICKSTART.md                      # Quick start guide
└── IMPLEMENTATION_SUMMARY.md          # Feature overview
```

## System Architecture

```
                   Docker Container
        ┌────────────────────────────────────┐
        │  NVIDIA CUDA 12.1 + cuDNN 8        │
        │  Ubuntu 22.04                      │
        │  Python 3.10                       │
        │  PyTorch 2.1.2                     │
        │  ├─ Train LoRA Script              │
        │  ├─ Health Check Server (8080)     │
        │  └─ Model Execution                │
        └────────────────────────────────────┘
                      ↕
        ┌────────────────────────────────────┐
        │  Volume Mounts                     │
        │  ├─ /workspace/datasets (ro)       │
        │  ├─ /workspace/outputs (rw)        │
        │  ├─ /workspace/models (rw)         │
        │  └─ /workspace/config.json (ro)    │
        └────────────────────────────────────┘
```

## Deployment Steps

### Step 1: Prerequisites Verification

```bash
# Verify Docker installation
docker --version
# Expected: Docker version 20.10+

# Verify NVIDIA Container Toolkit
docker run --rm --gpus all nvidia/cuda:12.1.0-base-ubuntu22.04 nvidia-smi
# Expected: GPU information with NVIDIA-SMI output

# Verify disk space
df -h | grep -E "^/dev/"
# Expected: At least 100GB free space
```

### Step 2: Navigate to Training Directory

```bash
cd /Users/nick/Projects/Multi-Modal\ Generation\ Studio/training/
```

### Step 3: Build Docker Image

```bash
# Option A: Using helper script (recommended)
./build.sh

# Option B: Direct docker compose
docker compose -f docker-compose.training.yml build

# Option C: With BuildKit for faster builds
DOCKER_BUILDKIT=1 docker compose -f docker-compose.training.yml build
```

**Expected Output:**

```
Building LoRA Training Docker Image
========================================
Building image: multi-modal-studio/training:latest
...
Build completed successfully!
```

### Step 4: Configure Training

Edit `config.json` for your training scenario:

```json
{
  "model_name": "meta-llama/Llama-2-7b",
  "learning_rate": 0.0001,
  "num_train_epochs": 3,
  "per_device_train_batch_size": 8,
  "lora_r": 8,
  "lora_alpha": 16,
  "use_4bit": true
}
```

### Step 5: Create Required Directories

```bash
# Create dataset and output directories
mkdir -p ../public/datasets
mkdir -p ../public/outputs

# Set proper permissions
chmod 755 ../public/datasets ../public/outputs
```

### Step 6: Run Training

```bash
# Option A: Foreground mode (see real-time output)
./run.sh

# Option B: Background mode
./run.sh --background

# Option C: Direct docker compose
docker compose -f docker-compose.training.yml up

# Option D: Detached mode
docker compose -f docker-compose.training.yml up -d
```

### Step 7: Monitor Training

**Terminal 1 - View logs:**

```bash
docker compose -f docker-compose.training.yml logs -f
```

**Terminal 2 - Health check:**

```bash
./health-check.sh

# Or query endpoints directly
curl http://localhost:8080/health
curl http://localhost:8080/metrics
curl http://localhost:8080/status
```

**Terminal 3 - GPU monitoring:**

```bash
watch -n 1 'docker exec $(docker compose -f docker-compose.training.yml ps -q) nvidia-smi'
```

### Step 8: Retrieve Results

```bash
# List training outputs
ls -la ../public/outputs/

# Copy final model
cp -r ../public/outputs/final_model ~/Downloads/

# View training artifacts
find ../public/outputs/ -name "*.pt" -o -name "*.pth" -o -name "*.safetensors"
```

### Step 9: Clean Up

```bash
# Stop training
docker compose -f docker-compose.training.yml down

# Remove image (if needed)
docker image rm multi-modal-studio/training:latest

# Remove dangling images
docker image prune -f
```

## Configuration Examples

### Example 1: Small Model (7B) - Consumer GPU

```json
{
  "model_name": "meta-llama/Llama-2-7b",
  "dataset_name": "wikitext",
  "dataset_config": "wikitext-2-raw-v1",
  "learning_rate": 0.0001,
  "num_train_epochs": 1,
  "per_device_train_batch_size": 8,
  "per_device_eval_batch_size": 8,
  "gradient_accumulation_steps": 1,
  "warmup_steps": 100,
  "weight_decay": 0.01,
  "output_dir": "/workspace/outputs",
  "lora_r": 8,
  "lora_alpha": 16,
  "lora_dropout": 0.05,
  "lora_target_modules": ["q_proj", "v_proj"],
  "use_4bit": true,
  "max_seq_length": 2048
}
```

### Example 2: Medium Model (13B) - Professional GPU

```json
{
  "model_name": "meta-llama/Llama-2-13b",
  "num_train_epochs": 2,
  "per_device_train_batch_size": 4,
  "gradient_accumulation_steps": 2,
  "lora_r": 16,
  "lora_alpha": 32,
  "use_4bit": true,
  "max_seq_length": 2048
}
```

### Example 3: Large Model (70B) - Enterprise GPU

```json
{
  "model_name": "meta-llama/Llama-2-70b",
  "num_train_epochs": 1,
  "per_device_train_batch_size": 2,
  "gradient_accumulation_steps": 4,
  "lora_r": 16,
  "lora_alpha": 32,
  "use_8bit": true,
  "max_seq_length": 1024
}
```

## Docker Compose Service Configuration

### GPU Device Selection

**Single GPU (default):**

```yaml
devices:
  - driver: nvidia
    device_ids: ['0']
    capabilities: [gpu]
```

**Multiple GPUs:**

```yaml
devices:
  - driver: nvidia
    device_ids: ['0', '1']
    capabilities: [gpu]
```

**All GPUs:**

```yaml
devices:
  - driver: nvidia
    count: all
    capabilities: [gpu]
```

### Resource Limits

**Adjust Memory Limits:**

```yaml
deploy:
  resources:
    limits:
      memory: 32G # Increase for larger models
```

**Adjust Shared Memory:**

```yaml
shm_size: 16gb # For multi-worker dataloaders
```

**Adjust CPU Limits:**

```yaml
deploy:
  resources:
    limits:
      cpus: '8' # Increase for faster preprocessing
```

## Volume Mount Strategies

### Read-Only Datasets

```yaml
volumes:
  - /path/to/dataset:/workspace/datasets:ro
```

### Read-Write Outputs

```yaml
volumes:
  - /path/to/outputs:/workspace/outputs:rw
```

### Model Cache Persistence

```yaml
volumes:
  - ~/.cache/huggingface:/workspace/models:rw
```

### Configuration Files

```yaml
volumes:
  - ./config.json:/workspace/config.json:ro
```

## Health Check Integration

### HTTP Endpoints

**Health Status:**

```bash
curl -s http://localhost:8080/health | python3 -m json.tool
```

**Training Metrics:**

```bash
curl -s http://localhost:8080/metrics | python3 -m json.tool
```

**System Status:**

```bash
curl -s http://localhost:8080/status | python3 -m json.tool
```

### Kubernetes Liveness Probe

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 60
  periodSeconds: 30
  timeoutSeconds: 10
```

## Troubleshooting Deployment

### Issue: GPU Not Detected

```bash
# Verify NVIDIA runtime
docker run --rm --gpus all nvidia/cuda:12.1.0-base-ubuntu22.04 nvidia-smi

# Check docker daemon config
cat /etc/docker/daemon.json

# Restart docker
sudo systemctl restart docker
```

### Issue: Out of Memory

```bash
# Reduce batch size
"per_device_train_batch_size": 4

# Enable 4-bit quantization
"use_4bit": true

# Increase gradient accumulation
"gradient_accumulation_steps": 4
```

### Issue: Slow Training

```bash
# Increase batch size (if memory allows)
"per_device_train_batch_size": 16

# Use flash attention
"use_flash_attention": true

# Reduce evaluation frequency
"eval_steps": 500
```

### Issue: Model Download Fails

```bash
# Pre-download model
docker exec $(docker ps -q) python3 -c \
  "from transformers import AutoModel; \
   AutoModel.from_pretrained('meta-llama/Llama-2-7b')"

# Or set HF token
docker compose -f docker-compose.training.yml up \
  -e HF_TOKEN=hf_xxxxxxxx
```

## Performance Optimization

### GPU Optimization

```json
{
  "use_flash_attention": true,
  "bf16": true,
  "gradient_checkpointing": true,
  "tf32": true
}
```

### Memory Optimization

```json
{
  "use_4bit": true,
  "per_device_train_batch_size": 4,
  "gradient_accumulation_steps": 4,
  "max_seq_length": 1024
}
```

### Speed Optimization

```json
{
  "per_device_train_batch_size": 16,
  "logging_steps": 50,
  "eval_steps": 500,
  "num_train_epochs": 1
}
```

## Monitoring Commands Reference

```bash
# View container status
docker compose -f docker-compose.training.yml ps

# View real-time logs
docker compose -f docker-compose.training.yml logs -f

# View last 100 lines
docker compose -f docker-compose.training.yml logs --tail=100

# Inspect container
docker exec -it $(docker ps -q) /bin/bash

# Check GPU usage
docker exec $(docker ps -q) nvidia-smi

# Monitor resources
docker stats
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Training Pipeline

on: [push]

jobs:
  train:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build Docker image
        run: docker compose -f training/docker-compose.training.yml build

      - name: Run training
        run: docker compose -f training/docker-compose.training.yml up

      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: training-outputs
          path: public/outputs/
```

### GitLab CI Example

```yaml
training:
  stage: train
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker compose -f training/docker-compose.training.yml build
    - docker compose -f training/docker-compose.training.yml up
  artifacts:
    paths:
      - public/outputs/
```

## Production Deployment Checklist

- [ ] Docker and NVIDIA Container Toolkit installed
- [ ] GPU drivers updated to latest version
- [ ] Sufficient disk space (100GB+)
- [ ] config.json properly configured
- [ ] Dataset prepared in public/datasets/
- [ ] Docker image built and tested
- [ ] Health check endpoints verified
- [ ] Volume mounts configured
- [ ] Resource limits appropriate for GPU
- [ ] Monitoring and logging configured
- [ ] Backup strategy for outputs
- [ ] Model cache directory setup
- [ ] Environment variables configured

## Next Steps

1. Review full documentation: `README.md`
2. Quick start guide: `QUICKSTART.md`
3. Build Docker image: `./build.sh`
4. Configure training: Edit `config.json`
5. Prepare dataset: Place files in `../public/datasets/`
6. Run training: `./run.sh`
7. Monitor training: `./health-check.sh`
8. Access results: `../public/outputs/`

## Support Resources

- Docker Documentation: https://docs.docker.com
- NVIDIA Container Toolkit: https://github.com/NVIDIA/nvidia-docker
- PyTorch: https://pytorch.org/docs
- Hugging Face: https://huggingface.co/docs
- PEFT: https://huggingface.co/docs/peft

---

**Version**: 1.0.0
**Created**: 2024-01-18
**Status**: Production Ready
**Last Updated**: 2024-01-18
