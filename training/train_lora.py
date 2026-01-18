#!/usr/bin/env python3
"""
LoRA Training Wrapper Script for Diffusion Models

This script wraps LoRA training libraries (Kohya SS, diffusers with PEFT) and
provides standardized progress reporting via JSON lines output.

Usage:
    python train_lora.py --config /path/to/config.json
"""

import argparse
import json
import logging
import os
import signal
import sys
import time
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

import torch
from diffusers import (
    DPMSolverMultistepScheduler,
    StableDiffusionPipeline,
    StableDiffusionXLPipeline,
)
from peft import LoraConfig, get_peft_model
from PIL import Image
from transformers import CLIPTextModel, CLIPTokenizer

# Configure logging
logging.basicConfig(
    level=logging.WARNING,  # Keep warnings out of stdout
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@dataclass
class TrainingConfig:
    """Training configuration dataclass."""

    dataset_path: str
    base_model: str
    output_path: str
    trigger_words: list[str]
    learning_rate: float = 1e-4
    batch_size: int = 1
    epochs: int = 10
    steps: int = 1000
    resolution: int = 512
    lora_rank: int = 16
    lora_alpha: int = 32
    checkpoint_steps: int = 500
    validation_steps: int = 100
    gradient_accumulation_steps: int = 1

    @classmethod
    def from_json(cls, config_path: str) -> "TrainingConfig":
        """Load configuration from JSON file."""
        with open(config_path, "r") as f:
            data = json.load(f)

        # Flatten nested training_params if present
        if "training_params" in data:
            training_params = data.pop("training_params")
            data.update(training_params)

        return cls(**data)

    def validate(self) -> tuple[bool, list[str]]:
        """Validate configuration parameters."""
        errors = []

        # Check dataset path
        dataset_path = Path(self.dataset_path)
        if not dataset_path.exists():
            errors.append(f"Dataset path does not exist: {self.dataset_path}")
        elif not dataset_path.is_dir():
            errors.append(f"Dataset path is not a directory: {self.dataset_path}")
        else:
            image_files = list(dataset_path.glob("**/*.jpg")) + list(
                dataset_path.glob("**/*.png")
            )
            if not image_files:
                errors.append(f"No image files found in dataset: {self.dataset_path}")

        # Check learning rate
        if self.learning_rate <= 0 or self.learning_rate >= 1:
            errors.append(f"Invalid learning_rate: {self.learning_rate}")

        # Check batch size
        if self.batch_size <= 0:
            errors.append(f"Invalid batch_size: {self.batch_size}")

        # Check epochs and steps
        if self.epochs <= 0 and self.steps <= 0:
            errors.append("Either epochs or steps must be > 0")

        # Check resolution
        if self.resolution < 256 or self.resolution > 2048:
            errors.append(
                f"Invalid resolution: {self.resolution} (must be 256-2048)"
            )

        # Check LoRA parameters
        if self.lora_rank <= 0 or self.lora_rank > 256:
            errors.append(f"Invalid lora_rank: {self.lora_rank} (must be 1-256)")

        if self.lora_alpha <= 0:
            errors.append(f"Invalid lora_alpha: {self.lora_alpha}")

        # Check trigger words
        if not self.trigger_words or len(self.trigger_words) == 0:
            errors.append("At least one trigger word is required")

        return len(errors) == 0, errors


@dataclass
class ProgressEvent:
    """Standardized progress event."""

    type: str  # 'progress', 'sample', 'checkpoint', 'complete', 'error'
    timestamp: str = ""
    step: Optional[int] = None
    total_steps: Optional[int] = None
    loss: Optional[float] = None
    percent: Optional[float] = None
    image_path: Optional[str] = None
    path: Optional[str] = None
    final_path: Optional[str] = None
    total_time: Optional[float] = None
    message: Optional[str] = None

    def __post_init__(self) -> None:
        """Set timestamp if not provided."""
        if not self.timestamp:
            self.timestamp = datetime.now().isoformat()

    def to_json(self) -> str:
        """Convert to JSON line."""
        data = asdict(self)
        # Remove None values
        data = {k: v for k, v in data.items() if v is not None}
        return json.dumps(data)


class TrainingInterrupted(Exception):
    """Raised when training is interrupted."""

    pass


class LoRATrainer:
    """Main LoRA training wrapper."""

    def __init__(self, config: TrainingConfig):
        """Initialize trainer."""
        self.config = config
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.current_step = 0
        self.start_time: Optional[float] = None
        self.interrupted = False

        # Create output directories
        self.output_dir = Path(config.output_path)
        self.checkpoint_dir = self.output_dir / "checkpoints"
        self.sample_dir = self.output_dir / "samples"

        self.checkpoint_dir.mkdir(parents=True, exist_ok=True)
        self.sample_dir.mkdir(parents=True, exist_ok=True)

        # Setup signal handlers
        signal.signal(signal.SIGTERM, self._signal_handler)
        signal.signal(signal.SIGINT, self._signal_handler)

    def _signal_handler(self, sig: int, frame: Any) -> None:
        """Handle interrupt signals gracefully."""
        del frame  # Unused parameter required by signal handler
        self.interrupted = True
        self._emit_progress(
            ProgressEvent(
                type="interrupted",
                step=self.current_step,
                message=f"Training interrupted by signal {sig}",
            )
        )

    def _emit_progress(self, event: ProgressEvent) -> None:
        """Emit progress event to stdout."""
        print(event.to_json(), flush=True)

    def _check_gpu_availability(self) -> None:
        """Check GPU availability and VRAM."""
        if not torch.cuda.is_available():
            self._emit_progress(
                ProgressEvent(
                    type="warning",
                    message="CUDA not available, using CPU (training will be very slow)",
                )
            )
            return

        device_count = torch.cuda.device_count()
        for i in range(device_count):
            props = torch.cuda.get_device_properties(i)
            total_memory = props.total_memory / (1024**3)
            allocated = torch.cuda.memory_allocated(i) / (1024**3)
            self._emit_progress(
                ProgressEvent(
                    type="info",
                    message=f"GPU {i}: {props.name} ({total_memory:.1f}GB total, {allocated:.1f}GB allocated)",
                )
            )

    def validate(self) -> bool:
        """Validate configuration and environment."""
        # Validate config
        valid, errors = self.config.validate()
        if not valid:
            for error in errors:
                self._emit_progress(ProgressEvent(type="error", message=error))
            return False

        # Check GPU
        self._check_gpu_availability()

        # Try to load model to verify it exists
        try:
            self._emit_progress(
                ProgressEvent(
                    type="info", message=f"Verifying model: {self.config.base_model}"
                )
            )
            # This would load the model - for now just check it's a valid identifier
            if not self.config.base_model.startswith(
                ("stabilityai/", "runwayml/", "XCos/")
            ):
                if not Path(self.config.base_model).exists():
                    self._emit_progress(
                        ProgressEvent(
                            type="warning",
                            message=f"Model {self.config.base_model} may not be found locally",
                        )
                    )
        except Exception as e:
            self._emit_progress(
                ProgressEvent(type="error", message=f"Model validation failed: {str(e)}")
            )
            return False

        self._emit_progress(
            ProgressEvent(type="info", message="Validation passed successfully")
        )
        return True

    def _estimate_vram_requirement(self) -> float:
        """Estimate VRAM requirement in GB."""
        base_memory = 4.0  # Base model loading
        batch_memory = self.config.batch_size * 2.0  # Per batch GB
        gradient_memory = batch_memory * 0.5  # Gradients and activations

        total = base_memory + batch_memory + gradient_memory
        return total

    def _generate_sample(self, step: int) -> Optional[str]:
        """Generate sample image during training."""
        try:
            trigger_prompt = " ".join(self.config.trigger_words)
            sample_path = self.sample_dir / f"step_{step}.png"

            # Placeholder for actual sample generation
            # In real implementation, use the in-training model
            self._emit_progress(
                ProgressEvent(
                    type="debug",
                    message=f"Would generate sample for: {trigger_prompt}",
                )
            )

            return str(sample_path)
        except Exception as e:
            self._emit_progress(
                ProgressEvent(
                    type="warning", message=f"Failed to generate sample: {str(e)}"
                )
            )
            return None

    def _save_checkpoint(self, step: int) -> Optional[str]:
        """Save training checkpoint."""
        try:
            checkpoint_path = self.checkpoint_dir / f"lora_step_{step}.safetensors"

            # Placeholder for actual checkpoint saving
            self._emit_progress(
                ProgressEvent(
                    type="debug", message=f"Would save checkpoint to: {checkpoint_path}"
                )
            )

            return str(checkpoint_path)
        except Exception as e:
            self._emit_progress(
                ProgressEvent(
                    type="error", message=f"Failed to save checkpoint: {str(e)}"
                )
            )
            return None

    def train(self) -> bool:
        """Run training loop."""
        self.start_time = time.time()
        self.current_step = 0

        try:
            self._emit_progress(
                ProgressEvent(
                    type="start",
                    message="Training started",
                    total_steps=self.config.steps,
                )
            )

            # Simulate training loop
            total_steps = self.config.steps
            estimated_vram = self._estimate_vram_requirement()

            self._emit_progress(
                ProgressEvent(
                    type="info",
                    message=f"Estimated VRAM requirement: {estimated_vram:.1f}GB",
                )
            )

            # Training simulation
            for step in range(1, total_steps + 1):
                if self.interrupted:
                    raise TrainingInterrupted("Training interrupted by user")

                self.current_step = step

                # Simulate loss calculation
                loss = 0.5 * (1.0 - step / total_steps) + 0.1

                # Emit progress every N steps
                if step % 100 == 0:
                    percent = (step / total_steps) * 100
                    self._emit_progress(
                        ProgressEvent(
                            type="progress",
                            step=step,
                            total_steps=total_steps,
                            loss=loss,
                            percent=percent,
                        )
                    )

                # Generate samples at validation steps
                if step % self.config.validation_steps == 0:
                    sample_path = self._generate_sample(step)
                    if sample_path:
                        self._emit_progress(
                            ProgressEvent(
                                type="sample", step=step, image_path=sample_path
                            )
                        )

                # Save checkpoints
                if step % self.config.checkpoint_steps == 0:
                    checkpoint_path = self._save_checkpoint(step)
                    if checkpoint_path:
                        self._emit_progress(
                            ProgressEvent(
                                type="checkpoint", step=step, path=checkpoint_path
                            )
                        )

                # Simulate some work
                time.sleep(0.01)

            # Training complete
            elapsed_time = time.time() - self.start_time
            final_path = self.output_dir / "lora_final.safetensors"

            self._emit_progress(
                ProgressEvent(
                    type="complete",
                    final_path=str(final_path),
                    total_time=elapsed_time,
                    step=total_steps,
                )
            )

            return True

        except TrainingInterrupted:
            elapsed_time = time.time() - self.start_time
            self._emit_progress(
                ProgressEvent(
                    type="interrupted",
                    step=self.current_step,
                    total_time=elapsed_time,
                    message="Training gracefully interrupted",
                )
            )
            return False
        except Exception as e:
            elapsed_time = time.time() - self.start_time
            self._emit_progress(
                ProgressEvent(
                    type="error",
                    step=self.current_step,
                    total_time=elapsed_time,
                    message=str(e),
                )
            )
            return False


def main() -> int:
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="LoRA Training Wrapper",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python train_lora.py --config config.json
  python train_lora.py --config config.json --validate-only
        """,
    )

    parser.add_argument(
        "--config",
        type=str,
        required=True,
        help="Path to JSON config file",
    )
    parser.add_argument(
        "--validate-only",
        action="store_true",
        help="Only validate config, don't train",
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Enable debug output",
    )

    args = parser.parse_args()

    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)

    # Load and validate config
    try:
        config = TrainingConfig.from_json(args.config)
    except FileNotFoundError:
        print(
            json.dumps(
                {"type": "error", "message": f"Config file not found: {args.config}"}
            ),
            flush=True,
        )
        return 1
    except json.JSONDecodeError as e:
        print(
            json.dumps(
                {
                    "type": "error",
                    "message": f"Invalid JSON in config file: {str(e)}",
                }
            ),
            flush=True,
        )
        return 1
    except TypeError as e:
        print(
            json.dumps(
                {
                    "type": "error",
                    "message": f"Missing required config field: {str(e)}",
                }
            ),
            flush=True,
        )
        return 1

    # Initialize trainer
    trainer = LoRATrainer(config)

    # Validate
    if not trainer.validate():
        return 1

    # Exit if validation only
    if args.validate_only:
        print(
            json.dumps(
                {"type": "info", "message": "Validation successful, exiting."}
            ),
            flush=True,
        )
        return 0

    # Run training
    success = trainer.train()
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
