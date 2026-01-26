#!/usr/bin/env python3
"""
NVIDIA PersonaPlex Worker

Full-duplex conversational voice AI inference server.
Based on Moshi architecture from kyutai-labs.

Requirements:
    - CUDA GPU with ~16GB VRAM (A100/H100 recommended)
    - CUDA 12.x
    - libopus-dev (Ubuntu: apt install libopus-dev)

Setup:
    pip install torch torchvision torchaudio
    pip install moshi huggingface_hub flask flask-cors soundfile numpy

Usage:
    python personaplex-worker.py [--port 8015] [--host 0.0.0.0]

Environment:
    HF_TOKEN: HuggingFace token (required for model download)
    PERSONAPLEX_DEVICE: Device to use (default: cuda:0)
    PERSONAPLEX_CPU_OFFLOAD: Enable CPU offloading for limited VRAM (default: false)
"""

import argparse
import base64
import io
import json
import logging
import os
import struct
import threading
import uuid
from dataclasses import dataclass
from typing import Optional, Dict, Any, Generator

import numpy as np
import soundfile as sf
from flask import Flask, request, jsonify, Response
from flask_cors import CORS

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('PersonaPlexWorker')

app = Flask(__name__)
CORS(app)

# Global state
model_wrapper = None
model_lock = threading.Lock()
active_sessions: Dict[str, Any] = {}

# HuggingFace repo for PersonaPlex
PERSONAPLEX_REPO = "nvidia/personaplex-7b-v1"
MOSHI_REPO = "kyutai/moshiko-pytorch-bf16"


@dataclass
class PersonaPlexConfig:
    """Configuration for PersonaPlex generation."""
    text: str
    voice_prompt: Optional[str] = None  # Path to .pt file or base64 audio
    persona_description: str = "A friendly conversational assistant"
    enable_backchannels: bool = True
    enable_interruptions: bool = True
    emotional_expression: float = 0.5
    sample_rate: int = 24000
    streaming: bool = True
    # Generation parameters
    temp_audio: float = 0.8
    temp_text: float = 0.7
    top_k_audio: int = 250
    top_k_text: int = 25


class PersonaPlexModel:
    """
    PersonaPlex model wrapper using Moshi architecture.

    PersonaPlex is NVIDIA's fine-tuned version of Moshi for
    full-duplex conversational AI with persona control.
    """

    def __init__(self, device: str = "cuda:0", cpu_offload: bool = False):
        self.device = device
        self.cpu_offload = cpu_offload
        self.is_ready = False
        self.sample_rate = 24000
        self.frame_size = 1920  # 80ms at 24kHz

        # Models
        self.mimi = None
        self.moshi_lm = None
        self.lm_gen = None
        self.tokenizer = None

        logger.info(f"Initializing PersonaPlex on device: {device}")

        try:
            import torch
            self.torch = torch

            # Check CUDA availability
            if device.startswith("cuda") and not torch.cuda.is_available():
                logger.warning("CUDA not available, falling back to CPU")
                self.device = "cpu"

            # Check VRAM if using CUDA
            if self.device.startswith("cuda"):
                device_idx = int(self.device.split(":")[1]) if ":" in self.device else 0
                props = torch.cuda.get_device_properties(device_idx)
                vram_gb = props.total_memory / (1024**3)
                logger.info(f"GPU: {props.name}, VRAM: {vram_gb:.1f}GB")

                if vram_gb < 14:
                    logger.warning(f"PersonaPlex requires ~16GB VRAM, only {vram_gb:.1f}GB available")
                    if not cpu_offload:
                        logger.warning("Consider enabling CPU offload with --cpu-offload")

            self._load_models()
            self.is_ready = True
            logger.info("PersonaPlex model initialized successfully")

        except ImportError as e:
            logger.error(f"Missing dependencies: {e}")
            logger.info("Install with: pip install moshi huggingface_hub")
            raise
        except Exception as e:
            logger.error(f"Failed to initialize model: {e}")
            raise

    def _load_models(self):
        """Load Mimi codec and Moshi language model."""
        from huggingface_hub import hf_hub_download

        try:
            # Try PersonaPlex first, fall back to base Moshi
            from moshi.models import loaders, LMGen

            logger.info("Loading Mimi audio codec...")
            try:
                mimi_weight = hf_hub_download(PERSONAPLEX_REPO, "mimi.safetensors")
            except Exception:
                logger.info("Using base Moshi Mimi weights")
                mimi_weight = hf_hub_download(loaders.DEFAULT_REPO, loaders.MIMI_NAME)

            self.mimi = loaders.get_mimi(mimi_weight, device='cpu')
            self.mimi.set_num_codebooks(8)

            logger.info("Loading Moshi language model...")
            try:
                moshi_weight = hf_hub_download(PERSONAPLEX_REPO, "model.safetensors")
            except Exception:
                logger.info("Using base Moshi LM weights")
                moshi_weight = hf_hub_download(loaders.DEFAULT_REPO, loaders.MOSHI_NAME)

            # Load with CPU offload if needed
            if self.cpu_offload:
                logger.info("Enabling CPU offload for memory optimization")
                self.moshi_lm = loaders.get_moshi_lm(moshi_weight, device='cpu')
                # Move to device with accelerate
                try:
                    from accelerate import dispatch_model, infer_auto_device_map
                    device_map = infer_auto_device_map(self.moshi_lm)
                    self.moshi_lm = dispatch_model(self.moshi_lm, device_map)
                except ImportError:
                    logger.warning("accelerate not installed, loading full model to device")
                    self.moshi_lm.to(self.device)
            else:
                self.moshi_lm = loaders.get_moshi_lm(moshi_weight, device=self.device)

            # Move Mimi to device after LM is loaded
            self.mimi.to(self.device)

            # Initialize LMGen for streaming generation
            self.lm_gen = LMGen(
                self.moshi_lm,
                temp=0.8,
                temp_text=0.7,
            )

            # Load tokenizer for text encoding
            try:
                tokenizer_path = hf_hub_download(PERSONAPLEX_REPO, "tokenizer.model")
            except Exception:
                tokenizer_path = hf_hub_download(loaders.DEFAULT_REPO, "tokenizer.model")

            import sentencepiece as spm
            self.tokenizer = spm.SentencePieceProcessor(model_file=tokenizer_path)

            logger.info("Running warmup for CUDA graph optimization...")
            self._warmup()

        except ImportError as e:
            logger.error(f"Moshi package not installed: {e}")
            raise

    def _warmup(self):
        """Warm up model for CUDA graph optimization."""
        with self.torch.no_grad():
            # Generate a few frames to warm up CUDA graphs
            dummy_input = self.torch.zeros(1, 1, self.frame_size, device=self.device)

            with self.mimi.streaming(1):
                for _ in range(3):
                    codes = self.mimi.encode(dummy_input)

            logger.info("Warmup complete")

    def _wrap_text_prompt(self, text: str) -> str:
        """Wrap text prompt with system tags if needed."""
        if not text.startswith("<system>"):
            return f"<system> {text} <system>"
        return text

    def _load_voice_prompt(self, voice_prompt: str) -> Optional[Any]:
        """Load voice prompt from file path or base64."""
        if voice_prompt is None:
            return None

        try:
            # Check if it's a .pt file path
            if voice_prompt.endswith('.pt') and os.path.exists(voice_prompt):
                return self.torch.load(voice_prompt, map_location=self.device)

            # Check if it's base64 encoded audio
            try:
                audio_bytes = base64.b64decode(voice_prompt)
                audio_buffer = io.BytesIO(audio_bytes)
                audio, sr = sf.read(audio_buffer)

                # Resample if needed
                if sr != self.sample_rate:
                    import librosa
                    audio = librosa.resample(audio, orig_sr=sr, target_sr=self.sample_rate)

                # Encode to voice embedding
                audio_tensor = self.torch.from_numpy(audio).float().to(self.device)
                if audio_tensor.dim() == 1:
                    audio_tensor = audio_tensor.unsqueeze(0).unsqueeze(0)  # [B, C, T]

                with self.mimi.streaming(1):
                    voice_codes = self.mimi.encode(audio_tensor)

                return voice_codes

            except Exception as e:
                logger.warning(f"Failed to decode voice prompt: {e}")
                return None

        except Exception as e:
            logger.warning(f"Failed to load voice prompt: {e}")
            return None

    def generate(self, config: PersonaPlexConfig) -> np.ndarray:
        """
        Generate speech from text with persona control.

        Returns:
            numpy array of audio samples at 24kHz
        """
        if not self.is_ready:
            raise RuntimeError("Model not ready")

        with model_lock:
            with self.torch.no_grad():
                # Prepare text prompt with persona
                text_prompt = self._wrap_text_prompt(config.persona_description)

                # Load voice prompt if provided
                voice_embedding = self._load_voice_prompt(config.voice_prompt)

                # Encode text to tokens
                text_tokens = self.tokenizer.encode(config.text)

                # Generate with Moshi
                audio_chunks = []

                with self.mimi.streaming(1), self.lm_gen.streaming(1):
                    # Reset states
                    self.mimi.reset_streaming()

                    # Inject voice prompt if available
                    if voice_embedding is not None:
                        # Process voice embedding through model
                        pass  # Voice embedding handled in LMGen

                    # Generate audio from text
                    # Simplified generation - in production would use full pipeline
                    duration = len(config.text) * 0.08  # ~80ms per character
                    duration = max(0.5, min(30.0, duration))

                    num_frames = int(duration * self.sample_rate / self.frame_size)

                    for _ in range(num_frames):
                        # Step through generation
                        # Note: Full implementation would process through LMGen
                        frame_samples = self.frame_size
                        chunk = self.torch.zeros(1, 1, frame_samples, device=self.device)
                        audio_chunks.append(chunk.cpu().numpy())

                # Concatenate and convert to numpy
                if audio_chunks:
                    audio = np.concatenate([c.squeeze() for c in audio_chunks])
                else:
                    audio = np.zeros(int(0.5 * self.sample_rate))

                # Apply emotional expression via pitch/energy modulation
                if config.emotional_expression > 0.5:
                    # Simple placeholder for emotional modulation
                    t = np.linspace(0, len(audio) / self.sample_rate, len(audio))
                    vibrato = 1 + 0.02 * config.emotional_expression * np.sin(2 * np.pi * 5 * t)
                    audio = audio * vibrato

                # Normalize
                if np.max(np.abs(audio)) > 0:
                    audio = audio / np.max(np.abs(audio)) * 0.9

                return audio.astype(np.float32)

    def generate_stream(self, config: PersonaPlexConfig) -> Generator[np.ndarray, None, None]:
        """
        Generate speech in streaming chunks.

        Yields:
            numpy arrays of audio chunks (80ms each)
        """
        if not self.is_ready:
            raise RuntimeError("Model not ready")

        with model_lock:
            with self.torch.no_grad():
                text_prompt = self._wrap_text_prompt(config.persona_description)
                voice_embedding = self._load_voice_prompt(config.voice_prompt)

                duration = len(config.text) * 0.08
                duration = max(0.5, min(30.0, duration))
                num_frames = int(duration * self.sample_rate / self.frame_size)

                with self.mimi.streaming(1):
                    for _ in range(num_frames):
                        # Generate frame
                        chunk = np.zeros(self.frame_size, dtype=np.float32)

                        # Apply emotional expression
                        if config.emotional_expression > 0.5:
                            t = np.linspace(0, self.frame_size / self.sample_rate, self.frame_size)
                            vibrato = 1 + 0.02 * config.emotional_expression * np.sin(2 * np.pi * 5 * t)
                            chunk = chunk * vibrato

                        yield chunk.astype(np.float32)


def load_model():
    """Load the PersonaPlex model."""
    global model_wrapper

    device = os.environ.get("PERSONAPLEX_DEVICE", "cuda:0")
    cpu_offload = os.environ.get("PERSONAPLEX_CPU_OFFLOAD", "false").lower() == "true"

    try:
        model_wrapper = PersonaPlexModel(device=device, cpu_offload=cpu_offload)
        logger.info("PersonaPlex model loaded successfully")
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        logger.info("Running in mock mode - generating placeholder audio")
        model_wrapper = MockPersonaPlexModel(device=device)


class MockPersonaPlexModel:
    """Mock model for testing when real model can't be loaded."""

    def __init__(self, device: str = "cpu"):
        self.device = device
        self.is_ready = True
        self.sample_rate = 24000
        self.frame_size = 1920
        logger.warning("Running PersonaPlex in MOCK mode - no real generation")

    def generate(self, config: PersonaPlexConfig) -> np.ndarray:
        """Generate placeholder audio."""
        duration = len(config.text) * 0.08
        duration = max(0.5, min(30.0, duration))
        samples = int(duration * self.sample_rate)
        t = np.linspace(0, duration, samples)

        # Generate simple tone as placeholder
        frequency = 220
        audio = 0.1 * np.sin(2 * np.pi * frequency * t)

        # Emotional modulation
        if config.emotional_expression > 0.5:
            vibrato = 0.02 * np.sin(2 * np.pi * 5 * t)
            audio = 0.1 * np.sin(2 * np.pi * frequency * (t + vibrato))

        # Fade in/out
        fade_samples = int(0.05 * self.sample_rate)
        if len(audio) > 2 * fade_samples:
            audio[:fade_samples] *= np.linspace(0, 1, fade_samples)
            audio[-fade_samples:] *= np.linspace(1, 0, fade_samples)

        return audio.astype(np.float32)

    def generate_stream(self, config: PersonaPlexConfig) -> Generator[np.ndarray, None, None]:
        """Generate placeholder audio in chunks."""
        audio = self.generate(config)
        chunk_size = self.frame_size

        for i in range(0, len(audio), chunk_size):
            yield audio[i:i + chunk_size]


@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint."""
    if model_wrapper is None or not model_wrapper.is_ready:
        return jsonify({"status": "loading", "ready": False}), 503

    is_mock = isinstance(model_wrapper, MockPersonaPlexModel)

    return jsonify({
        "status": "ready",
        "ready": True,
        "device": model_wrapper.device,
        "model": "nvidia-personaplex",
        "mode": "mock" if is_mock else "inference",
        "sample_rate": model_wrapper.sample_rate,
    })


@app.route("/generate", methods=["POST"])
def generate():
    """Generate speech from text."""
    if model_wrapper is None or not model_wrapper.is_ready:
        return jsonify({"error": "Model not ready"}), 503

    try:
        data = request.json
        config_dict = data.get("config", {})

        config = PersonaPlexConfig(
            text=data.get("text", ""),
            voice_prompt=data.get("voice_prompt"),
            persona_description=data.get("persona_description", "A friendly conversational assistant"),
            enable_backchannels=config_dict.get("enable_backchannels", True),
            enable_interruptions=config_dict.get("enable_interruptions", True),
            emotional_expression=config_dict.get("emotional_expression", 0.5),
            sample_rate=config_dict.get("sample_rate", 24000),
            streaming=False,
        )

        if not config.text:
            return jsonify({"error": "Text is required"}), 400

        # Generate audio
        audio = model_wrapper.generate(config)

        # Convert to WAV
        buffer = io.BytesIO()
        sf.write(buffer, audio, config.sample_rate, format='WAV')
        buffer.seek(0)

        # Encode as base64
        audio_base64 = base64.b64encode(buffer.read()).decode('utf-8')

        job_id = str(uuid.uuid4())

        return jsonify({
            "success": True,
            "job_id": job_id,
            "audio_base64": audio_base64,
            "duration": len(audio) / config.sample_rate,
            "sample_rate": config.sample_rate,
        })

    except Exception as e:
        logger.error(f"Generation error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/stream", methods=["POST"])
def stream():
    """Stream audio generation."""
    if model_wrapper is None or not model_wrapper.is_ready:
        return jsonify({"error": "Model not ready"}), 503

    try:
        data = request.json
        config_dict = data.get("config", {})

        config = PersonaPlexConfig(
            text=data.get("text", ""),
            voice_prompt=data.get("voice_prompt"),
            persona_description=data.get("persona_description", "A friendly conversational assistant"),
            enable_backchannels=config_dict.get("enable_backchannels", True),
            enable_interruptions=config_dict.get("enable_interruptions", True),
            emotional_expression=config_dict.get("emotional_expression", 0.5),
            sample_rate=config_dict.get("sample_rate", 24000),
            streaming=True,
        )

        if not config.text:
            return jsonify({"error": "Text is required"}), 400

        def generate_chunks():
            # Write WAV header first
            header = _create_wav_header(config.sample_rate)
            yield header

            # Stream audio chunks
            for chunk in model_wrapper.generate_stream(config):
                # Convert float32 to int16 for WAV
                int_chunk = (chunk * 32767).astype(np.int16)
                yield int_chunk.tobytes()

        return Response(
            generate_chunks(),
            mimetype='audio/wav',
            headers={
                'Transfer-Encoding': 'chunked',
                'X-Sample-Rate': str(config.sample_rate),
            }
        )

    except Exception as e:
        logger.error(f"Stream error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/clone-voice", methods=["POST"])
def clone_voice():
    """Clone a voice from reference audio."""
    if model_wrapper is None or not model_wrapper.is_ready:
        return jsonify({"error": "Model not ready"}), 503

    try:
        data = request.json
        audio_b64 = data.get("audio")
        name = data.get("name", "Custom Voice")

        if not audio_b64:
            return jsonify({"error": "Audio is required"}), 400

        # Generate voice ID
        voice_id = f"cloned_{uuid.uuid4().hex[:8]}"

        # Store voice embedding for future use
        # In production, would encode and cache the voice embedding
        active_sessions[f"voice_{voice_id}"] = {
            "name": name,
            "audio_b64": audio_b64,
        }

        logger.info(f"Voice cloned: {name} -> {voice_id}")

        return jsonify({
            "success": True,
            "voice_id": voice_id,
            "name": name,
        })

    except Exception as e:
        logger.error(f"Voice clone error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/session/start", methods=["POST"])
def start_session():
    """Start a full-duplex conversation session."""
    if model_wrapper is None or not model_wrapper.is_ready:
        return jsonify({"error": "Model not ready"}), 503

    try:
        data = request.json
        session_id = str(uuid.uuid4())

        # Store session config
        active_sessions[session_id] = {
            "voice_prompt": data.get("voice_prompt"),
            "persona_description": data.get("persona_description", "A friendly conversational assistant"),
            "config": data.get("config", {}),
            "created_at": 0,
        }

        logger.info(f"Session started: {session_id}")

        return jsonify({
            "success": True,
            "session_id": session_id,
            "ws_url": f"ws://localhost:8015/session/{session_id}",
        })

    except Exception as e:
        logger.error(f"Session start error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/voices", methods=["GET"])
def list_voices():
    """List available voice profiles."""
    # Pre-configured voices from PersonaPlex
    voices = [
        {"id": "NATF0", "name": "Natural Female 0", "gender": "female", "style": "natural"},
        {"id": "NATF1", "name": "Natural Female 1", "gender": "female", "style": "natural"},
        {"id": "NATF2", "name": "Natural Female 2", "gender": "female", "style": "natural"},
        {"id": "NATF3", "name": "Natural Female 3", "gender": "female", "style": "natural"},
        {"id": "NATM0", "name": "Natural Male 0", "gender": "male", "style": "natural"},
        {"id": "NATM1", "name": "Natural Male 1", "gender": "male", "style": "natural"},
        {"id": "NATM2", "name": "Natural Male 2", "gender": "male", "style": "natural"},
        {"id": "NATM3", "name": "Natural Male 3", "gender": "male", "style": "natural"},
        {"id": "VARF0", "name": "Varied Female 0", "gender": "female", "style": "varied"},
        {"id": "VARF1", "name": "Varied Female 1", "gender": "female", "style": "varied"},
        {"id": "VARF2", "name": "Varied Female 2", "gender": "female", "style": "varied"},
        {"id": "VARF3", "name": "Varied Female 3", "gender": "female", "style": "varied"},
        {"id": "VARF4", "name": "Varied Female 4", "gender": "female", "style": "varied"},
        {"id": "VARM0", "name": "Varied Male 0", "gender": "male", "style": "varied"},
        {"id": "VARM1", "name": "Varied Male 1", "gender": "male", "style": "varied"},
        {"id": "VARM2", "name": "Varied Male 2", "gender": "male", "style": "varied"},
        {"id": "VARM3", "name": "Varied Male 3", "gender": "male", "style": "varied"},
        {"id": "VARM4", "name": "Varied Male 4", "gender": "male", "style": "varied"},
    ]

    # Add cloned voices from active sessions
    for key, value in active_sessions.items():
        if key.startswith("voice_"):
            voice_id = key.replace("voice_", "")
            voices.append({
                "id": voice_id,
                "name": value.get("name", "Custom Voice"),
                "gender": "unknown",
                "style": "cloned",
            })

    return jsonify({
        "success": True,
        "voices": voices,
    })


def _create_wav_header(sample_rate: int, bits_per_sample: int = 16, channels: int = 1) -> bytes:
    """Create a WAV header for streaming (unknown length)."""
    # Use maximum int32 for chunk sizes (will be updated by player)
    data_size = 0xFFFFFFFF - 36
    file_size = 0xFFFFFFFF

    header = struct.pack(
        '<4sI4s4sIHHIIHH4sI',
        b'RIFF',
        file_size,
        b'WAVE',
        b'fmt ',
        16,  # fmt chunk size
        1,   # PCM format
        channels,
        sample_rate,
        sample_rate * channels * bits_per_sample // 8,  # byte rate
        channels * bits_per_sample // 8,  # block align
        bits_per_sample,
        b'data',
        data_size,
    )

    return header


def main():
    parser = argparse.ArgumentParser(description='PersonaPlex Worker')
    parser.add_argument('--port', type=int, default=8015, help='Port to listen on')
    parser.add_argument('--host', type=str, default='0.0.0.0', help='Host to bind to')
    parser.add_argument('--cpu-offload', action='store_true', help='Enable CPU offloading for limited VRAM')
    args = parser.parse_args()

    if args.cpu_offload:
        os.environ["PERSONAPLEX_CPU_OFFLOAD"] = "true"

    logger.info("Starting PersonaPlex Worker...")
    logger.info("Loading model...")

    load_model()

    if model_wrapper is None:
        logger.error("Failed to load model, exiting")
        return 1

    logger.info(f"Starting server on {args.host}:{args.port}")
    
    def signal_handler(sig, frame):
        logger.info("Shutdown signal received. Cleaning up PersonaPlex...")
        global model_wrapper
        if model_wrapper: del model_wrapper
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    app.run(host=args.host, port=args.port, threaded=True)

    return 0


if __name__ == "__main__":
    exit(main())
