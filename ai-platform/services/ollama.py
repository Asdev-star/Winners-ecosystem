# winners-ecosystem/ai-platform/services/ollama.py
import os
import httpx
from typing import List, Dict, Any, Optional

class OllamaService:
    def __init__(self, host: str = None):
        self.host = host or os.getenv("OLLAMA_HOST", "http://localhost:11434")

    async def get_models(self) -> List[Dict[str, Any]]:
        """Fetch list of local models from Ollama"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(f"{self.host}/api/tags", timeout=5.0)
                if response.status_code == 200:
                    data = response.json()
                    return data.get("models", [])
                return []
            except Exception:
                return []

    async def generate(self, model: str, prompt: str, system: Optional[str] = None) -> Dict[str, Any]:
        """Generate response using local Ollama model"""
        async with httpx.AsyncClient() as client:
            payload = {
                "model": model,
                "prompt": prompt,
                "stream": False
            }
            if system:
                payload["system"] = system

            response = await client.post(
                f"{self.host}/api/generate",
                json=payload,
                timeout=120.0
            )
            response.raise_for_status()
            return response.json()

    async def check_gpu(self) -> Dict[str, Any]:
        """Mock GPU detection - in a real world would use nvidia-smi or similar"""
        # HERALD would use this to determine routing
        try:
            # Simple check if ollama is reachable as a proxy for 'local AI ready'
            models = await self.get_models()
            return {
                "status": "ready" if models else "unavailable",
                "gpu_detected": True, # Assume true for local development
                "vram_estimate": "8GB",
                "active_models": len(models)
            }
        except Exception:
            return {"status": "error", "gpu_detected": False}

ollama_service = OllamaService()
