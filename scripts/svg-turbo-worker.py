#!/usr/bin/env python3
"""
SVG-Turbo Worker - Image to SVG Vectorization Worker with FastAPI + Redis
Provides bitmap to vector conversion via potrace/vtracer with real-time progress updates.
"""
import time
import json
import os
import subprocess
import tempfile
import redis
from typing import Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
import threading
import requests
from pathlib import Path

# Configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
MODEL_ID = "svg-turbo/vectorize"
QUEUE_NAME = "batch-generation-queue"
PORT = int(os.getenv("SVG_TURBO_PORT", "8008"))

# Initialize Redis
r = redis.from_url(REDIS_URL)
app = FastAPI(title="SVG-Turbo Vectorization Worker", version="1.0.0")

start_time = time.time()


def check_potrace() -> bool:
    """Check if potrace is available."""
    try:
        result = subprocess.run(["potrace", "--version"], capture_output=True, timeout=5)
        return result.returncode == 0
    except Exception:
        return False


def check_vtracer() -> bool:
    """Check if vtracer is available."""
    try:
        result = subprocess.run(["vtracer", "--help"], capture_output=True, timeout=5)
        return result.returncode == 0
    except Exception:
        return False


def check_imagemagick() -> bool:
    """Check if ImageMagick convert is available."""
    try:
        result = subprocess.run(["convert", "--version"], capture_output=True, timeout=5)
        return result.returncode == 0
    except Exception:
        return False


POTRACE_AVAILABLE = check_potrace()
VTRACER_AVAILABLE = check_vtracer()
IMAGEMAGICK_AVAILABLE = check_imagemagick()


class VectorizeRequest(BaseModel):
    image_url: str
    mode: str = "trace"  # trace, centerline, polygon
    output_format: str = "svg"
    color_mode: str = "binary"  # color, grayscale, binary
    threshold: int = 128
    smoothing: int = 50
    simplification: int = 50


class HealthResponse(BaseModel):
    status: str
    tools_available: list
    uptime: float


def publish_progress(job_id: str, progress: int, message: str = "") -> None:
    """Publish progress update to Redis pub/sub channel."""
    r.publish(f"job-progress:{job_id}", json.dumps({
        "jobId": job_id,
        "progress": progress,
        "message": message,
        "timestamp": int(time.time() * 1000)
    }))


def publish_result(job_id: str, status: str, data: Optional[dict] = None, error: Optional[str] = None, duration: int = 0) -> None:
    """Publish job result to Redis pub/sub channel."""
    result = {
        "jobId": job_id,
        "status": status,
        "data": data,
        "error": {"code": "VECTORIZE_ERROR", "message": error} if error else None,
        "duration": duration,
        "completedAt": int(time.time() * 1000)
    }
    r.publish(f"job-results:{job_id}", json.dumps(result))


def download_image(url: str) -> bytes:
    """Download image from URL."""
    response = requests.get(url, timeout=30)
    response.raise_for_status()
    return response.content


def vectorize_with_potrace(image_path: str, output_path: str, options: dict) -> str:
    """Use potrace for bitmap to SVG conversion."""
    threshold = options.get("threshold", 50)
    smoothing = options.get("smoothing", 5)

    # First convert to PBM (potrace input format) using ImageMagick
    pbm_path = image_path.rsplit(".", 1)[0] + ".pbm"

    if IMAGEMAGICK_AVAILABLE:
        subprocess.run([
            "convert", image_path,
            "-threshold", f"{threshold}%",
            "-type", "bilevel",
            pbm_path
        ], check=True, capture_output=True)
    else:
        # Fallback: try to use PIL for conversion
        from PIL import Image
        img = Image.open(image_path).convert("L")
        # Apply threshold
        img = img.point(lambda x: 255 if x > threshold * 255 / 100 else 0, "1")
        img.save(pbm_path)

    # Run potrace
    subprocess.run([
        "potrace", pbm_path,
        "-s",  # SVG output
        "-o", output_path,
        "-t", str(smoothing),
        "--flat"
    ], check=True, capture_output=True)

    # Cleanup intermediate file
    if os.path.exists(pbm_path):
        os.unlink(pbm_path)

    # Read and return SVG content
    with open(output_path, "r") as f:
        return f.read()


def vectorize_with_vtracer(image_path: str, output_path: str, options: dict) -> str:
    """Use vtracer for color image to SVG conversion."""
    color_mode = options.get("color_mode", "binary")

    cmd = [
        "vtracer",
        "--input", image_path,
        "--output", output_path,
    ]

    if color_mode == "color":
        cmd.extend(["--colormode", "color"])
    elif color_mode == "grayscale":
        cmd.extend(["--colormode", "grayscale"])
    else:
        cmd.extend(["--colormode", "bw"])

    subprocess.run(cmd, check=True, capture_output=True)

    with open(output_path, "r") as f:
        return f.read()


def vectorize_simple(image_path: str, output_path: str) -> str:
    """Simple fallback vectorization - creates placeholder SVG."""
    # Read image dimensions
    try:
        from PIL import Image
        img = Image.open(image_path)
        width, height = img.size
    except Exception:
        width, height = 100, 100

    svg_content = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="{width}" height="{height}">
  <rect width="{width}" height="{height}" fill="#f0f0f0"/>
  <text x="{width//2}" y="{height//2}" text-anchor="middle" dominant-baseline="middle"
        font-family="Arial" font-size="14" fill="#666">
    Vectorized (No tools available)
  </text>
</svg>'''

    with open(output_path, "w") as f:
        f.write(svg_content)

    return svg_content


@app.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint for worker status."""
    tools = []
    if POTRACE_AVAILABLE:
        tools.append("potrace")
    if VTRACER_AVAILABLE:
        tools.append("vtracer")
    if IMAGEMAGICK_AVAILABLE:
        tools.append("imagemagick")

    return HealthResponse(
        status="healthy" if tools else "degraded",
        tools_available=tools,
        uptime=time.time() - start_time
    )


@app.post("/vectorize")
async def vectorize(request: VectorizeRequest):
    """Direct vectorization endpoint for synchronous requests."""
    try:
        # Download image
        image_data = download_image(request.image_url)

        # Save to temp file
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            tmp.write(image_data)
            tmp_path = tmp.name

        # Create output path
        output_dir = Path("outputs/vectorize")
        output_dir.mkdir(parents=True, exist_ok=True)
        output_path = str(output_dir / f"{int(time.time() * 1000)}.svg")

        # Vectorize
        options = {
            "threshold": request.threshold,
            "smoothing": request.smoothing,
            "color_mode": request.color_mode,
        }

        if request.color_mode == "color" and VTRACER_AVAILABLE:
            svg_content = vectorize_with_vtracer(tmp_path, output_path, options)
        elif POTRACE_AVAILABLE:
            svg_content = vectorize_with_potrace(tmp_path, output_path, options)
        elif VTRACER_AVAILABLE:
            svg_content = vectorize_with_vtracer(tmp_path, output_path, options)
        else:
            svg_content = vectorize_simple(tmp_path, output_path)

        # Cleanup
        os.unlink(tmp_path)

        return {
            "status": "completed",
            "svgUrl": output_path,
            "svgContent": svg_content,
            "inputImageUrl": request.image_url
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/batch")
async def add_to_batch(request: VectorizeRequest):
    """Add a vectorization job to the batch queue."""
    job_id = f"job_{int(time.time() * 1000)}_{os.urandom(4).hex()}"
    job_data = {
        "id": job_id,
        "model_id": MODEL_ID,
        "payload": request.dict()
    }
    r.rpush(QUEUE_NAME, json.dumps(job_data))
    return {"jobId": job_id, "status": "queued"}


def process_queue() -> None:
    """Background queue processor for batch jobs."""
    print(f"[*] Starting SVG-Turbo vectorization worker...")
    print(f"[*] Tools available: potrace={POTRACE_AVAILABLE}, vtracer={VTRACER_AVAILABLE}, imagemagick={IMAGEMAGICK_AVAILABLE}")
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

                    print(f"[*] Processing vectorization job {job_id}")
                    publish_progress(job_id, 0, "Starting vectorization...")

                    # Download image
                    publish_progress(job_id, 10, "Downloading image...")
                    image_data = download_image(payload["image_url"])

                    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
                        tmp.write(image_data)
                        tmp_path = tmp.name

                    publish_progress(job_id, 30, "Preparing for conversion...")

                    output_dir = Path(f"outputs/{job_id}")
                    output_dir.mkdir(parents=True, exist_ok=True)
                    output_path = str(output_dir / "result.svg")

                    options = {
                        "threshold": payload.get("threshold", 128),
                        "smoothing": payload.get("smoothing", 50),
                        "color_mode": payload.get("color_mode", "binary"),
                    }

                    publish_progress(job_id, 50, "Converting to vector...")

                    color_mode = payload.get("color_mode", "binary")

                    if color_mode == "color" and VTRACER_AVAILABLE:
                        svg_content = vectorize_with_vtracer(tmp_path, output_path, options)
                    elif POTRACE_AVAILABLE:
                        svg_content = vectorize_with_potrace(tmp_path, output_path, options)
                    elif VTRACER_AVAILABLE:
                        svg_content = vectorize_with_vtracer(tmp_path, output_path, options)
                    else:
                        svg_content = vectorize_simple(tmp_path, output_path)

                    # Cleanup temp file
                    os.unlink(tmp_path)

                    publish_progress(job_id, 90, "Finalizing...")

                    duration = int((time.time() - start_ts) * 1000)
                    publish_progress(job_id, 100, "Complete")
                    publish_result(job_id, "completed", {
                        "svgUrl": output_path,
                        "svgContent": svg_content,
                        "inputImageUrl": payload["image_url"],
                        "outputDir": str(output_dir)
                    }, duration=duration)

                    print(f"[+] Vectorization job {job_id} complete in {duration}ms")

                except json.JSONDecodeError as e:
                    print(f"[!] Error decoding job JSON: {e}")
                except KeyError as e:
                    print(f"[!] Missing required field in job: {e}")
                    if job_id:
                        publish_result(job_id, "failed", error=f"Missing field: {e}")
                except subprocess.CalledProcessError as e:
                    print(f"[!] Vectorization tool error: {e}")
                    if job_id:
                        publish_result(job_id, "failed", error=f"Tool error: {e.stderr.decode() if e.stderr else str(e)}")
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


def run_queue_processor() -> None:
    """Start the queue processor in a background thread."""
    thread = threading.Thread(target=process_queue, daemon=True)
    thread.start()


if __name__ == "__main__":
    run_queue_processor()
    print(f"[*] Starting FastAPI server on port {PORT}...")
    uvicorn.run(app, host="0.0.0.0", port=PORT)
