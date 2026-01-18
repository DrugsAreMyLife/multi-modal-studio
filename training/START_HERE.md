# Docker-Based LoRA Training Environment - START HERE

Welcome! This document will get you up and running in minutes.

## What You Have

A complete, production-ready Docker training environment for LoRA fine-tuning with GPU support.

**Location**: `/Users/nick/Projects/Multi-Modal Generation Studio/training/`

## Quick Validation (2 minutes)

Verify your system is ready:

```bash
# Check Docker
docker --version  # Should be 20.10+

# Check GPU access
docker run --rm --gpus all nvidia/cuda:12.1.0-base-ubuntu22.04 nvidia-smi

# Should show your GPU info
```

## Start Training in 3 Steps

### Step 1: Navigate to training directory

```bash
cd /Users/nick/Projects/Multi-Modal\ Generation\ Studio/training/
```

### Step 2: Build Docker image

```bash
./build.sh

# Takes 5-10 minutes. Wait for "Build completed successfully!"
```

### Step 3: Start training

```bash
./run.sh

# Your training will start. See real-time logs.
# Press Ctrl+C to stop (gracefully saves checkpoint)
```

## Monitor Training (In another terminal)

```bash
# Check health and metrics
./health-check.sh

# Or check GPU directly
watch -n 1 'docker exec $(docker ps -q) nvidia-smi'
```

## Get Your Results

```bash
# Find trained models
ls -la ../public/outputs/

# Copy final model
cp -r ../public/outputs/final_model ~/Downloads/
```

## Need More Info?

### For Quick Start

→ Read: **QUICKSTART.md** (6 KB, 5 min read)

### For Complete Guide

→ Read: **README.md** (8.7 KB, 15 min read)

### For Deployment Details

→ Read: **DOCKER_DEPLOYMENT_GUIDE.md** (12 KB, 20 min read)

### For All Files Created

→ Read: **FILES_MANIFEST.md** (12 KB)

### For Feature Overview

→ Read: **IMPLEMENTATION_SUMMARY.md** (11 KB)

## File Structure

```
training/
├── Core Docker Files
│   ├── Dockerfile                    # Container definition
│   ├── docker-compose.training.yml   # Orchestration config
│   └── .dockerignore                 # Build optimization
│
├── Training & Scripts
│   ├── train_lora.py                # Training implementation
│   ├── docker-entrypoint.sh         # Container startup
│   ├── requirements.txt             # Python dependencies
│   └── config.json                  # Training configuration
│
├── Helper Scripts
│   ├── build.sh                     # Build Docker image
│   ├── run.sh                       # Run training
│   └── health-check.sh              # Monitor health
│
└── Documentation
    ├── START_HERE.md                # This file
    ├── QUICKSTART.md                # Quick start guide
    ├── README.md                    # Full documentation
    ├── DOCKER_DEPLOYMENT_GUIDE.md   # Deployment guide
    ├── FILES_MANIFEST.md            # Complete file listing
    └── IMPLEMENTATION_SUMMARY.md    # Feature overview
```

## Key Commands Cheat Sheet

```bash
# Build image
./build.sh

# Run training (foreground)
./run.sh

# Run training (background)
./run.sh --background

# View logs
docker compose -f docker-compose.training.yml logs -f

# Stop training
docker compose -f docker-compose.training.yml down

# Check health
./health-check.sh

# Clean up
docker image rm multi-modal-studio/training:latest
```

## Customize Training

Edit `config.json` to adjust:

```json
{
  "model_name": "meta-llama/Llama-2-7b",  # Which model to fine-tune
  "learning_rate": 0.0001,                 # Training speed
  "num_train_epochs": 3,                   # Number of training passes
  "per_device_train_batch_size": 8,        # Batch size (lower if OOM)
  "lora_r": 8,                            # LoRA adaptation rank
  "use_4bit": true                        # Quantization (saves memory)
}
```

## Common Issues & Quick Fixes

| Problem          | Solution                                                                         |
| ---------------- | -------------------------------------------------------------------------------- |
| GPU not detected | Run: `docker run --rm --gpus all nvidia/cuda:12.1.0-base-ubuntu22.04 nvidia-smi` |
| Out of memory    | Reduce `per_device_train_batch_size` to 4 in config.json                         |
| Build fails      | Check Docker is running: `docker ps`                                             |
| Slow training    | Increase batch size (if memory allows) or enable flash attention                 |

## What Gets Created

After training completes, you'll find:

```
../public/outputs/
├── final_model/                 # Your trained LoRA model
│   ├── adapter_config.json
│   ├── adapter_model.bin
│   └── tokenizer files
├── checkpoints/                 # Intermediate checkpoints
├── logs/                        # Training logs
└── config.json                  # Training configuration used
```

## GPU Memory Requirements

| Model       | Min GPU Memory | Recommended |
| ----------- | -------------- | ----------- |
| Llama 2 7B  | 16 GB          | 24 GB       |
| Llama 2 13B | 24 GB          | 32 GB       |
| Llama 2 70B | 48 GB          | 80 GB       |

(Sizes with 4-bit quantization enabled)

## Health Check Endpoints

When training is running, you can query:

```bash
# Simple health check
curl http://localhost:8080/health

# Training metrics
curl http://localhost:8080/metrics

# Detailed status
curl http://localhost:8080/status
```

## Background Training (Optional)

Run training without blocking terminal:

```bash
# Start in background
./run.sh --background

# Check status anytime
./health-check.sh

# View logs anytime
docker compose -f docker-compose.training.yml logs -f

# Stop when done
docker compose -f docker-compose.training.yml down
```

## Before You Start

Ensure you have:

- Docker installed: `docker --version`
- NVIDIA Container Toolkit working: GPU access via Docker
- At least 16GB GPU memory (24GB recommended)
- 32GB system RAM
- 100GB disk space (for models and outputs)

## Deployment Workflow

```
1. Verify prerequisites ✓
   └─ Docker, GPU access, disk space

2. Navigate to training directory ✓
   └─ cd training/

3. Configure training ✓
   └─ Edit config.json

4. Build Docker image ✓
   └─ ./build.sh

5. Start training ✓
   └─ ./run.sh

6. Monitor progress ✓
   └─ ./health-check.sh

7. Retrieve results ✓
   └─ Access ../public/outputs/

8. Clean up ✓
   └─ docker compose down
```

## Documentation Map

```
START_HERE.md (You are here)
    ↓
QUICKSTART.md ← Start here if you want 5-min setup
    ↓
README.md ← Full documentation with all details
    ↓
DOCKER_DEPLOYMENT_GUIDE.md ← For production deployment
    ↓
FILES_MANIFEST.md ← Complete file reference
    ↓
IMPLEMENTATION_SUMMARY.md ← Technical details
```

## Architecture at a Glance

```
Your GPU
    ↓
NVIDIA CUDA 12.1 + cuDNN 8
    ↓
Docker Container
    ├─ Python 3.10
    ├─ PyTorch 2.1.2
    ├─ Training Script
    └─ Health Check Server (port 8080)
    ↓
Volume Mounts
├─ Input: datasets (read-only)
├─ Output: results (read-write)
├─ Cache: models (read-write)
└─ Config: training config (read-only)
```

## Next Actions

**Choose one:**

### Option A: Jump Right In (5 min)

```bash
cd /Users/nick/Projects/Multi-Modal\ Generation\ Studio/training/
./build.sh
./run.sh
```

### Option B: Learn First (15 min)

1. Read QUICKSTART.md
2. Edit config.json to your needs
3. Run the commands above

### Option C: Full Understanding (30 min)

1. Read README.md thoroughly
2. Review DOCKER_DEPLOYMENT_GUIDE.md
3. Customize docker-compose.training.yml if needed
4. Run training

## Getting Help

- **Quick Questions**: See QUICKSTART.md
- **How Do I...?**: See README.md (has full troubleshooting)
- **Production Deployment**: See DOCKER_DEPLOYMENT_GUIDE.md
- **All Available Files**: See FILES_MANIFEST.md
- **Technical Implementation**: See IMPLEMENTATION_SUMMARY.md

## Success Checklist

After running `./build.sh`:

- [ ] Docker image built successfully
- [ ] Image name: `multi-modal-studio/training:latest`

After running `./run.sh`:

- [ ] Container starts without errors
- [ ] CUDA is available in container
- [ ] Health check passes (endpoint returns 200)
- [ ] Training begins and shows progress

## Performance Tips

1. **First run**: GPU will download the model (~7-13GB). Be patient.
2. **GPU memory**: Start with batch_size=8, reduce if OOM errors
3. **Faster training**: Increase batch_size (if memory allows)
4. **Save space**: Enable 4-bit quantization (already default)

## Important Paths

```
Training directory:
/Users/nick/Projects/Multi-Modal Generation Studio/training/

Datasets (create if needed):
/Users/nick/Projects/Multi-Modal Generation Studio/public/datasets/

Outputs (will be created):
/Users/nick/Projects/Multi-Modal Generation Studio/public/outputs/

Model cache (automatic):
~/.cache/huggingface/
```

## The Files You Got

**Docker Files** (3):

- Dockerfile - Container definition
- docker-compose.training.yml - Orchestration
- .dockerignore - Build optimization

**Scripts** (4):

- train_lora.py - Training implementation
- docker-entrypoint.sh - Container startup
- build.sh - Build helper
- run.sh, health-check.sh - Runtime helpers

**Config** (3):

- config.json - Training configuration
- requirements.txt - Python dependencies
- .env.training - Environment variables

**Documentation** (6):

- README.md - Complete guide
- QUICKSTART.md - Quick start
- DOCKER_DEPLOYMENT_GUIDE.md - Deployment
- FILES_MANIFEST.md - File reference
- IMPLEMENTATION_SUMMARY.md - Technical details
- START_HERE.md - This file

## Ready to Go?

```bash
cd /Users/nick/Projects/Multi-Modal\ Generation\ Studio/training/
./build.sh && ./run.sh
```

Your training will start immediately!

---

**Version**: 1.0.0
**Created**: 2024-01-18
**Status**: Ready to Use
**Next Step**: Run `./build.sh` then `./run.sh`
