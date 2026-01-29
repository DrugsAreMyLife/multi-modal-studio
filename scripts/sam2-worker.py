#!/usr/bin/env python3
"""
SAM2 Worker - Segment Anything Model 2 Worker with FastAPI + Redis
Provides image segmentation via BullMQ job queue with real-time progress updates.
"""
import time
import json
import os
import asyncio
import redis
import torch
import numpy as np
from typing import Optional, List
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
import threading
from PIL import Image
import requests
from io import BytesIO

# Try importing SAM2
try:
    from sam2.build_sam import build_sam2
    from sam2.sam2_image_predictor import SAM2ImagePredictor
    SAM2_AVAILABLE = True
except ImportError:
    SAM2_AVAILABLE = False
    print("[!] SAM2 not installed, using mock mode")

# Configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
MODEL_ID = "facebook/sam2"
QUEUE_NAME = "batch-generation-queue"
PORT = int(os.getenv("SAM2_PORT", "8006"))

# Initialize Redis
r = redis.from_url(REDIS_URL)
app = FastAPI(title="SAM2 Worker", version="1.0.0")

# Global state
predictor: Optional["SAM2ImagePredictor"] = None
model_loaded = False
start_time = time.time()


class SegmentRequest(BaseModel):
    image_url: str
    points: Optional[List[List[float]]] = None
    labels: Optional[List[int]] = None
    boxes: Optional[List[List[float]]] = None
    mode: str = "automatic"
    multimask_output: bool = False


class HealthResponse(BaseModel):
    status: str
    models_loaded: List[str]
    vram_used_mb: float
    vram_total_mb: float
    uptime: float


def get_vram_usage() -> float:
    if torch.cuda.is_available():
        return torch.cuda.memory_allocated() / 1024 / 1024
    return 0


def get_vram_total() -> float:
    if torch.cuda.is_available():
        return torch.cuda.get_device_properties(0).total_memory / 1024 / 1024
    return 0


def publish_progress(job_id: str, progress: int, message: str = "") -> None:
    """Publish progress update to Redis pub/sub channel."""
    r.publish(f"job-progress:{job_id}", json.dumps({
        "jobId": job_id,
        "progress": progress,
        "message": message,
        "timestamp": int(time.time() * 1000)
    }))


def publish_result(job_id: str, status: str, data: dict = None, error: str = None, duration: int = 0) -> None:
    """Publish job result to Redis pub/sub channel."""
    result = {
        "jobId": job_id,
        "status": status,
        "data": data,
        "error": {"code": "SEGMENTATION_ERROR", "message": error} if error else None,
        "duration": duration,
        "completedAt": int(time.time() * 1000)
    }
    r.publish(f"job-results:{job_id}", json.dumps(result))


def download_image(url: str) -> Image.Image:
    """Download image from URL and return PIL Image."""
    response = requests.get(url, timeout=30)
    response.raise_for_status()
    return Image.open(BytesIO(response.content)).convert("RGB")


@app.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint for worker status."""
    return HealthResponse(
        status="healthy" if model_loaded else "degraded",
        models_loaded=["sam2_hiera_large"] if model_loaded else [],
        vram_used_mb=get_vram_usage(),
        vram_total_mb=get_vram_total(),
        uptime=time.time() - start_time
    )


@app.post("/segment")
async def segment(request: SegmentRequest):
    """Direct segmentation endpoint for synchronous requests."""
    if not model_loaded and SAM2_AVAILABLE:
        raise HTTPException(status_code=503, detail="Model not loaded")

    try:
        # Download and process image
        image = download_image(request.image_url)
        image_np = np.array(image)

        if predictor is not None:
            predictor.set_image(image_np)

            if request.mode == "point" and request.points:
                point_coords = np.array(request.points)
                point_labels = np.array(request.labels or [1] * len(request.points))
                masks, scores, _ = predictor.predict(
                    point_coords=point_coords,
                    point_labels=point_labels,
                    multimask_output=request.multimask_output
                )
            elif request.mode == "box" and request.boxes:
                masks, scores, _ = predictor.predict(
                    box=np.array(request.boxes[0]),
                    multimask_output=request.multimask_output
                )
            else:
                # Automatic mode - generate full image mask
                masks, scores, _ = predictor.predict(
                    point_coords=None,
                    point_labels=None,
                    multimask_output=True
                )

            # Save masks
            output_dir = f"outputs/segment_{int(time.time() * 1000)}"
            os.makedirs(output_dir, exist_ok=True)

            mask_paths = []
            for i, mask in enumerate(masks):
                mask_img = Image.fromarray((mask * 255).astype(np.uint8))
                mask_path = f"{output_dir}/mask_{i}.png"
                mask_img.save(mask_path)
                mask_paths.append(mask_path)

            return {
                "masks": mask_paths,
                "scores": scores.tolist(),
                "status": "completed"
            }
        else:
            # Mock response
            return {
                "masks": ["/outputs/mock_mask.png"],
                "scores": [0.95],
                "status": "completed"
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/batch")
async def add_to_batch(request: SegmentRequest):
    """Add a segmentation job to the batch queue."""
    job_id = f"job_{int(time.time() * 1000)}_{os.urandom(4).hex()}"
    job_data = {
        "id": job_id,
        "model_id": MODEL_ID,
        "payload": request.dict()
    }
    r.rpush(QUEUE_NAME, json.dumps(job_data))
    return {"jobId": job_id, "status": "queued"}


def process_queue():
    """Background queue processor for batch jobs."""
    global predictor, model_loaded

    print(f"[*] Starting SAM 2 worker...")
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"[*] Using device: {device}")

    if SAM2_AVAILABLE:
        try:
            checkpoint = os.getenv("SAM2_CHECKPOINT_PATH", "checkpoints/sam2_hiera_large.pt")
            model_cfg = "sam2_hiera_l.yaml"
            print(f"[*] Loading SAM2 from {checkpoint}...")
            sam2_model = build_sam2(model_cfg, checkpoint, device=device)
            predictor = SAM2ImagePredictor(sam2_model)
            model_loaded = True
            print(f"[+] SAM 2 loaded successfully. VRAM: {get_vram_usage():.0f}MB")
        except Exception as e:
            print(f"[!] Warning: SAM 2 failed to load: {e}")
            model_loaded = False
    else:
        print("[!] Running in mock mode (SAM2 not installed)")

    print(f"[*] Listening for jobs on {QUEUE_NAME}...")

    while True:
        try:
            job_data = r.blpop(QUEUE_NAME, timeout=30)

            if job_data:
                start_ts = time.time()
                job_id = None

                try:
                    job = json.loads(job_data[1])

                    # Skip jobs for other workers
                    if job.get("model_id") != MODEL_ID:
                        r.rpush(QUEUE_NAME, job_data[1])
                        continue

                    job_id = job["id"]
                    payload = job["payload"]

                    print(f"[*] Processing SAM 2 job {job_id}")
                    publish_progress(job_id, 0, "Starting segmentation...")

                    # Download image
                    publish_progress(job_id, 10, "Downloading image...")
                    image_url = payload.get("image_url", "")
                    image = download_image(image_url)
                    image_np = np.array(image)

                    publish_progress(job_id, 30, "Preparing model...")

                    output_dir = f"outputs/{job_id}"
                    os.makedirs(output_dir, exist_ok=True)

                    if predictor is not None:
                        publish_progress(job_id, 40, "Setting image...")
                        predictor.set_image(image_np)

                        publish_progress(job_id, 60, "Running inference...")

                        mode = payload.get("mode", "automatic")
                        points = payload.get("points")
                        labels = payload.get("labels")
                        boxes = payload.get("boxes")
                        multimask = payload.get("multimask_output", False)

                        if mode == "point" and points:
                            point_coords = np.array(points)
                            point_labels = np.array(labels or [1] * len(points))
                            masks, scores, _ = predictor.predict(
                                point_coords=point_coords,
                                point_labels=point_labels,
                                multimask_output=multimask
                            )
                        elif mode == "box" and boxes:
                            masks, scores, _ = predictor.predict(
                                box=np.array(boxes[0]),
                                multimask_output=multimask
                            )
                        else:
                            masks, scores, _ = predictor.predict(
                                point_coords=None,
                                point_labels=None,
                                multimask_output=True
                            )

                        publish_progress(job_id, 80, "Saving masks...")

                        mask_paths = []
                        for i, mask in enumerate(masks):
                            mask_img = Image.fromarray((mask * 255).astype(np.uint8))
                            mask_path = f"{output_dir}/mask_{i}.png"
                            mask_img.save(mask_path)
                            mask_paths.append(mask_path)

                        duration = int((time.time() - start_ts) * 1000)
                        publish_progress(job_id, 100, "Complete")
                        publish_result(job_id, "completed", {
                            "masks": mask_paths,
                            "scores": scores.tolist(),
                            "inputImageUrl": image_url,
                            "outputDir": output_dir
                        }, duration=duration)
                    else:
                        # Mock mode
                        publish_progress(job_id, 50, "Processing (mock mode)...")
                        time.sleep(1)

                        mock_mask_path = f"{output_dir}/mask_0.png"
                        # Create a simple gradient mask for demo
                        mock_mask = Image.new("L", (image.width, image.height), 128)
                        mock_mask.save(mock_mask_path)

                        duration = int((time.time() - start_ts) * 1000)
                        publish_progress(job_id, 100, "Complete (mock)")
                        publish_result(job_id, "completed", {
                            "masks": [mock_mask_path],
                            "scores": [0.85],
                            "inputImageUrl": image_url,
                            "outputDir": output_dir,
                            "mock": True
                        }, duration=duration)

                    print(f"[+] SAM 2 job {job_id} complete in {duration}ms")

                except json.JSONDecodeError as e:
                    print(f"[!] Error decoding job JSON: {e}")
                except KeyError as e:
                    print(f"[!] Missing required field in job: {e}")
                    if job_id:
                        publish_result(job_id, "failed", error=f"Missing field: {e}")
                except Exception as e:
                    print(f"[!] Error processing job: {e}")
                    if job_id:
                        publish_result(job_id, "failed", error=str(e))

        except redis.ConnectionError as e:
            print(f"[!] Redis connection error: {e}")
            time.sleep(5)
        except Exception as e:
            print(f"[!] Unexpected error in queue processor: {e}")
            time.sleep(5)


def run_queue_processor():
    """Start the queue processor in a background thread."""
    thread = threading.Thread(target=process_queue, daemon=True)
    thread.start()


if __name__ == "__main__":
    run_queue_processor()
    print(f"[*] Starting FastAPI server on port {PORT}...")
    uvicorn.run(app, host="0.0.0.0", port=PORT)
