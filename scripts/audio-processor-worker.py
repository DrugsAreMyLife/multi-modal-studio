#!/usr/bin/env python3
"""
Audio Processor Worker - Demucs-based audio stem separation

Provides audio processing services including:
- Stem separation (vocals, drums, bass, other)
- Audio enhancement
- Format conversion

Runs on port 8002 by default.
"""

import asyncio
import io
import os
import uuid
import tempfile
from pathlib import Path
from typing import Dict, Optional
from concurrent.futures import ThreadPoolExecutor

import torch
import numpy as np
import soundfile as sf
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# Lazy import demucs to avoid import errors if not installed
demucs = None

app = FastAPI(title="Audio Processor Worker", version="1.0.0")

# Job tracking
jobs: Dict[str, dict] = {}
executor = ThreadPoolExecutor(max_workers=2)

# Configuration
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
MODEL_NAME = os.getenv("DEMUCS_MODEL", "htdemucs")
OUTPUT_DIR = Path(os.getenv("OUTPUT_DIR", "/tmp/audio-processor"))
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


class JobStatus(BaseModel):
    jobId: str
    status: str
    progress: float
    stems: Optional[Dict[str, str]] = None
    error: Optional[str] = None


def load_demucs():
    """Lazy load demucs model"""
    global demucs
    if demucs is None:
        import demucs.api
        demucs = demucs.api
    return demucs


def separate_audio(job_id: str, audio_path: Path):
    """Run Demucs separation in background thread"""
    try:
        jobs[job_id]["status"] = "processing"
        jobs[job_id]["progress"] = 0.1

        # Load model
        api = load_demucs()
        separator = api.Separator(model=MODEL_NAME, device=DEVICE)

        jobs[job_id]["progress"] = 0.3

        # Load and separate
        origin, separated = separator.separate_audio_file(str(audio_path))

        jobs[job_id]["progress"] = 0.8

        # Save stems
        stems = {}
        output_path = OUTPUT_DIR / job_id
        output_path.mkdir(parents=True, exist_ok=True)

        for stem_name, stem_audio in separated.items():
            stem_file = output_path / f"{stem_name}.wav"
            sf.write(str(stem_file), stem_audio.T, separator.samplerate)
            stems[stem_name] = str(stem_file)

        jobs[job_id]["stems"] = stems
        jobs[job_id]["status"] = "completed"
        jobs[job_id]["progress"] = 1.0

    except Exception as e:
        jobs[job_id]["status"] = "failed"
        jobs[job_id]["error"] = str(e)
        print(f"[AudioProcessor] Job {job_id} failed: {e}")


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "device": DEVICE,
        "model": MODEL_NAME,
        "gpu_available": torch.cuda.is_available(),
        "gpu_name": torch.cuda.get_device_name(0) if torch.cuda.is_available() else None,
    }


@app.post("/separate")
async def separate(file: UploadFile = File(...)):
    """
    Separate audio file into stems (vocals, drums, bass, other)

    Returns job ID for polling status
    """
    job_id = str(uuid.uuid4())

    # Save uploaded file
    temp_path = OUTPUT_DIR / f"{job_id}_input{Path(file.filename).suffix}"
    content = await file.read()

    with open(temp_path, "wb") as f:
        f.write(content)

    # Initialize job
    jobs[job_id] = {
        "jobId": job_id,
        "status": "queued",
        "progress": 0,
        "stems": None,
        "error": None,
    }

    # Start processing in background
    loop = asyncio.get_event_loop()
    loop.run_in_executor(executor, separate_audio, job_id, temp_path)

    return JSONResponse({
        "jobId": job_id,
        "status": "queued",
    })


@app.get("/status/{job_id}")
async def get_status(job_id: str):
    """Get job status and results"""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    return JSONResponse(jobs[job_id])


@app.get("/download/{job_id}/{stem}")
async def download_stem(job_id: str, stem: str):
    """Download a specific stem file"""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    job = jobs[job_id]
    if job["status"] != "completed":
        raise HTTPException(status_code=400, detail="Job not completed")

    if stem not in job["stems"]:
        raise HTTPException(status_code=404, detail=f"Stem '{stem}' not found")

    stem_path = Path(job["stems"][stem])
    if not stem_path.exists():
        raise HTTPException(status_code=404, detail="Stem file not found")

    from fastapi.responses import FileResponse
    return FileResponse(
        path=str(stem_path),
        media_type="audio/wav",
        filename=f"{stem}.wav"
    )


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8002))
    print(f"[AudioProcessor] Starting on port {port}")
    print(f"[AudioProcessor] Device: {DEVICE}")
    print(f"[AudioProcessor] Model: {MODEL_NAME}")

    if torch.cuda.is_available():
        print(f"[AudioProcessor] GPU: {torch.cuda.get_device_name(0)}")
        print(f"[AudioProcessor] VRAM: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f}GB")

    uvicorn.run(app, host="0.0.0.0", port=port)
