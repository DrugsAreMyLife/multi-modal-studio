#!/bin/bash
set -e

# Multi-Modal Generation Studio - K8s Deployment Script
# Deploys to K3s cluster with GPU worker support

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
K8S_DIR="$PROJECT_ROOT/k8s"

# Configuration
KUBECONFIG="${KUBECONFIG:-$HOME/.kube/k3s-node1.yaml}"
NAMESPACE="mmgs"
REGISTRY="ghcr.io/drugsaremylife"
WEB_IMAGE="$REGISTRY/mmgs"
WORKERS_IMAGE="$REGISTRY/mmgs-workers"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[DEPLOY]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Check prerequisites
check_prereqs() {
    log "Checking prerequisites..."

    command -v kubectl >/dev/null 2>&1 || error "kubectl not found"
    command -v docker >/dev/null 2>&1 || error "docker not found"

    if [[ ! -f "$KUBECONFIG" ]]; then
        error "Kubeconfig not found at $KUBECONFIG"
    fi

    export KUBECONFIG
    kubectl cluster-info >/dev/null 2>&1 || error "Cannot connect to cluster"

    log "Prerequisites OK"
}

# Build and push Docker images
build_images() {
    log "Building Docker images..."

    cd "$PROJECT_ROOT"

    # Build Next.js web app
    log "Building web image: $WEB_IMAGE:latest"
    docker build --platform linux/amd64 -t "$WEB_IMAGE:latest" -f Dockerfile .

    # Build GPU workers
    log "Building workers image: $WORKERS_IMAGE:latest"
    docker build --platform linux/amd64 -t "$WORKERS_IMAGE:latest" -f k8s/gpu-workers.Dockerfile .

    log "Images built successfully"
}

# Push images to registry
push_images() {
    log "Pushing images to registry..."

    docker push "$WEB_IMAGE:latest"
    docker push "$WORKERS_IMAGE:latest"

    log "Images pushed successfully"
}

# Create namespace and apply manifests
apply_manifests() {
    log "Applying Kubernetes manifests..."

    # Create namespace first
    kubectl apply -f "$K8S_DIR/namespace.yaml"

    # Check if secrets exist, warn if not
    if ! kubectl get secret mmgs-secrets -n "$NAMESPACE" >/dev/null 2>&1; then
        warn "Secrets not found. Create them with:"
        warn "  kubectl create secret generic mmgs-secrets --from-env-file=.env.production -n $NAMESPACE"
        warn "Continuing without secrets (app may not work correctly)..."
    fi

    # Check for GHCR pull secret
    if ! kubectl get secret ghcr-secret -n "$NAMESPACE" >/dev/null 2>&1; then
        warn "GHCR pull secret not found. Create it with:"
        warn "  kubectl create secret docker-registry ghcr-secret \\"
        warn "    --docker-server=ghcr.io \\"
        warn "    --docker-username=YOUR_GITHUB_USERNAME \\"
        warn "    --docker-password=YOUR_GITHUB_PAT \\"
        warn "    -n $NAMESPACE"
    fi

    # Apply configs
    kubectl apply -f "$K8S_DIR/configmap.yaml"

    # Apply PVCs
    kubectl apply -f "$K8S_DIR/pvc.yaml"

    # Apply deployments and services
    kubectl apply -f "$K8S_DIR/deployment.yaml"
    kubectl apply -f "$K8S_DIR/service.yaml"
    kubectl apply -f "$K8S_DIR/ingress.yaml"

    log "Manifests applied successfully"
}

# Wait for rollout
wait_for_rollout() {
    log "Waiting for deployments to be ready..."

    kubectl rollout status deployment/mmgs-web -n "$NAMESPACE" --timeout=300s

    # GPU workers may take longer due to model loading
    kubectl rollout status deployment/mmgs-workers -n "$NAMESPACE" --timeout=600s || \
        warn "GPU workers still starting (this is normal for first deploy)"

    log "Deployments ready"
}

# Show status
show_status() {
    log "Deployment status:"
    echo ""
    kubectl get pods -n "$NAMESPACE" -o wide
    echo ""
    kubectl get svc -n "$NAMESPACE"
    echo ""
    kubectl get ingress -n "$NAMESPACE"
    echo ""
    log "Application should be available at: https://studio.drnickdavis.com"
}

# Rollback
rollback() {
    warn "Rolling back deployments..."
    kubectl rollout undo deployment/mmgs-web -n "$NAMESPACE"
    kubectl rollout undo deployment/mmgs-workers -n "$NAMESPACE"
    log "Rollback complete"
}

# Main
case "${1:-deploy}" in
    deploy)
        check_prereqs
        build_images
        push_images
        apply_manifests
        wait_for_rollout
        show_status
        ;;
    build)
        check_prereqs
        build_images
        ;;
    push)
        check_prereqs
        push_images
        ;;
    apply)
        check_prereqs
        apply_manifests
        ;;
    status)
        export KUBECONFIG
        show_status
        ;;
    rollback)
        export KUBECONFIG
        rollback
        ;;
    logs-web)
        export KUBECONFIG
        kubectl logs -f deployment/mmgs-web -n "$NAMESPACE" --all-containers
        ;;
    logs-workers)
        export KUBECONFIG
        kubectl logs -f deployment/mmgs-workers -n "$NAMESPACE" --all-containers
        ;;
    *)
        echo "Usage: $0 {deploy|build|push|apply|status|rollback|logs-web|logs-workers}"
        exit 1
        ;;
esac
