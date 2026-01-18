#!/bin/bash
# Health check script for training container

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT=$(cd "$(dirname "$0")" && pwd)
cd "$PROJECT_ROOT"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Training Container Health Check${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Get container ID
CONTAINER_ID=$(docker compose -f docker-compose.training.yml ps -q 2>/dev/null || true)

if [ -z "$CONTAINER_ID" ]; then
    echo -e "${YELLOW}No running container found${NC}"
    echo -e "Start training with: ./run.sh"
    exit 0
fi

echo -e "${BLUE}Container ID: $CONTAINER_ID${NC}\n"

# Check health endpoint
echo -e "${YELLOW}Checking health endpoint...${NC}"
if curl -s http://localhost:8080/health > /dev/null 2>&1; then
    HEALTH=$(curl -s http://localhost:8080/health)
    echo -e "${GREEN}✓ Health endpoint is responding${NC}"
    echo -e "Response: $HEALTH\n"
else
    echo -e "${YELLOW}Health endpoint not responding (container may still be starting)${NC}\n"
fi

# Check metrics
echo -e "${YELLOW}Checking metrics endpoint...${NC}"
if curl -s http://localhost:8080/metrics > /dev/null 2>&1; then
    METRICS=$(curl -s http://localhost:8080/metrics | python3 -m json.tool 2>/dev/null || curl -s http://localhost:8080/metrics)
    echo -e "${GREEN}✓ Metrics endpoint is responding${NC}"
    echo -e "Response: $METRICS\n"
else
    echo -e "${YELLOW}Metrics endpoint not responding${NC}\n"
fi

# Check container status
echo -e "${YELLOW}Container Status:${NC}"
docker compose -f docker-compose.training.yml ps

# Check GPU access
echo -e "\n${YELLOW}GPU Information:${NC}"
docker exec "$CONTAINER_ID" nvidia-smi --query-gpu=index,name,memory.total --format=csv,noheader 2>/dev/null || \
    echo "Unable to query GPU info"

# Check container logs (last 20 lines)
echo -e "\n${YELLOW}Recent Logs:${NC}"
docker compose -f docker-compose.training.yml logs --tail=20

echo -e "\n${GREEN}Health check completed${NC}"
