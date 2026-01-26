#!/bin/bash
set -euo pipefail

# Multi-Modal Studio k3s Deployment Script
# Run this from a machine with access to the k3s cluster (e.g., 10.0.0.x network)

# Configuration
REGISTRY="${REGISTRY:-ghcr.io}"
IMAGE_NAME="${IMAGE_NAME:-drugsaremylife/multi-modal-studio}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
KUBECONFIG="${KUBECONFIG:-$HOME/.kube/k3s-node1.yaml}"
K3S_GITOPS_PATH="${K3S_GITOPS_PATH:-$HOME/Projects/k3s-gitops}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed"
        exit 1
    fi

    if ! command -v docker &> /dev/null; then
        log_error "docker is not installed"
        exit 1
    fi

    if [[ ! -f "$KUBECONFIG" ]]; then
        log_error "Kubeconfig not found at $KUBECONFIG"
        exit 1
    fi

    log_info "Prerequisites check passed"
}

# Build Docker image
build_image() {
    log_info "Building Docker image..."

    cd "$(dirname "$0")/.."

    docker build \
        --platform linux/amd64 \
        -t "${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}" \
        -t "${REGISTRY}/${IMAGE_NAME}:$(git rev-parse --short HEAD)" \
        .

    log_info "Docker image built successfully"
}

# Push to registry
push_image() {
    log_info "Pushing image to ${REGISTRY}..."

    docker push "${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
    docker push "${REGISTRY}/${IMAGE_NAME}:$(git rev-parse --short HEAD)"

    log_info "Image pushed successfully"
}

# Deploy to k3s
deploy() {
    log_info "Deploying to k3s cluster..."

    export KUBECONFIG="$KUBECONFIG"

    # Check cluster connectivity
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to k3s cluster"
        exit 1
    fi

    log_info "Connected to cluster"

    # Apply manifests using kustomize
    cd "${K3S_GITOPS_PATH}/apps/base/multi-modal-studio"

    # Create namespace if not exists
    kubectl apply -f namespace.yaml

    # Check if secrets exist, warn if not
    if ! kubectl get secret multi-modal-studio-secrets -n multi-modal-studio &> /dev/null; then
        log_warn "Secrets not found. Create them with:"
        log_warn "  kubectl create secret generic multi-modal-studio-secrets \\"
        log_warn "    --from-env-file=.env.production -n multi-modal-studio"
    fi

    # Apply all resources
    kubectl apply -k .

    # Wait for rollout
    log_info "Waiting for deployment rollout..."
    kubectl rollout status deployment/multi-modal-studio -n multi-modal-studio --timeout=300s

    log_info "Deployment complete!"

    # Show pod status
    kubectl get pods -n multi-modal-studio
}

# Rollback deployment
rollback() {
    log_info "Rolling back deployment..."

    export KUBECONFIG="$KUBECONFIG"
    kubectl rollout undo deployment/multi-modal-studio -n multi-modal-studio
    kubectl rollout status deployment/multi-modal-studio -n multi-modal-studio --timeout=300s

    log_info "Rollback complete"
}

# Show status
status() {
    export KUBECONFIG="$KUBECONFIG"

    echo ""
    log_info "=== Deployment Status ==="
    kubectl get deployment -n multi-modal-studio

    echo ""
    log_info "=== Pod Status ==="
    kubectl get pods -n multi-modal-studio

    echo ""
    log_info "=== Service Status ==="
    kubectl get svc -n multi-modal-studio

    echo ""
    log_info "=== Ingress Status ==="
    kubectl get ingress -n multi-modal-studio
}

# Show logs
logs() {
    export KUBECONFIG="$KUBECONFIG"
    kubectl logs -n multi-modal-studio -l app=multi-modal-studio --tail=100 -f
}

# Main
case "${1:-deploy}" in
    build)
        check_prerequisites
        build_image
        ;;
    push)
        push_image
        ;;
    deploy)
        check_prerequisites
        deploy
        ;;
    build-push-deploy)
        check_prerequisites
        build_image
        push_image
        deploy
        ;;
    rollback)
        rollback
        ;;
    status)
        status
        ;;
    logs)
        logs
        ;;
    *)
        echo "Usage: $0 {build|push|deploy|build-push-deploy|rollback|status|logs}"
        exit 1
        ;;
esac
