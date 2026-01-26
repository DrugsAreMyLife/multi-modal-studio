import os
import uuid
import logging
import torch
import torchaudio
from typing import Optional, List
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException, BackgroundTasks, UploadFile, File
from fastapi.responses import FileResponse
from demucs.apply import apply_model
from demucs.pretrained import get_model
from stable_audio_tools import get_pretrained_model
from stable_audio_tools.inference.generation import generate_diffusion_cond

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("audio-processor")

app = FastAPI(title="Music Studio Audio Processor")

# Configuration
STORAGE_DIR = os.path.join(os.getcwd(), "public", "generations", "audio")
STEMS_DIR = os.path.join(STORAGE_DIR, "stems")
SAMPLES_DIR = os.path.join(STORAGE_DIR, "samples")
UPLOAD_DIR = os.path.join(os.getcwd(), "tmp", "audio_uploads")

os.makedirs(STEMS_DIR, exist_ok=True)
os.makedirs(SAMPLES_DIR, exist_ok=True)
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Device configuration
device = "cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu"
logger.info(f"Using device: {device}")

# Model placeholders
demucs_model = None
stable_audio_model = None

class ProcessingResponse(BaseModel):
    jobId: str
    status: str
    result_urls: Optional[dict] = None
    error: Optional[str] = None

class SampleRequest(BaseModel):
    prompt: str
    duration_s: Optional[float] = 5.0
    steps: Optional[int] = 50
    cfg_scale: Optional[float] = 7.0

# In-memory job storage
jobs = {}

@app.on_event("startup")
async def load_models():
    global demucs_model, stable_audio_model
    try:
        logger.info("Loading Demucs model (htdemucs)...")
        demucs_model = get_model("htdemucs")
        demucs_model.to(device)
        
        # Note: Stable Audio Open might be large, we lazy load or load on first request if needed
        # For now, let's keep it in startup if memory permits
        # logger.info("Loading Stable Audio Open model...")
        # stable_audio_model, model_config = get_pretrained_model("stabilityai/stable-audio-open-1.0")
        # stable_audio_model.to(device)
    except Exception as e:
        logger.error(f"Error loading models: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutdown signal received. Cleaning up Audio Processor...")
    # Explicitly clear VRAM
    global demucs_model, stable_audio_model
    if demucs_model: del demucs_model
    if stable_audio_model: del stable_audio_model
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
    logger.info("Audio Processor cleanup complete.")

async def process_stems(job_id: str, input_path: str):
    try:
        jobs[job_id]["status"] = "processing"
        logger.info(f"Starting stem separation for job {job_id}")
        
        # Load audio
        wav, sr = torchaudio.load(input_path)
        wav = wav.to(device)
        
        # Normalize to stereo and sample rate
        if wav.shape[0] == 1:
            wav = wav.repeat(2, 1)
        
        # Apply Demucs
        # ref: https://github.com/facebookresearch/demucs
        sources = apply_model(demucs_model, wav[None], device=device)[0]
        sources = sources * demucs_model.control # Adjust for model scaling
        
        stem_names = ["drums", "bass", "other", "vocals"]
        result_urls = {}
        
        job_dir = os.path.join(STEMS_DIR, job_id)
        os.makedirs(job_dir, exist_ok=True)
        
        for source, name in zip(sources, stem_names):
            stem_path = os.path.join(job_dir, f"{name}.mp3")
            torchaudio.save(stem_path, source.cpu(), demucs_model.sampler_rate)
            result_urls[name] = f"/generations/audio/stems/{job_id}/{name}.mp3"
        
        jobs[job_id]["status"] = "completed"
        jobs[job_id]["result_urls"] = result_urls
        logger.info(f"Completed stem separation for job {job_id}")
        
    except Exception as e:
        logger.error(f"Error in stem separation {job_id}: {e}")
        jobs[job_id]["status"] = "failed"
        jobs[job_id]["error"] = str(e)
    finally:
        if os.path.exists(input_path):
            os.remove(input_path)

@app.post("/separate", response_model=ProcessingResponse)
async def separate_stems(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    job_id = str(uuid.uuid4())
    input_path = os.path.join(UPLOAD_DIR, f"{job_id}_{file.filename}")
    
    with open(input_path, "wb") as buffer:
        buffer.write(await file.read())
        
    jobs[job_id] = {"status": "pending"}
    background_tasks.add_task(process_stems, job_id, input_path)
    
    return {"jobId": job_id, "status": "pending"}

@app.post("/sample", response_model=ProcessingResponse)
async def generate_sample(request: SampleRequest, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())
    jobs[job_id] = {"status": "pending"}
    
    async def run_sample_gen():
        try:
            jobs[job_id]["status"] = "processing"
            logger.info(f"Generating sample for job {job_id}: {request.prompt}")
            
            # Simulated Stable Audio / AudioLDM2 Gen
            import time
            time.sleep(3) 
            
            output_path = os.path.join(SAMPLES_DIR, f"{job_id}.mp3")
            # Fake save for UI testing
            with open(output_path, "wb") as f: f.write(b"fake audio data")
            
            jobs[job_id]["status"] = "completed"
            jobs[job_id]["result_urls"] = {"sample": f"/generations/audio/samples/{job_id}.mp3"}
        except Exception as e:
            logger.error(f"Sample gen failed: {e}")
            jobs[job_id]["status"] = "failed"
            jobs[job_id]["error"] = str(e)

    background_tasks.add_task(run_sample_gen)
    return {"jobId": job_id, "status": "pending"}

@app.post("/sfx", response_model=ProcessingResponse)
async def generate_sfx(request: SampleRequest, background_tasks: BackgroundTasks):
    # Specialized SFX endpoint (using AudioLDM2 optimized parameters)
    job_id = f"sfx_{uuid.uuid4()}"
    jobs[job_id] = {"status": "pending"}
    
    async def run_sfx_gen():
        try:
            jobs[job_id]["status"] = "processing"
            logger.info(f"Generating SFX: {request.prompt}")
            import time
            time.sleep(2)
            
            output_path = os.path.join(SAMPLES_DIR, f"{job_id}.mp3")
            with open(output_path, "wb") as f: f.write(b"fake sfx data")
            
            jobs[job_id]["status"] = "completed"
            jobs[job_id]["result_urls"] = {"sample": f"/generations/audio/samples/{job_id}.mp3"}
        except Exception as e:
            jobs[job_id]["status"] = "failed"
            jobs[job_id]["error"] = str(e)

    background_tasks.add_task(run_sfx_gen)
    return {"jobId": job_id, "status": "pending"}

@app.post("/theme-pack")
async def generate_theme_pack(prompts: List[str], background_tasks: BackgroundTasks):
    job_id = f"pack_{uuid.uuid4()}"
    jobs[job_id] = {"status": "pending", "results": []}
    
    async def run_pack_gen():
        try:
            jobs[job_id]["status"] = "processing"
            results = {}
            for i, p in enumerate(prompts):
                logger.info(f"Processing pack item {i+1}/{len(prompts)}: {p}")
                # Simulate batch generation
                item_id = f"{job_id}_{i}"
                output_path = os.path.join(SAMPLES_DIR, f"{item_id}.mp3")
                with open(output_path, "wb") as f: f.write(b"fake pack data")
                results[f"sound_{i}"] = f"/generations/audio/samples/{item_id}.mp3"
            
            jobs[job_id]["status"] = "completed"
            jobs[job_id]["result_urls"] = results
        except Exception as e:
            jobs[job_id]["status"] = "failed"
            jobs[job_id]["error"] = str(e)

    background_tasks.add_task(run_pack_gen)
    return {"jobId": job_id, "status": "pending"}

@app.get("/status/{job_id}", response_model=ProcessingResponse)
async def get_status(job_id: str):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    return {**jobs[job_id], "jobId": job_id}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
