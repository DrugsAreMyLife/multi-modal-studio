#!/bin/bash
# Build script for LoRA training Docker image

set -e

PROJECT_ROOT=$(cd "$(dirname "$0")" && pwd)
cd "$PROJECT_ROOT"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Building LoRA Training Docker Image${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Check if Docker is running
if ! docker ps > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker daemon is not running${NC}"
    exit 1
fi

# Check if Dockerfile exists
if [ ! -f "Dockerfile" ]; then
    echo -e "${RED}Error: Dockerfile not found in current directory${NC}"
    exit 1
fi

echo -e "${YELLOW}Building image: multi-modal-studio/training:latest${NC}"
echo -e "${YELLOW}Dockerfile: $PROJECT_ROOT/Dockerfile${NC}\n"

# Build with BuildKit for better caching
export DOCKER_BUILDKIT=1

docker compose -f docker-compose.training.yml build \
    --no-cache \
    --progress=plain

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}Build completed successfully!${NC}"
    
    # Display image info
    echo -e "\n${BLUE}Image Information:${NC}"
    docker images | grep "multi-modal-studio/training" || echo "Image not found"
    
    echo -e "\n${BLUE}Next steps:${NC}"
    echo -e "  1. Review config.json for training parameters"
    echo -e "  2. Prepare your dataset in public/datasets/ directory"
    echo -e "  3. Run training: docker compose -f docker-compose.training.yml up"
    
else
    echo -e "\n${RED}Build failed!${NC}"
    exit 1
fi
