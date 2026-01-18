#!/bin/bash
set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}LoRA Training Container Initialization${NC}"
echo -e "${BLUE}=====================================${NC}"

# Check CUDA availability
echo -e "${YELLOW}Checking CUDA availability...${NC}"
python3 << 'PYTHON_SCRIPT'
import torch
import os

print(f"PyTorch version: {torch.__version__}")
print(f"CUDA available: {torch.cuda.is_available()}")

if torch.cuda.is_available():
    print(f"CUDA version: {torch.version.cuda}")
    print(f"cuDNN version: {torch.backends.cudnn.version()}")
    print(f"Number of GPUs: {torch.cuda.device_count()}")
    for i in range(torch.cuda.device_count()):
        print(f"  GPU {i}: {torch.cuda.get_device_name(i)}")
        props = torch.cuda.get_device_properties(i)
        print(f"    Memory: {props.total_memory / 1e9:.2f} GB")
else:
    print("WARNING: CUDA is not available!")
    exit(1)
PYTHON_SCRIPT

if [ $? -ne 0 ]; then
    echo -e "${RED}CUDA check failed!${NC}"
    exit 1
fi

echo -e "${GREEN}CUDA check passed!${NC}"

# Check HuggingFace cache directory
echo -e "${YELLOW}Setting up Hugging Face cache...${NC}"
if [ ! -d /workspace/models ]; then
    echo -e "${YELLOW}Creating models directory...${NC}"
    mkdir -p /workspace/models
fi

# Verify required directories exist
echo -e "${YELLOW}Verifying required directories...${NC}"
for dir in /workspace/datasets /workspace/outputs /workspace/logs; do
    if [ ! -d "$dir" ]; then
        echo -e "${YELLOW}Creating $dir...${NC}"
        mkdir -p "$dir"
    fi
    echo -e "${GREEN}✓ $dir exists${NC}"
done

# Check config file
if [ ! -f /workspace/config.json ]; then
    echo -e "${YELLOW}Config file not found at /workspace/config.json${NC}"
    echo -e "${YELLOW}Creating default configuration...${NC}"
    cat > /workspace/config.json << 'CONFIG'
{
  "model_name": "meta-llama/Llama-2-7b",
  "learning_rate": 1e-4,
  "num_train_epochs": 3,
  "per_device_train_batch_size": 8,
  "per_device_eval_batch_size": 8,
  "warmup_steps": 100,
  "weight_decay": 0.01,
  "output_dir": "/workspace/outputs",
  "dataset_path": "/workspace/datasets",
  "lora_r": 8,
  "lora_alpha": 16,
  "lora_dropout": 0.05,
  "target_modules": ["q_proj", "v_proj"]
}
CONFIG
    echo -e "${GREEN}Default configuration created at /workspace/config.json${NC}"
fi

# Start health check HTTP server in background
echo -e "${YELLOW}Starting health check server...${NC}"
python3 << 'HEALTH_SERVER' &
from http.server import HTTPServer, BaseHTTPRequestHandler
import torch

class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/health':
            status = 'OK' if torch.cuda.is_available() else 'CUDA_NOT_AVAILABLE'
            self.send_response(200 if torch.cuda.is_available() else 503)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(f"Status: {status}\n".encode())
        elif self.path == '/metrics':
            if torch.cuda.is_available():
                props = torch.cuda.get_device_properties(0)
                memory = torch.cuda.get_device_properties(0).total_memory / 1e9
                self.send_response(200)
                self.send_header('Content-type', 'text/plain')
                self.end_headers()
                response = f"GPU Memory: {memory:.2f} GB\nCUDA Available: True\n"
                self.wfile.write(response.encode())
            else:
                self.send_response(503)
                self.end_headers()
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        return  # Suppress default logging

try:
    server = HTTPServer(('0.0.0.0', 8080), HealthHandler)
    server.serve_forever()
except Exception as e:
    print(f"Health server error: {e}")
HEALTH_SERVER

echo -e "${GREEN}Health check server started on port 8080${NC}"

# Print container info
echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}Container Information${NC}"
echo -e "${BLUE}=====================================${NC}"
echo -e "Working Directory: $(pwd)"
echo -e "User: $(whoami)"
echo -e "Python Version: $(python3 --version)"
echo -e "Disk Space:"
df -h /workspace | tail -1 | awk '{print "  Total: " $2 ", Used: " $3 ", Available: " $4}'
echo -e "${BLUE}=====================================${NC}\n"

# Execute the main training command
echo -e "${YELLOW}Starting training...${NC}"
exec "$@"
