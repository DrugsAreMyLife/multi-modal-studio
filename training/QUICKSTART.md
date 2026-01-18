# LoRA Training - Quick Start Guide

Get started with LoRA fine-tuning in minutes!

## Prerequisites Checklist

- Docker installed: `docker --version`
- NVIDIA Container Toolkit: `docker run --rm --gpus all nvidia/cuda:12.1.0-base-ubuntu22.04 nvidia-smi`
- At least 16GB GPU memory
- 32GB system RAM recommended

If any prerequisite is missing, see the full [README.md](README.md) for detailed installation.

## 5-Minute Setup

### 1. Verify GPU Access (2 min)

```bash
# Test GPU access in Docker
docker run --rm --gpus all nvidia/cuda:12.1.0-base-ubuntu22.04 nvidia-smi

# Expected output: GPU information from nvidia-smi
```

### 2. Build Docker Image (5-10 min)

```bash
cd training/
./build.sh

# Or use Docker Compose directly:
docker compose -f docker-compose.training.yml build
```

### 3. Verify Configuration (1 min)

```bash
# Review default config
cat config.json

# Edit if needed
nano config.json  # or use your editor
```

### 4. Start Training (1 min)

```bash
# Option A: Run in foreground (see real-time logs)
./run.sh

# Option B: Run in background
./run.sh --background

# View logs anytime
docker compose -f docker-compose.training.yml logs -f
```

### 5. Monitor Training (Real-time)

```bash
# In another terminal, run health check
./health-check.sh

# Or check GPU usage
watch -n 1 'docker exec $(docker compose -f docker-compose.training.yml ps -q) nvidia-smi'
```

## Configuration

Edit `config.json` to customize training:

```json
{
  "model_name": "meta-llama/Llama-2-7b",      # Model to fine-tune
  "learning_rate": 0.0001,                    # Training learning rate
  "num_train_epochs": 3,                      # Number of epochs
  "per_device_train_batch_size": 8,           # Batch size
  "lora_r": 8,                                # LoRA rank
  "lora_alpha": 16,                           # LoRA alpha
  "use_4bit": true                            # Enable 4-bit quantization
}
```

### Quick Config Templates

**Small Model (7B) - 16GB GPU:**

```json
{
  "model_name": "meta-llama/Llama-2-7b",
  "per_device_train_batch_size": 8,
  "use_4bit": true,
  "max_seq_length": 2048
}
```

**Medium Model (13B) - 24GB GPU:**

```json
{
  "model_name": "meta-llama/Llama-2-13b",
  "per_device_train_batch_size": 4,
  "use_4bit": true,
  "gradient_accumulation_steps": 2
}
```

**Large Model (70B) - A100/H100:**

```json
{
  "model_name": "meta-llama/Llama-2-70b",
  "per_device_train_batch_size": 2,
  "use_8bit": true,
  "gradient_accumulation_steps": 4,
  "max_seq_length": 1024
}
```

## Common Tasks

### Check Training Status

```bash
# Health check endpoints
curl http://localhost:8080/health
curl http://localhost:8080/metrics
curl http://localhost:8080/status
```

### View Real-time Logs

```bash
docker compose -f docker-compose.training.yml logs -f
docker compose -f docker-compose.training.yml logs -f --tail=100  # Last 100 lines
```

### Stop Training

```bash
# Graceful shutdown
docker compose -f docker-compose.training.yml down

# Or press Ctrl+C in foreground mode
```

### Access Training Outputs

```bash
# Outputs are saved to:
../public/outputs/

# Models are saved to:
../public/outputs/final_model/

# View files
ls -la ../public/outputs/
```

### GPU Memory Issues

**Reduce batch size:**

```json
"per_device_train_batch_size": 4
```

**Enable 4-bit quantization:**

```json
"use_4bit": true
```

**Reduce sequence length:**

```json
"max_seq_length": 1024
```

### Slow Training

**Increase batch size** (if GPU memory allows):

```json
"per_device_train_batch_size": 16
```

**Increase data loader workers:**
Edit `train_lora.py` and change `dataloader_num_workers` from 4 to 8

**Enable flash attention:**

```json
"use_flash_attention": true
```

## Troubleshooting

### GPU Not Detected

```bash
# Verify NVIDIA Container Toolkit
docker run --rm --gpus all nvidia/cuda:12.1.0-base-ubuntu22.04 nvidia-smi

# If it fails, reinstall:
# Ubuntu:
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list
sudo apt-get update && sudo apt-get install -y nvidia-container-toolkit
sudo systemctl restart docker
```

### CUDA Out of Memory

```bash
# Reduce batch size in config.json
"per_device_train_batch_size": 4

# Enable quantization
"use_4bit": true

# Reduce max sequence length
"max_seq_length": 1024
```

### Model Download Fails

```bash
# Set Hugging Face token (if using gated models)
docker compose -f docker-compose.training.yml up \
  -e HF_TOKEN=your_token_here

# Or pre-download the model:
docker run --rm -v ~/.cache/huggingface:/workspace/models \
  multi-modal-studio/training:latest \
  python -c "from transformers import AutoModel; AutoModel.from_pretrained('meta-llama/Llama-2-7b')"
```

### Container Crashes Immediately

```bash
# Check logs
docker compose -f docker-compose.training.yml logs

# Verify config.json is valid
python3 -m json.tool config.json

# Run with debugging
docker compose -f docker-compose.training.yml run training /bin/bash
```

## Advanced Usage

### Use Custom Dataset

1. Place your dataset in `../public/datasets/`
2. Update `config.json`:

```json
{
  "dataset_name": "custom_dataset",
  "dataset_config": "your_config"
}
```

3. Implement custom dataset loading in `train_lora.py`

### Multi-GPU Training

```bash
# Modify docker-compose.training.yml:
environment:
  - CUDA_VISIBLE_DEVICES=0,1
  - WORLD_SIZE=2
```

### Monitor with Weights & Biases

```bash
# Add to docker-compose.training.yml environment:
- WANDB_API_KEY=your_key_here
- WANDB_PROJECT=lora-training

# Logs will be sent to wandb.ai
```

### Custom Training Script

```bash
# Copy your script into container
docker compose -f docker-compose.training.yml run training \
  -v $(pwd)/my_train.py:/workspace/my_train.py \
  python my_train.py
```

## Next Steps

1. Review full [README.md](README.md) for advanced configurations
2. Check [QUICKSTART.md](QUICKSTART.md) for more examples
3. Explore model outputs in `../public/outputs/`
4. Adjust hyperparameters and retrain

## Support Resources

- PyTorch: https://pytorch.org/docs
- Hugging Face: https://huggingface.co/docs
- PEFT (LoRA): https://huggingface.co/docs/peft
- Docker: https://docs.docker.com

## Tips for Success

- Start with smaller models (7B) to validate setup
- Use 4-bit quantization to reduce memory usage
- Monitor GPU memory with `nvidia-smi`
- Save checkpoints frequently (already configured)
- Use gradient accumulation for larger effective batch sizes
- Enable flash attention for faster training (on compatible GPUs)

Happy training!
