#!/bin/bash
# Run script for LoRA training

set -e

PROJECT_ROOT=$(cd "$(dirname "$0")" && pwd)
cd "$PROJECT_ROOT"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}LoRA Training Runner${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Default values
MODE="foreground"
CONFIG_FILE="config.json"
BACKGROUND=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -b|--background)
            MODE="background"
            BACKGROUND=true
            shift
            ;;
        -c|--config)
            CONFIG_FILE="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -b, --background    Run in background (detached)"
            echo "  -c, --config FILE   Use custom config file (default: config.json)"
            echo "  -h, --help         Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! docker compose --version > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker Compose is not installed${NC}"
    exit 1
fi

if ! docker ps > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker daemon is not running${NC}"
    exit 1
fi

# Check config file
if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${RED}Error: Config file not found: $CONFIG_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker is available${NC}"
echo -e "${GREEN}✓ Config file found: $CONFIG_FILE${NC}\n"

# Create required directories
echo -e "${YELLOW}Creating required directories...${NC}"
mkdir -p ../public/datasets
mkdir -p ../public/outputs
mkdir -p logs

echo -e "${GREEN}✓ Directories created${NC}\n"

# Display config
echo -e "${BLUE}Training Configuration:${NC}"
cat "$CONFIG_FILE" | python3 -m json.tool 2>/dev/null || cat "$CONFIG_FILE"
echo ""

# Run training
if [ "$BACKGROUND" = true ]; then
    echo -e "${YELLOW}Starting training in background mode...${NC}"
    docker compose -f docker-compose.training.yml up -d
    
    echo -e "${GREEN}Training started!${NC}\n"
    echo -e "${BLUE}Container ID:${NC}"
    docker compose -f docker-compose.training.yml ps
    echo ""
    echo -e "${BLUE}View logs:${NC}"
    echo -e "  docker compose -f docker-compose.training.yml logs -f"
    echo ""
    echo -e "${BLUE}Stop training:${NC}"
    echo -e "  docker compose -f docker-compose.training.yml down"
    
else
    echo -e "${YELLOW}Starting training (attached mode)...${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop${NC}\n"
    
    docker compose -f docker-compose.training.yml up
    
    echo -e "\n${GREEN}Training completed!${NC}"
fi
