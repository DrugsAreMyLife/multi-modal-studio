# PROJECT ORCHESTRATION: Multi-Modal Generation Studio

This document serves as the high-level "Mental Model" for AI Orchestrators. It defines the studio's end-to-end capabilities, hardware hooks, and multi-modal synthesis pathways.

## 🛠️ Core Studio Nodes

### 1. Lexicon Engine (The Scripting Layer)

- **Role:** Text-to-Script orchestration.
- **Primary Logic:** Converts raw user ideas into structured pharmaceutical or educational scripts.
- **Outputs:** Markdown scripts, prompt templates for Dimension & Acoustic Forge.

### 2. Dimension Studio (The 3D Layer)

- **Role:** High-precision industrial 3D synthesis.
- **Vision Models:**
  - **Meta SAM-v3:** Zero-shot object segmentation.
  - **Tencent Hunyuan-3D V2:** High-nuance involute surface reconstruction (Precision).
  - **Alibaba Qwen-Geo:** Mechanical constraint verification (Industrial).
- **Features:** Blueprint Mode (±0.005mm), Photogrammetry, Depth Mapping, Live Blender Sync.

### 3. Forge Fabrication (The Physical Layer)

- **Role:** Hardware prep and structural validation.
- **Bambu Lab X1C Integration:** Native support for X1C-Carbon via LAN.
- **Integrity Logic:** Finite Element Analysis (FEA) simulation for torque/shear loads.
- **Output:** Validated G-Code "Baking" for Carbon Fiber-Steel composites.

### 4. Acoustic Forge (The Voice Layer)

- **Role:** AI Voice Cloning & Medical Narration.
- **Model:** `NICK_HYBRID (V3)` - Zero-shot medical-grade vocal identity.
- **Prosody:** Academic pharmaceutical dialectic weights.
- **Security:** Biometric session-locking for "Nick" identity.

---

## 🚀 End-to-End Workflow Definition

### Workflow A: "The Industrial Pivot" (Hardware Replication)

1.  **Input:** User places defective part on document scanner.
2.  **Synthesis:** AI uses **Dimension Studio (Hunyuan-3D)** to isolate the 3D topology.
3.  **Refinement:** AI applies **Lexicon Engine** rules for structural reinforcement (Wall Loops/Gyroid).
4.  **Validation:** AI executes **Forge Fabrication (FEA)** stress simulation.
5.  **Execution:** AI "Bakes" G-Code and streamers to **Bambu X1C** for CF-Steel fabrication.

### Workflow B: "The Medical Educator" (Content Production)

1.  **Input:** Topic (e.g., "Compounding Estradiol").
2.  **Scripting:** **Lexicon Engine** generates a clinically audited script.
3.  **Voice:** **Acoustic Forge** synthesizes narration using the **Nick Hybrid** clone.
4.  **Visuals:** **Dimension Studio** generates a 3D medical-grade prop (e.g., mixing blade) to represent the topic.

---

## 📝 Orchestration Tokens (AIGUIDE)

- Use `@orchestration-role` tags in source code to find component entry points.
- Prioritize `PROJECT_ORCHESTRATION.md` for any workflow involving multi-node handshakes.
