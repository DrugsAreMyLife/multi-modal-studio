# Local Self-Hosting & GPU Optimization Guide

This guide helps you configure the studio for your specific hardware, whether you're on Apple Silicon or high-end NVIDIA GPUs.

---

## 🏗️ Core Infrastructure (All Hardware)

Regardless of your GPU, you need the base database and auth stack:

1. **Start Services**:
   ```bash
   supabase start
   docker-compose up -d
   ```
2. **Setup Cloudflare Tunnel** (for webhooks):
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```

---

## 🍏 Profile 1: Apple Silicon (M4 Max / 128GB RAM)

**Focus**: Deep Reasoning & Large Context.

### Optimizations:

- **Environment**: Set `OLLAMA_MAX_LOADED_MODELS=4` and `OLLAMA_NUM_PARALLEL=4`.
- **Large Models**: Run models like `qwen2.5:72b` or `llama3.3:70b`. These fit easily in your 128GB Unified Memory.
- **VLM Analysis**: Use `llava-v1.6:34b` for high-quality video analysis.

---

## 🚀 Profile 2: NVIDIA Powerhouse (4090/5090 / 24-32GB VRAM)

**Focus**: Extreme Speed & Real-time Inference.

### 1. Prerequisites (Windows/Linux):

- Install [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html).
- Ensure CUDA 12.x drivers are installed.

### 2. Ollama / LocalAI Tuning:

Set these variables to keep the GPU fully utilized without overflowing VRAM:

```bash
# Force Ollama to use the GPU only
export OLLAMA_GPU_LAYERS=100
# Optimize for throughput
export OLLAMA_NUM_PARALLEL=8
```

### 3. Recommended "Quant" Models:

Since you have 24GB-32GB VRAM, you should prioritize speed with high-quality quants:

- **Balanced**: `ollama run llama3.1:70b-instruct-q2_K` (Fits in ~22GB VRAM).
- **Extreme Speed**: `ollama run qwen2.5:32b` (Fits entirely in VRAM with plenty of room for context).
- **Vision Specialist**: `ollama run llava:13b` (Blazing fast for UI analysis).

---

## 🐳 Docker Multi-GPU Support

If you prefer running Ollama inside Docker, update your `docker-compose.yml` to include the NVIDIA resource reservation:

```yaml
services:
  ollama:
    image: ollama/ollama
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

## 🛠️ Performance Checklist

- [ ] **Next.js Turbo**: Run `npm run dev -- --turbo` for boosted compilation.
- [ ] **Unified Memory (Mac)**: Ensure no other heavy apps are hogging the 128GB pool during 70B inference.
- [ ] **Flash Attention**: Enable `OLLAMA_FLASH_ATTENTION=1` on all rigs.
