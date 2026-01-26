# LoRA Training Wrapper - Quick Start Guide

## Installation (5 minutes)

```bash
# Navigate to training directory
cd /Users/nick/Projects/Multi-Modal\ Generation\ Studio/training

# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Verify installation
python3 -m pip list | grep -E "torch|diffusers|peft"
```

## Basic Usage (10 minutes)

### Step 1: Prepare Dataset

```bash
# Create dataset directory with your images
mkdir -p /path/to/your/dataset
# Copy your training images (JPG or PNG) here
```

### Step 2: Create Config File

```bash
# Copy example config
cp example_config.json my_training_config.json

# Edit config with your settings
# - dataset_path: your dataset directory
# - base_model: model to fine-tune
# - output_path: where to save results
# - trigger_words: keywords for the LoRA
```

### Step 3: Validate Config

```bash
python3 train_lora.py --config my_training_config.json --validate-only
```

### Step 4: Start Training

```bash
python3 train_lora.py --config my_training_config.json
```

## Example Config (my_training_config.json)

```json
{
  "dataset_path": "/path/to/your/dataset",
  "base_model": "stabilityai/stable-diffusion-xl-base-1.0",
  "output_path": "/path/to/outputs",
  "trigger_words": ["myname", "photo"],
  "training_params": {
    "learning_rate": 1e-4,
    "batch_size": 1,
    "steps": 1000,
    "resolution": 512,
    "lora_rank": 16,
    "lora_alpha": 32,
    "checkpoint_steps": 500
  }
}
```

## Monitoring Progress

The script outputs JSON events to stdout:

```bash
# View live progress (readable)
python3 train_lora.py --config config.json | jq '.type, .step, .loss'

# Save to file and process later
python3 train_lora.py --config config.json > training.jsonl

# Parse in Python
python3 << 'PYTHON'
import json
with open("training.jsonl") as f:
    for line in f:
        event = json.loads(line)
        if event["type"] == "progress":
            print(f"Step {event['step']}: Loss {event['loss']:.4f}")
PYTHON
```

## Understanding Output Events

| Type          | Meaning                 | Example                                               |
| ------------- | ----------------------- | ----------------------------------------------------- |
| `progress`    | Training step completed | `step: 100, loss: 0.245`                              |
| `checkpoint`  | Model saved             | `path: /output/checkpoints/lora_step_500.safetensors` |
| `sample`      | Sample image generated  | `image_path: /output/samples/step_100.png`            |
| `complete`    | Training finished       | `final_path: /output/lora_final.safetensors`          |
| `error`       | Error occurred          | `message: Out of memory`                              |
| `interrupted` | User stopped training   | `step: 750`                                           |

## Files Created After Training

```
output_path/
├── checkpoints/          # Intermediate checkpoints
│   ├── lora_step_500.safetensors
│   └── lora_step_1000.safetensors
├── samples/              # Generated sample images
│   ├── step_100.png
│   └── step_200.png
└── lora_final.safetensors  # Final trained model
```

## Common Issues & Solutions

### Out of Memory (OOM)

```python
# Reduce batch size in config
"batch_size": 1  # Already minimum

# Or reduce resolution
"resolution": 512  # Try 256 or 384

# Or add gradient accumulation
"gradient_accumulation_steps": 2
```

### CUDA Not Found

```bash
# Check GPU
nvidia-smi

# If not found, use CPU (very slow)
# Script will automatically detect and warn
```

### Config File Not Found

```bash
# Check file path
ls -la /path/to/config.json

# Use absolute path, not relative
pwd  # Get current directory
```

### Model Not Downloading

```bash
# Check disk space (need ~8GB per model)
df -h /home

# Login to Hugging Face
huggingface-cli login

# Set cache directory
export HF_HOME=/path/to/cache
```

## Docker Usage

### Build Container

```bash
docker build -t lora-trainer .
```

### Run Training

```bash
docker run --gpus all \
  -v /path/to/dataset:/data/datasets \
  -v /path/to/outputs:/data/outputs \
  -v $(pwd)/config.json:/config/config.json \
  lora-trainer --config /config/config.json
```

## Performance Tips

### For Faster Training

- Use larger `batch_size` if GPU allows (2-4)
- Increase `learning_rate` slightly (1e-3 to 5e-4)
- Reduce `validation_steps` to save time
- Use newer GPU model (RTX 4090 vs 3090)

### For Better Quality

- Use more training images (50-100+)
- Train more steps (1000-5000)
- Use smaller `learning_rate` (5e-5 to 1e-4)
- Increase `lora_rank` (32-64)
- Higher `resolution` (768-1024)

### For Lower VRAM Usage

- Reduce `batch_size` to 1
- Reduce `resolution` to 256
- Enable `gradient_accumulation_steps`
- Reduce `lora_rank` to 8-16

## Next Steps

1. **Read Full Docs**: See `README.md` for complete documentation
2. **Run Tests**: `python3 test_trainer.py` to verify setup
3. **Check Examples**: See `example_config.json` for all options
4. **Join Community**: Look for Stable Diffusion forums/Discord

## Support Resources

- **Diffusers Docs**: https://huggingface.co/docs/diffusers/
- **PEFT Docs**: https://huggingface.co/docs/peft/
- **Model Hub**: https://huggingface.co/models

## Configuration Quick Reference

```json
{
  "dataset_path": "REQUIRED - Path to images",
  "base_model": "REQUIRED - HF model ID or path",
  "output_path": "REQUIRED - Where to save output",
  "trigger_words": "REQUIRED - List of trigger words",

  "learning_rate": 0.0001, // Lower = slower but better
  "batch_size": 1, // Higher = faster but uses VRAM
  "epochs": 10, // Training passes (or use steps)
  "steps": 1000, // Total training steps
  "resolution": 512, // Image size (256-2048)
  "lora_rank": 16, // Lower rank = faster
  "lora_alpha": 32, // Usually 2x rank
  "checkpoint_steps": 500, // Save every N steps
  "validation_steps": 100, // Sample every N steps
  "gradient_accumulation_steps": 1 // For large batch simulation
}
```

---

For more details, see:

- `README.md` - Full documentation
- `config_schema.json` - All available options
- `example_config.json` - Example configuration
- `train_lora.py` - Source code with docstrings
