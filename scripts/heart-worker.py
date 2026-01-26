import os
import sys
import uuid
import logging
from typing import List, Optional
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse

# Ensure we can import heartlib from the parent directory or site-packages
sys.path.append(os.path.join(os.getcwd(), 'heartlib'))

try:
    from heartlib.src.heartlib.models.heart_mula import HeartMuLa
    from heartlib.src.heartlib.utils.generation import generate_music
except ImportError:
    # Fallback if installed via pip -e .
    try:
        from heartlib.models.heart_mula import HeartMuLa
        from heartlib.utils.generation import generate_music
    except ImportError as e:
        print(f"Error importing heartlib: {e}")
        # We'll handle this in the app startup

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("heart-worker")

app = FastAPI(title="HeartMuLa Local Worker")

# Configuration
CKPT_PATH = os.path.join(os.getcwd(), "heartlib", "ckpt")
OUTPUT_DIR = os.path.join(os.getcwd(), "public", "generations", "audio", "local")
os.makedirs(OUTPUT_DIR, exist_ok=True)

class GenerationRequest(BaseModel):
    prompt: str
    tags: str
    lyrics: Optional[str] = ""
    duration_ms: Optional[int] = 30000
    topk: Optional[int] = 50
    temperature: Optional[float] = 1.0
    cfg_scale: Optional[float] = 1.5
    version: Optional[str] = "3B"

class GenerationResponse(BaseModel):
    jobId: str
    status: str
    result_url: Optional[str] = None
    error: Optional[str] = None

# In-memory storage for job status
jobs = {}

@app.on_event("startup")
async def startup_event():
    logger.info(f"Checking for checkpoints in {CKPT_PATH}")
    if not os.path.exists(CKPT_PATH):
        logger.warning(f"Checkpoints not found at {CKPT_PATH}. Ensure download is complete.")

async def run_generation(job_id: str, request: GenerationRequest):
    try:
        jobs[job_id]["status"] = "processing"
        
        output_filename = f"{job_id}.mp3"
        save_path = os.path.join(OUTPUT_DIR, output_filename)
        
        # This is where we call the heartlib model
        # Note: In a real implementation, we'd load the model once into VRAM
        # and use a queue/worker pattern. For this iteration, we use the helper.
        
        logger.info(f"Starting generation for job {job_id}")
        
        # Placeholder for actual heartlib call until download finishes
        # Actual call:
        # generate_music(
        #     model_path=CKPT_PATH,
        #     tags=request.tags,
        #     lyrics=request.lyrics,
        #     save_path=save_path,
        #     max_audio_length_ms=request.duration_ms,
        #     topk=request.topk,
        #     temperature=request.temperature,
        #     cfg_scale=request.cfg_scale,
        #     version=request.version
        # )

        # Simulation for testing UI/API flow while files download
        import time
        time.sleep(5) # Simulate work
        
        # For now, if we don't have the model, we can't generate real audio.
        # Once checkpoints are verified, we'll swap simulated logic for real logic.
        
        jobs[job_id]["status"] = "completed"
        jobs[job_id]["result_url"] = f"/generations/audio/local/{output_filename}"
        logger.info(f"Completed generation for job {job_id}")
        
    except Exception as e:
        logger.error(f"Error in generation job {job_id}: {e}")
        jobs[job_id]["status"] = "failed"
        jobs[job_id]["error"] = str(e)

@app.post("/generate", response_model=GenerationResponse)
async def generate(request: GenerationRequest, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())
    jobs[job_id] = {"status": "pending"}
    
    background_tasks.add_task(run_generation, job_id, request)
    
    return {
        "jobId": job_id,
        "status": "pending"
    }

@app.get("/status/{job_id}", response_model=GenerationResponse)
async def get_status(job_id: str):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = jobs[job_id]
    return {
        "jobId": job_id,
        "status": job["status"],
        "result_url": job.get("result_url"),
        "error": job.get("error")
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
