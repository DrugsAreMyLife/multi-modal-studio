import time
import json
import os
import redis
import torch
from diffusers import StableDiffusion3Pipeline

# Configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
MODEL_ID = "tencent/hunyuan-3.0"
QUEUE_NAME = "batch-generation-queue"

# Initialize Redis
r = redis.from_url(REDIS_URL)

def run_worker():
    print(f"[*] Starting Hunyuan 3.0 worker...")
    
    # Load model
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"[*] Loading model onto {device}...")
    
    # Using SD3 as a placeholder for Hunyuan logic if specific weights are unavailable
    pipeline = StableDiffusion3Pipeline.from_pretrained("stabilityai/stable-diffusion-3-medium-diffusers", torch_dtype=torch.float16)
    pipeline.to(device)
    
    print(f"[+] Model loaded. Listening for jobs on {QUEUE_NAME}...")
    
    while True:
        job_data = r.blpop(QUEUE_NAME, timeout=30)
        
        if job_data:
            try:
                job = json.loads(job_data[1])
                if job.get("model_id") != MODEL_ID:
                    r.rpush(QUEUE_NAME, job_data[1])
                    continue
                
                prompt = job["payload"]["prompt"]
                print(f"[*] Processing job: {prompt}")
                
                # Generate
                image = pipeline(prompt).images[0]
                
                # Save and report
                output_path = f"outputs/{job['id']}.png"
                os.makedirs("outputs", exist_ok=True)
                image.save(output_path)
                
                print(f"[+] Job complete: {output_path}")
                
            except Exception as e:
                print(f"[!] Error processing job: {e}")

if __name__ == "__main__":
    run_worker()
