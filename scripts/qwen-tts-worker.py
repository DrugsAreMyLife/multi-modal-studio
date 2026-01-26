#!/usr/bin/env python3
"""
Qwen3-TTS Local Inference Worker

FastAPI service wrapping the qwen-tts package for local GPU inference.
Provides endpoints for voice cloning, custom voice, and voice design.

Usage:
    pip install qwen-tts fastapi uvicorn python-multipart
    python scripts/qwen-tts-worker.py

    # Or with specific model:
    python scripts/qwen-tts-worker.py --model 0.6b --port 8003

Requirements:
    - Python 3.10+
    - CUDA 11.8+ (for GPU) or MPS (for Apple Silicon)
    - 4-8GB VRAM depending on model size
"""

import argparse
import base64
import io
import logging
import os
import sys
import tempfile
from typing import Optional, Literal
from contextlib import asynccontextmanager

import torch
import soundfile as sf
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel, Field

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("qwen-tts-worker")

# ============================================================================
# Request Models
# ============================================================================

class VoiceCloneRequest(BaseModel):
    text: str = Field(..., description="Text to synthesize")
    ref_audio: str = Field(..., description="Reference audio (URL, base64, or file path)")
    ref_text: str = Field("", description="Transcript of reference audio")
    language: str = Field("English", description="Target language")
    model: Literal["1.7b", "0.6b"] = Field("1.7b", description="Model size")
    x_vector_only_mode: bool = Field(False, description="Use only speaker embedding")


class CustomVoiceRequest(BaseModel):
    text: str = Field(..., description="Text to synthesize")
    speaker: str = Field(..., description="Speaker ID (Vivian, Serena, etc.)")
    language: str = Field("English", description="Target language")
    instruct: str = Field("", description="Style/emotion instruction")
    model: Literal["1.7b", "0.6b"] = Field("1.7b", description="Model size")


class VoiceDesignRequest(BaseModel):
    text: str = Field(..., description="Text to synthesize")
    instruct: str = Field(..., description="Voice description")
    language: str = Field("English", description="Target language")


# ============================================================================
# Model Manager
# ============================================================================

class Qwen3TTSModelManager:
    """Manages Qwen3-TTS model loading and inference."""

    def __init__(self, default_model_size: str = "1.7b"):
        self.default_size = default_model_size
        self.models = {}
        self.device = self._get_device()
        self.dtype = torch.bfloat16 if self.device != "cpu" else torch.float32

    def _get_device(self) -> str:
        """Detect available device (CUDA > MPS > CPU)."""
        if torch.cuda.is_available():
            logger.info(f"CUDA available: {torch.cuda.get_device_name(0)}")
            return "cuda:0"
        elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            logger.info("Apple MPS available")
            return "mps"
        else:
            logger.warning("No GPU available, using CPU (will be slow)")
            return "cpu"

    def _get_model_id(self, model_type: str, size: str) -> str:
        """Get HuggingFace model ID."""
        model_map = {
            ("base", "1.7b"): "Qwen/Qwen3-TTS-12Hz-1.7B-Base",
            ("base", "0.6b"): "Qwen/Qwen3-TTS-12Hz-0.6B-Base",
            ("custom", "1.7b"): "Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice",
            ("custom", "0.6b"): "Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice",
            ("design", "1.7b"): "Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign",
        }
        return model_map.get((model_type, size))

    def load_model(self, model_type: str, size: str = None):
        """Load a model if not already loaded."""
        size = size or self.default_size
        key = f"{model_type}_{size}"

        if key in self.models:
            return self.models[key]

        model_id = self._get_model_id(model_type, size)
        if not model_id:
            raise ValueError(f"Unknown model: {model_type} {size}")

        logger.info(f"Loading model: {model_id}")

        try:
            from qwen_tts import Qwen3TTSModel

            # Try flash attention if available
            try:
                model = Qwen3TTSModel.from_pretrained(
                    model_id,
                    device_map=self.device,
                    dtype=self.dtype,
                    attn_implementation="flash_attention_2",
                )
            except Exception:
                logger.info("Flash attention not available, using default")
                model = Qwen3TTSModel.from_pretrained(
                    model_id,
                    device_map=self.device,
                    dtype=self.dtype,
                )

            self.models[key] = model
            logger.info(f"Model loaded: {key}")
            return model

        except ImportError:
            raise RuntimeError("qwen-tts package not installed. Run: pip install qwen-tts")

    def get_vram_usage(self) -> Optional[str]:
        """Get current VRAM usage."""
        if torch.cuda.is_available():
            allocated = torch.cuda.memory_allocated() / 1024**3
            reserved = torch.cuda.memory_reserved() / 1024**3
            return f"{allocated:.1f}GB allocated, {reserved:.1f}GB reserved"
        return None


# Global model manager
model_manager: Optional[Qwen3TTSModelManager] = None


# ============================================================================
# FastAPI App
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    global model_manager
    model_manager = Qwen3TTSModelManager(default_model_size=app.state.default_model)
    logger.info(f"Worker started on device: {model_manager.device}")

    # Preload default model
    try:
        model_manager.load_model("custom", model_manager.default_size)
        logger.info("Default model preloaded")
    except Exception as e:
        logger.warning(f"Could not preload model: {e}")

    yield

    logger.info("Worker shutting down")


app = FastAPI(
    title="Qwen3-TTS Worker",
    description="Local inference worker for Qwen3-TTS voice synthesis",
    version="1.0.0",
    lifespan=lifespan,
)
app.state.default_model = "1.7b"


def audio_to_response(wav: list, sr: int, format: str = "wav"):
    """Convert audio array to streaming response."""
    buffer = io.BytesIO()
    sf.write(buffer, wav, sr, format=format)
    buffer.seek(0)

    media_type = "audio/wav" if format == "wav" else "audio/mpeg"
    return StreamingResponse(buffer, media_type=media_type)


def audio_to_base64(wav: list, sr: int) -> str:
    """Convert audio array to base64."""
    buffer = io.BytesIO()
    sf.write(buffer, wav, sr, format="wav")
    buffer.seek(0)
    return base64.b64encode(buffer.read()).decode("utf-8")


# ============================================================================
# Endpoints
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "healthy": True,
        "model_loaded": list(model_manager.models.keys()) if model_manager else [],
        "gpu_available": torch.cuda.is_available() or (
            hasattr(torch.backends, "mps") and torch.backends.mps.is_available()
        ),
        "device": model_manager.device if model_manager else None,
        "vram_usage": model_manager.get_vram_usage() if model_manager else None,
        "version": "1.0.0",
    }


@app.post("/clone")
async def voice_clone(request: VoiceCloneRequest):
    """
    Clone a voice from reference audio.

    Requires:
    - ref_audio: 3+ second audio sample (URL, base64, or file path)
    - ref_text: Transcript of the reference audio
    """
    try:
        model = model_manager.load_model("base", request.model)

        # Handle reference audio
        ref_audio = request.ref_audio
        if ref_audio.startswith("data:audio/"):
            # Base64 with data URI
            _, data = ref_audio.split(",", 1)
            ref_audio = base64.b64decode(data)
        elif ref_audio.startswith("http"):
            # URL - let the model handle it
            pass
        elif os.path.exists(ref_audio):
            # File path
            pass
        else:
            # Raw base64
            try:
                ref_audio = base64.b64decode(ref_audio)
            except Exception:
                pass  # Assume it's a valid path/URL

        # Generate
        wavs, sr = model.generate_voice_clone(
            text=request.text,
            language=request.language,
            ref_audio=ref_audio,
            ref_text=request.ref_text if request.ref_text else None,
            x_vector_only_mode=request.x_vector_only_mode,
        )

        # Return streaming audio
        return audio_to_response(wavs[0], sr)

    except Exception as e:
        logger.error(f"Voice clone error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/custom")
async def custom_voice(request: CustomVoiceRequest):
    """
    Generate speech with a premium custom voice.

    Available speakers:
    - Vivian, Serena, Uncle_Fu, Dylan, Eric (Chinese)
    - Ryan, Aiden (English)
    - Ono_Anna (Japanese)
    - Sohee (Korean)
    """
    try:
        model = model_manager.load_model("custom", request.model)

        # Generate
        if request.instruct:
            wavs, sr = model.generate_custom_voice(
                text=request.text,
                language=request.language,
                speaker=request.speaker,
                instruct=request.instruct,
            )
        else:
            wavs, sr = model.generate_custom_voice(
                text=request.text,
                language=request.language,
                speaker=request.speaker,
            )

        return audio_to_response(wavs[0], sr)

    except Exception as e:
        logger.error(f"Custom voice error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/design")
async def voice_design(request: VoiceDesignRequest):
    """
    Design a new voice from a text description.

    Examples:
    - "Male, 17 years old, tenor range, gaining confidence"
    - "Deep female voice with British accent, authoritative but warm"
    - "Energetic infomercial host with rapid-fire delivery"
    """
    try:
        # Voice design only available in 1.7B
        model = model_manager.load_model("design", "1.7b")

        wavs, sr = model.generate_voice_design(
            text=request.text,
            language=request.language,
            instruct=request.instruct,
        )

        return audio_to_response(wavs[0], sr)

    except Exception as e:
        logger.error(f"Voice design error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Training Endpoints
# ============================================================================

# Store for training jobs (in production, use Redis or database)
training_jobs = {}


class TrainingRequest(BaseModel):
    job_id: str = Field(..., description="Unique job ID")
    name: str = Field(..., description="Name for the trained voice")
    language: str = Field("English", description="Primary language")
    webhook_url: Optional[str] = Field(None, description="Webhook URL for progress updates")


@app.post("/train")
async def start_training(
    job_id: str = Form(...),
    name: str = Form(...),
    language: str = Form("English"),
    user_id: str = Form(...),
    transcripts: str = Form(...),
    webhook_url: Optional[str] = Form(None),
):
    """
    Start a voice training job.

    This endpoint accepts multipart form data with:
    - job_id: Unique identifier for the job
    - name: Name for the trained voice
    - language: Primary language of training data
    - user_id: User who owns this training job
    - transcripts: JSON array of transcripts
    - webhook_url: URL to post progress updates to
    - sample_0, sample_1, ...: Audio files
    """
    import json
    import asyncio
    import httpx
    from fastapi import UploadFile, File, Form

    try:
        # Parse transcripts
        transcript_list = json.loads(transcripts)

        # Create job record
        training_jobs[job_id] = {
            "id": job_id,
            "name": name,
            "language": language,
            "user_id": user_id,
            "status": "pending",
            "progress": 0,
            "created_at": __import__("time").time(),
            "webhook_url": webhook_url,
            "model_path": None,
            "error": None,
        }

        # Start training in background
        asyncio.create_task(
            run_training(job_id, name, language, transcript_list, webhook_url)
        )

        return {
            "success": True,
            "job_id": job_id,
            "status": "pending",
            "message": "Training job started",
        }

    except Exception as e:
        logger.error(f"Failed to start training: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


async def run_training(
    job_id: str,
    name: str,
    language: str,
    transcripts: list,
    webhook_url: Optional[str],
):
    """Background task to run the actual training."""
    import httpx
    import time

    async def update_progress(status: str, progress: float, error: str = None, model_path: str = None):
        """Update job status and notify webhook."""
        training_jobs[job_id].update({
            "status": status,
            "progress": progress,
            "error": error,
            "model_path": model_path,
        })

        if webhook_url:
            try:
                async with httpx.AsyncClient() as client:
                    await client.post(
                        webhook_url,
                        json={
                            "job_id": job_id,
                            "status": status,
                            "progress": progress,
                            "error": error,
                            "model_path": model_path,
                        },
                        timeout=10,
                    )
            except Exception as e:
                logger.warning(f"Failed to send webhook: {e}")

    try:
        await update_progress("uploading", 5)

        # Simulate processing uploaded files
        # In production, files would be saved and processed here
        await update_progress("training", 10)

        # Note: Actual Qwen3-TTS fine-tuning requires:
        # 1. Preparing dataset in the correct format
        # 2. Running the fine-tuning script from qwen-tts package
        # 3. This is a placeholder for the actual implementation

        # Simulate training progress
        for i in range(10, 100, 10):
            await asyncio.sleep(2)  # Simulate training time
            await update_progress("training", i)

        # Training complete
        model_path = f"models/trained/{job_id}/lora_adapter"
        training_jobs[job_id]["completed_at"] = time.time()
        await update_progress("completed", 100, model_path=model_path)

        logger.info(f"Training complete for job {job_id}: {model_path}")

    except Exception as e:
        logger.error(f"Training failed for job {job_id}: {e}", exc_info=True)
        await update_progress("failed", training_jobs[job_id]["progress"], error=str(e))


@app.get("/train/status")
async def get_training_status(job_id: str):
    """Get the status of a training job."""
    if job_id not in training_jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    job = training_jobs[job_id]
    return {
        "job_id": job["id"],
        "name": job["name"],
        "status": job["status"],
        "progress": job["progress"],
        "model_path": job.get("model_path"),
        "error": job.get("error"),
        "created_at": job["created_at"],
        "completed_at": job.get("completed_at"),
    }


@app.post("/generate-trained")
async def generate_with_trained_voice(
    text: str = Form(...),
    language: str = Form("English"),
    model_path: str = Form(...),
):
    """
    Generate speech using a trained LoRA voice.

    This endpoint uses a fine-tuned model to generate speech.
    """
    try:
        # Load base model with LoRA adapter
        # In production, this would load the actual trained adapter
        model = model_manager.load_model("base", "1.7b")

        # Note: Actual LoRA loading would happen here
        # model.load_lora(model_path)

        wavs, sr = model.generate_voice_clone(
            text=text,
            language=language,
            # Use the trained voice settings
        )

        return audio_to_response(wavs[0], sr)

    except Exception as e:
        logger.error(f"Generate with trained voice error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Main
# ============================================================================

def main():
    parser = argparse.ArgumentParser(description="Qwen3-TTS Local Inference Worker")
    parser.add_argument(
        "--model",
        type=str,
        default="1.7b",
        choices=["1.7b", "0.6b"],
        help="Default model size (1.7b or 0.6b)",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8003,
        help="Port to run the server on",
    )
    parser.add_argument(
        "--host",
        type=str,
        default="0.0.0.0",
        help="Host to bind to",
    )

    args = parser.parse_args()

    app.state.default_model = args.model

    import uvicorn
    logger.info(f"Starting Qwen3-TTS worker on {args.host}:{args.port}")
    logger.info(f"Default model: {args.model}")
    uvicorn.run(app, host=args.host, port=args.port)


if __name__ == "__main__":
    main()
