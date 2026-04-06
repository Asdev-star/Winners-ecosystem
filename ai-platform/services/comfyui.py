# winners-ecosystem/ai-platform/services/comfyui.py
import os
import httpx
import json
import uuid
from typing import Dict, Any, Optional

class ComfyUIService:
    def __init__(self, host: str = None):
        self.host = host or os.getenv("COMFYUI_HOST", "http://localhost:8188")

    async def generate_image(self, prompt: str, negative_prompt: str = "", model: str = "v1-5-pruned-emaonly.safetensors") -> Dict[str, Any]:
        """Generate image using local ComfyUI API"""
        client_id = str(uuid.uuid4())
        
        # This is a simplified workflow prompt for ComfyUI
        workflow = {
            "3": {
                "inputs": {
                    "seed": 12345,
                    "steps": 20,
                    "cfg": 8,
                    "sampler_name": "euler",
                    "scheduler": "normal",
                    "denoise": 1,
                    "model": ["4", 0],
                    "positive": ["6", 0],
                    "negative": ["7", 0],
                    "latent_image": ["5", 0]
                },
                "class_type": "KSampler"
            },
            "4": {
                "inputs": {
                    "ckpt_name": model
                },
                "class_type": "CheckpointLoaderSimple"
            },
            "5": {
                "inputs": {
                    "width": 512,
                    "height": 512,
                    "batch_size": 1
                },
                "class_type": "EmptyLatentImage"
            },
            "6": {
                "inputs": {
                    "text": prompt,
                    "clip": ["4", 1]
                },
                "class_type": "CLIPTextEncode"
            },
            "7": {
                "inputs": {
                    "text": negative_prompt,
                    "clip": ["4", 1]
                },
                "class_type": "CLIPTextEncode"
            },
            "8": {
                "inputs": {
                    "samples": ["3", 0],
                    "vae": ["4", 2]
                },
                "class_type": "VAEDecode"
            },
            "9": {
                "inputs": {
                    "filename_prefix": "WinnersAI",
                    "images": ["8", 0]
                },
                "class_type": "SaveImage"
            }
        }

        try:
            async with httpx.AsyncClient() as client:
                p = {"prompt": workflow, "client_id": client_id}
                response = await client.post(f"{self.host}/prompt", json=p, timeout=120.0)
                response.raise_for_status()
                return response.json()
    async def get_history(self, prompt_id: str) -> Dict[str, Any]:
        """Get generation history for a specific prompt ID"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.host}/history/{prompt_id}", timeout=10.0)
                if response.status_code == 200:
                    data = response.json()
                    # Return the prompt data if it exists
                    if prompt_id in data:
                        return {prompt_id: data[prompt_id]}
                    return {"status": "not_found"}
                return {"status": "error", "code": response.status_code}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    async def get_system_stats(self) -> Dict[str, Any]:
        """Fetch system stats from ComfyUI"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.host}/system_stats", timeout=5.0)
                if response.status_code == 200:
                    return response.json()
                return {"status": "unavailable"}
        except Exception:
            return {"status": "error"}

comfyui_service = ComfyUIService()
