# Deployment Checklist

Complete this checklist before starting training.

## Prerequisites

- [ ] Docker installed (`docker --version`)
- [ ] NVIDIA Container Toolkit installed
- [ ] GPU access works: `docker run --rm --gpus all nvidia/cuda:12.1.0-base-ubuntu22.04 nvidia-smi`
- [ ] Minimum 16GB GPU memory available
- [ ] At least 100GB free disk space
- [ ] 32GB+ system RAM

## Project Setup

- [ ] Located in correct directory: `/Users/nick/Projects/Multi-Modal Generation Studio/training/`
- [ ] All 17 files present (verify with `ls -la`)
- [ ] Executable scripts have correct permissions (build.sh, run.sh, health-check.sh)
- [ ] config.json is readable and valid JSON

## Directory Structure

- [ ] `/training/` exists with all files
- [ ] `../public/datasets/` created (for input data)
- [ ] `../public/outputs/` created (will receive outputs)
- [ ] `~/.cache/huggingface/` exists (model cache)

## Configuration

- [ ] Reviewed config.json
- [ ] Model name is valid
- [ ] Batch size is appropriate for GPU
- [ ] Learning rate is reasonable (typically 1e-4 to 1e-3)
- [ ] Output directory is set correctly

## Building

- [ ] Docker image builds without errors: `./build.sh`
- [ ] Image created: `docker images | grep multi-modal-studio/training`
- [ ] Image size is reasonable (~2-3GB)

## Pre-Training

- [ ] Dataset prepared (if custom dataset)
- [ ] Volume mount paths are correct
- [ ] Health check script works: `./health-check.sh`
- [ ] Container runs without GPU errors

## Training Readiness

- [ ] Configuration is finalized
- [ ] GPU is available and detected
- [ ] Sufficient disk space available
- [ ] No conflicting services on port 8080
- [ ] Backup of important configs created

## Go/No-Go Decision

- [ ] All prerequisites met: YES / NO
- [ ] All setup complete: YES / NO
- [ ] All configuration verified: YES / NO
- [ ] Ready to start training: YES / NO

## Start Training

When all items are checked:

```bash
cd /Users/nick/Projects/Multi-Modal\ Generation\ Studio/training/
./run.sh
```

## During Training

- [ ] Monitoring terminal open: `./health-check.sh`
- [ ] Log monitoring terminal open: `docker compose -f docker-compose.training.yml logs -f`
- [ ] GPU memory usage reasonable
- [ ] No CUDA out of memory errors
- [ ] Training loss decreasing

## Post-Training

- [ ] Training completed successfully
- [ ] Final model saved in outputs/
- [ ] Results collected and backed up
- [ ] Container stopped gracefully
- [ ] Resources cleaned up if needed

## Troubleshooting

If issues occur:

1. Check logs: `docker compose -f docker-compose.training.yml logs`
2. Verify GPU: `nvidia-smi`
3. Review config: `cat config.json`
4. See README.md troubleshooting section
5. See QUICKSTART.md for quick fixes

---

**Checklist Version**: 1.0
**Created**: 2024-01-18
