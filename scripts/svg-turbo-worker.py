import time
import json
import os
import redis
import torch

# Configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
MODEL_ID = "local/svg-turbo"
QUEUE_NAME = "batch-generation-queue"

# Initialize Redis
r = redis.from_url(REDIS_URL)

def run_worker():
    print(f"[*] Starting SVG Turbo worker...")
    
    # In a real scenario, load a specialized SVG generation model
    print(f"[*] Loading SVG-Turbo-v1 pipeline...")
    
    while True:
        job_data = r.blpop(QUEUE_NAME, timeout=30)
        
        if job_data:
            try:
                job = json.loads(job_data[1])
                if job.get("model_id") != MODEL_ID:
                    r.rpush(QUEUE_NAME, job_data[1])
                    continue
                
                prompt = job["payload"]["prompt"]
                print(f"[*] Generating SVG for: {prompt}")
                
                # SVG Generation logic
                svg_content = f'<svg width="100" height="100"><text x="10" y="50">{prompt}</text></svg>'
                
                # Save
                output_path = f"outputs/{job['id']}.svg"
                os.makedirs("outputs", exist_ok=True)
                with open(output_path, "w") as f:
                    f.write(svg_content)
                
                print(f"[+] SVG generated: {output_path}")
                
            except Exception as e:
                print(f"[!] Error: {e}")

if __name__ == "__main__":
    run_worker()
