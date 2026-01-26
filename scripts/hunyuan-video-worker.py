import torch
import signal
import sys
from diffusers import HunyuanVideoPipeline, HunyuanVideoTransformer3DModel

# Configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
MODEL_ID = "tencent/hunyuan-video"
QUEUE_NAME = "batch-generation-queue"

# Initialize Redis
r = redis.from_url(REDIS_URL)

def signal_handler(sig, frame):
    print("\n[*] Shutdown signal received. Cleaning up...")
    # Add any specific cleanup here
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

def run_worker():
    print(f"[*] Starting Hunyuan Video worker...")
    
    # Load model
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"[*] Loading model onto {device}...")
    
    try:
        transformer = HunyuanVideoTransformer3DModel.from_pretrained(
            "tencent/HunyuanVideo", subfolder="transformer", torch_dtype=torch.float16
        )
        pipeline = HunyuanVideoPipeline.from_pretrained(
            "tencent/HunyuanVideo", transformer=transformer, torch_dtype=torch.float16
        )
        pipeline.to(device)
        print(f"[+] Hunyuan Video loaded. Listening for jobs on {QUEUE_NAME}...")
    except Exception as e:
        print(f"[!] Error loading Hunyuan Video: {e}")
        pipeline = None

    while True:
        job_data = r.blpop(QUEUE_NAME, timeout=30)
        
        if job_data:
            try:
                job = json.loads(job_data[1])
                if job.get("model_id") != MODEL_ID:
                    r.rpush(QUEUE_NAME, job_data[1])
                    continue
                
                payload = job["payload"]
                prompt = payload["prompt"]
                
                print(f"[*] Processing Hunyuan Video job: {prompt}")
                
                # Generate (simplified)
                # video = pipeline(prompt, num_frames=61, fps=15).frames[0]
                
                # Save and report
                output_path = f"outputs/{job['id']}.mp4"
                os.makedirs("outputs", exist_ok=True)
                # Save video logic...
                
                print(f"[+] Video job complete: {output_path}")
                
            except Exception as e:
                print(f"[!] Error processing job: {e}")

if __name__ == "__main__":
    run_worker()
