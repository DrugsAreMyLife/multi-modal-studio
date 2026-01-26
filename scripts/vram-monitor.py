import time
import json
import os
import requests
import socket
import platform

# Check if we have torch or other GPU libraries
try:
    import torch
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False

API_ENDPOINT = os.getenv("VRAM_TRACKER_ENDPOINT", "http://localhost:3000/api/vram/report")
AUTH_SECRET = os.getenv("VRAM_TRACKER_SECRET", "internal_secret_change_me")
NODE_ID = socket.gethostname()
NODE_NAME = f"{platform.system()} - {NODE_ID}"

def get_vram_info():
    """Extracts VRAM usage across different platforms."""
    info = {
        "total_gb": 0,
        "used_gb": 0,
        "status": "online",
        "metadata": {}
    }
    
    try:
        # 1. Check for NVIDIA GPUs via torch
        if HAS_TORCH and torch.cuda.is_available():
            info["total_gb"] = round(torch.cuda.get_device_properties(0).total_memory / (1024**3), 2)
            info["used_gb"] = round(torch.cuda.memory_allocated(0) / (1024**3), 2)
            info["metadata"]["gpu_name"] = torch.cuda.get_device_name(0)
            return info
        
        # 2. Check for Apple Silicon (Metal) via torch (if available)
        if hasattr(torch, 'mps') and torch.backends.mps.is_available():
            # Note: PyTorch doesn't expose full VRAM info for MPS easily in standard APIs
            # We use a rough estimate or fallback to system memory for unified memory
            import psutil
            mem = psutil.virtual_memory()
            info["total_gb"] = round(mem.total / (1024**3), 2)
            info["used_gb"] = round(mem.used / (1024**3), 2)
            info["metadata"]["is_apple_silicon"] = True
            return info
            
        # Fallback to general system memory if no GPU detected
        import psutil
        mem = psutil.virtual_memory()
        info["total_gb"] = round(mem.total / (1024**3), 2)
        info["used_gb"] = round(mem.used / (1024**3), 2)
        info["metadata"]["fallback_mode"] = "cpu_ram"
        
    except Exception as e:
        info["status"] = "error"
        info["metadata"]["error"] = str(e)
        
    return info

def report_telemetry():
    """Sends telemetry data to the backend."""
    print(f"[*] Starting VRAM monitor on {NODE_ID}...")
    while True:
        try:
            data = get_vram_info()
            payload = {
                "node_id": NODE_ID,
                "name": NODE_NAME,
                "gpu_vram_total_gb": data["total_gb"],
                "gpu_vram_used_gb": data["used_gb"],
                "status": data["status"],
                "metadata": data["metadata"]
            }
            
            response = requests.post(
                API_ENDPOINT,
                json=payload,
                headers={"Authorization": f"Bearer {AUTH_SECRET}"}
            )
            
            if response.status_code != 200:
                print(f"[!] Failed to report: {response.status_code} - {response.text}")
            
        except Exception as e:
            print(f"[!] Error reporting telemetry: {e}")
            
        time.sleep(30) # Report every 30 seconds

if __name__ == "__main__":
    report_telemetry()
