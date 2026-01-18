# LoRA Training Wrapper

A Python wrapper script for Low-Rank Adaptation (LoRA) training on Stable Diffusion models using diffusers and PEFT libraries.

## Features

- **JSON-based Configuration**: Easy-to-use JSON config file format
- **Progress Streaming**: Real-time training progress via JSON lines output
- **Checkpoint Management**: Automatic checkpoint saving at configurable intervals
- **GPU Support**: CUDA GPU detection and VRAM estimation
- **Graceful Shutdown**: SIGTERM/SIGINT signal handling for safe training interruption
- **Validation**: Comprehensive config and environment validation
- **Multi-Model Support**: Works with Stable Diffusion 1.5, 2.1, and SDXL models

## Installation

### Prerequisites

- Python 3.10+
- CUDA 11.8+ (for GPU support)
- 8GB+ VRAM (for batch_size=1)

### Setup

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

## Configuration

### Config File Format

Create a JSON config file (see `example_config.json`):

```json
{
  "dataset_path": "/path/to/training/images",
  "base_model": "stabilityai/stable-diffusion-xl-base-1.0",
  "output_path": "/path/to/output",
  "trigger_words": ["sks", "photo"],
  "training_params": {
    "learning_rate": 1e-4,
    "batch_size": 1,
    "epochs": 10,
    "steps": 1000,
    "resolution": 512,
    "lora_rank": 16,
    "lora_alpha": 32,
    "checkpoint_steps": 500,
    "validation_steps": 100,
    "gradient_accumulation_steps": 1
  }
}
```

### Configuration Parameters

#### Required Fields

- **dataset_path** (string): Path to directory containing training images (.jpg, .png)
- **base_model** (string): HuggingFace model ID or local path
  - Examples: `stabilityai/stable-diffusion-xl-base-1.0`, `runwayml/stable-diffusion-v1-5`
- **output_path** (string): Directory for saving checkpoints and results
- **trigger_words** (array): List of trigger words for the LoRA (minimum 1)

#### Optional Training Parameters

- **learning_rate** (float): Learning rate for training [default: 1e-4]
  - Typical range: 1e-5 to 1e-3
- **batch_size** (integer): Training batch size [default: 1]
  - Increase for faster training if VRAM allows
- **epochs** (integer): Number of training epochs [default: 10]
- **steps** (integer): Total training steps [default: 1000]
- **resolution** (integer): Training image resolution in pixels [default: 512]
  - Range: 256-2048
- **lora_rank** (integer): LoRA rank (r) parameter [default: 16]
  - Higher = more trainable parameters, typically 4-64
- **lora_alpha** (integer): LoRA alpha (scaling) parameter [default: 32]
  - Usually 2x the rank value
- **checkpoint_steps** (integer): Save checkpoint every N steps [default: 500]
- **validation_steps** (integer): Generate samples every N steps [default: 100]
- **gradient_accumulation_steps** (integer): Gradient accumulation steps [default: 1]
  - Useful for simulating larger batch sizes on limited VRAM

### Supported Base Models

- **Stable Diffusion XL**: `stabilityai/stable-diffusion-xl-base-1.0`
- **Stable Diffusion 2.1**: `stabilityai/stable-diffusion-2-1`
- **Stable Diffusion 1.5**: `runwayml/stable-diffusion-v1-5`
- **Local Models**: Provide full path to local checkpoint directory

## Usage

### Basic Training

```bash
python train_lora.py --config config.json
```

### Validation Only

Validate config without starting training:

```bash
python train_lora.py --config config.json --validate-only
```

### Debug Mode

Enable debug logging:

```bash
python train_lora.py --config config.json --debug
```

## Output Format

The script outputs JSON lines to stdout for easy parsing:

### Progress Events

```json
{
  "type": "progress",
  "step": 100,
  "total_steps": 1000,
  "loss": 0.245,
  "percent": 10,
  "timestamp": "2024-01-18T12:34:56.789Z"
}
```

### Checkpoint Events

```json
{
  "type": "checkpoint",
  "step": 500,
  "path": "/output/checkpoints/lora_step_500.safetensors",
  "timestamp": "2024-01-18T12:35:12.123Z"
}
```

### Sample Generation Events

```json
{
  "type": "sample",
  "step": 100,
  "image_path": "/output/samples/step_100.png",
  "timestamp": "2024-01-18T12:35:20.456Z"
}
```

### Completion Event

```json
{
  "type": "complete",
  "final_path": "/output/lora_final.safetensors",
  "total_time": 3600.5,
  "step": 1000,
  "timestamp": "2024-01-18T12:36:00.789Z"
}
```

### Error Events

```json
{
  "type": "error",
  "message": "Out of memory",
  "step": 350,
  "timestamp": "2024-01-18T12:34:45.123Z"
}
```

### Interruption Events

```json
{
  "type": "interrupted",
  "step": 750,
  "message": "Training interrupted by signal 15",
  "timestamp": "2024-01-18T12:35:30.456Z"
}
```

## Output Directory Structure

After training, the output directory contains:

```
output_path/
├── checkpoints/
│   ├── lora_step_500.safetensors
│   ├── lora_step_1000.safetensors
│   └── ...
├── samples/
│   ├── step_100.png
│   ├── step_200.png
│   └── ...
└── lora_final.safetensors
```

## Dataset Preparation

### Image Organization

1. Create a directory with training images:

   ```
   dataset/
   ├── image1.jpg
   ├── image2.png
   └── ...
   ```

2. Supported formats: JPEG, PNG
3. Recommended image count: 20-100 images for good results
4. Image resolution: Will be resized to configured resolution

### Captions (Optional for SDXL)

For best results with SDXL, provide captions with matching filenames:

```
dataset/
├── image1.jpg
├── image1.txt  (contains caption for image1)
├── image2.png
└── image2.txt  (contains caption for image2)
```

## Monitoring Training

### Parsing JSON Output

Process output in a shell script:

```bash
python train_lora.py --config config.json | while IFS= read -r line; do
  event_type=$(echo "$line" | jq -r '.type')
  case "$event_type" in
    progress)
      step=$(echo "$line" | jq '.step')
      loss=$(echo "$line" | jq '.loss')
      echo "Step $step: Loss=$loss"
      ;;
    error)
      message=$(echo "$line" | jq -r '.message')
      echo "ERROR: $message"
      ;;
    complete)
      echo "Training complete!"
      ;;
  esac
done
```

### Python Integration

```python
import subprocess
import json

process = subprocess.Popen(
    ["python", "train_lora.py", "--config", "config.json"],
    stdout=subprocess.PIPE,
    text=True
)

for line in process.stdout:
    event = json.loads(line)
    print(f"[{event['type']}] {event}")
```

## Signal Handling

Training can be gracefully interrupted using signals:

```bash
# Send SIGTERM
kill -TERM <pid>

# Or Ctrl+C in terminal (SIGINT)
```

The trainer will:

1. Emit an interrupted event
2. Save final checkpoint
3. Clean shutdown

## Troubleshooting

### Out of Memory (OOM)

**Symptom**: `CUDA out of memory` error

**Solutions**:

- Reduce `batch_size` (try 1)
- Reduce `resolution` (try 512 or lower)
- Enable `gradient_accumulation_steps`
- Use lower `lora_rank` (try 8)

### Model Not Found

**Symptom**: Model download or loading fails

**Solutions**:

- Check internet connection
- Ensure sufficient disk space (~4-8GB per model)
- Set HF token: `huggingface-cli login`
- Use local model path

### Slow Training

**Symptom**: Training takes very long

**Causes**:

- Using CPU instead of GPU
- Large `resolution` setting
- Small `batch_size`

**Solutions**:

- Verify GPU usage: `nvidia-smi`
- Reduce `resolution`
- Increase `batch_size` if VRAM allows

## Advanced Usage

### Docker

Build and run in Docker:

```dockerfile
FROM nvidia/cuda:11.8.0-runtime-ubuntu22.04

WORKDIR /workspace
COPY requirements.txt .
RUN apt-get update && apt-get install -y python3 python3-pip
RUN pip install -r requirements.txt

COPY training/ .
CMD ["python", "train_lora.py", "--config", "/config/config.json"]
```

```bash
docker build -t lora-trainer .
docker run --gpus all -v /data:/data lora-trainer
```

### Integration with External Services

Monitor training via HTTP polling (optional health check server):

```python
import requests

# Query training status (if health server enabled)
response = requests.get("http://localhost:8080/status")
status = response.json()
print(f"Training: {status['is_training']}, Step: {status['current_step']}")
```

## Performance Tips

1. **Dataset Size**: 20-100 images typically sufficient
2. **Learning Rate**: Start with 1e-4, adjust based on loss curve
3. **LoRA Rank**: Rank 16-32 good balance of quality/speed
4. **Batch Size**: Larger batches (if VRAM allows) for faster training
5. **Steps**: 500-1000 steps usually sufficient for good results

## Configuration Schema

See `config_schema.json` for full JSON schema validation rules.

## License

This wrapper script is provided as-is for use with the Multi-Modal Generation Studio.

## References

- [PEFT Documentation](https://huggingface.co/docs/peft/)
- [Diffusers Documentation](https://huggingface.co/docs/diffusers/)
- [Kohya SS Scripts](https://github.com/kohya-ss/sd-scripts)
