# GPU Workstation Setup for k3s Cluster (Windows 11 + WSL2)
# Run this script in PowerShell as Administrator on each GPU workstation

param(
    [Parameter(Mandatory=$true)]
    [string]$NodeName,  # e.g., "gpu-5090" or "gpu-4090"

    [Parameter(Mandatory=$true)]
    [string]$K3sServerUrl,  # e.g., "https://10.0.0.20:6443"

    [Parameter(Mandatory=$true)]
    [string]$K3sToken  # Get from node1: sudo cat /var/lib/rancher/k3s/server/node-token
)

$ErrorActionPreference = "Stop"

Write-Host "=== GPU Workstation Setup for k3s (WSL2) ===" -ForegroundColor Cyan
Write-Host "Node: $NodeName"
Write-Host "Server: $K3sServerUrl"

# Step 1: Check NVIDIA Driver
Write-Host "`n[1/6] Checking NVIDIA Driver..." -ForegroundColor Yellow
$nvidiaSmi = Get-Command nvidia-smi -ErrorAction SilentlyContinue
if (-not $nvidiaSmi) {
    Write-Host "ERROR: NVIDIA driver not installed. Install from https://www.nvidia.com/drivers" -ForegroundColor Red
    exit 1
}
$gpuInfo = nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv,noheader
Write-Host "GPU Detected: $gpuInfo" -ForegroundColor Green

# Step 2: Check WSL2
Write-Host "`n[2/6] Checking WSL2..." -ForegroundColor Yellow
$wslStatus = wsl --status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "WSL2 not properly configured. Running setup..." -ForegroundColor Yellow
    wsl --install --no-distribution
    Write-Host "Please reboot and run this script again." -ForegroundColor Red
    exit 1
}
Write-Host "WSL2 OK" -ForegroundColor Green

# Step 3: Install/Update Ubuntu WSL
Write-Host "`n[3/6] Setting up Ubuntu 22.04 WSL..." -ForegroundColor Yellow
$ubuntuInstalled = wsl -l -v | Select-String "Ubuntu-22.04"
if (-not $ubuntuInstalled) {
    Write-Host "Installing Ubuntu 22.04..." -ForegroundColor Yellow
    wsl --install -d Ubuntu-22.04
    Write-Host "Ubuntu installed. Please complete initial setup, then run this script again." -ForegroundColor Yellow
    exit 0
}
Write-Host "Ubuntu 22.04 OK" -ForegroundColor Green

# Step 4: Configure WSL for GPU and systemd
Write-Host "`n[4/6] Configuring WSL for GPU support..." -ForegroundColor Yellow

$wslConf = @"
[wsl2]
memory=32GB
processors=8
swap=8GB
localhostForwarding=true

[boot]
systemd=true
"@

$wslConfPath = "$env:USERPROFILE\.wslconfig"
Set-Content -Path $wslConfPath -Value $wslConf
Write-Host "WSL config written to $wslConfPath" -ForegroundColor Green

# Step 5: Setup inside WSL
Write-Host "`n[5/6] Setting up k3s agent inside WSL..." -ForegroundColor Yellow

$wslSetupScript = @"
#!/bin/bash
set -e

echo "=== WSL2 k3s Agent Setup ==="

# Update system
sudo apt-get update
sudo apt-get install -y curl apt-transport-https ca-certificates gnupg

# Install NVIDIA Container Toolkit
echo "Installing NVIDIA Container Toolkit..."
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | \
    sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
    sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
sudo apt-get update
sudo apt-get install -y nvidia-container-toolkit

# Verify GPU access in WSL
echo "Verifying GPU access..."
nvidia-smi

# Install k3s agent
echo "Installing k3s agent..."
curl -sfL https://get.k3s.io | K3S_URL="$K3sServerUrl" K3S_TOKEN="$K3sToken" K3S_NODE_NAME="$NodeName" sh -s - agent \
    --node-label "nvidia.com/gpu.present=true" \
    --node-label "node-role.kubernetes.io/gpu-worker=true"

# Configure containerd for NVIDIA runtime
echo "Configuring containerd for NVIDIA..."
sudo nvidia-ctk runtime configure --runtime=containerd
sudo systemctl restart k3s-agent

echo "=== Setup Complete ==="
echo "Run 'kubectl get nodes' on the control plane to verify."
"@

# Write script to temp file and execute in WSL
$tempScript = [System.IO.Path]::GetTempFileName() + ".sh"
$wslSetupScript = $wslSetupScript.Replace('$K3sServerUrl', $K3sServerUrl).Replace('$K3sToken', $K3sToken).Replace('$NodeName', $NodeName)
Set-Content -Path $tempScript -Value $wslSetupScript -NoNewline

# Convert Windows path to WSL path
$wslTempScript = wsl wslpath -a $tempScript.Replace('\', '/')

Write-Host "Running setup script in WSL..."
wsl -d Ubuntu-22.04 bash $wslTempScript

# Cleanup
Remove-Item $tempScript -ErrorAction SilentlyContinue

# Step 6: Final instructions
Write-Host "`n[6/6] Post-Setup Instructions" -ForegroundColor Yellow
Write-Host @"

=== IMPORTANT: Windows Startup Configuration ===

To ensure k3s agent starts automatically when Windows boots:

1. Create a scheduled task to start WSL:
   - Open Task Scheduler
   - Create Basic Task: "Start WSL k3s"
   - Trigger: At startup
   - Action: Start a program
   - Program: wsl.exe
   - Arguments: -d Ubuntu-22.04 -- sudo systemctl start k3s-agent

2. Or add to Windows Terminal startup:
   wsl -d Ubuntu-22.04 -- sudo systemctl start k3s-agent

=== Verify Setup ===

On node1 (10.0.0.20), run:
   kubectl get nodes
   kubectl describe node $NodeName | grep -A5 "Capacity:"

You should see nvidia.com/gpu: 1 in the node capacity.

"@ -ForegroundColor Cyan

Write-Host "Setup complete!" -ForegroundColor Green
