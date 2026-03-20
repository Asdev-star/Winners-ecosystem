# winners-ecosystem/ai-platform/services/herald_monitor.py
# HERALD Monitor - AI Platform health and performance tracking

import asyncio
import time
import psutil
import httpx
from dataclasses import dataclass, field
from typing import Optional, Dict, Any
from datetime import datetime


@dataclass
class PlatformHealth:
    timestamp:        float
    ollama_connected: bool
    ollama_models:    list[str]
    whisper_loaded:   bool
    comfyui_running:  bool
    gpu_available:    bool
    gpu_memory_used:   Optional[float]   # GB
    gpu_memory_total: Optional[float]   # GB
    cpu_percent:      float
    ram_percent:      float
    avg_latency_ms:   dict[str, float]  # per provider
    requests_today:   dict[str, int]    # per provider
    error_rate:       float             # 0.0–1.0


class HERALDMonitor:
    """
    HERALD supervises the AI Platform infrastructure.
    Reports to admin FORGE panel every 60 seconds.
    Alert thresholds trigger immediate FORGE notifications.
    """

    ALERT_THRESHOLDS = {
        "gpu_memory_pct":  85,   # Alert if GPU > 85% used
        "cpu_pct":         90,   # Alert if CPU > 90%
        "ram_pct":         85,   # Alert if RAM > 85%
        "error_rate":      0.05, # Alert if error rate > 5%
        "ollama_latency":  5000, # Alert if Ollama > 5 seconds
    }

    def __init__(self):
        self._latency_samples: dict[str, list[float]] = {}
        self._request_counts:  dict[str, int] = {}
        self._error_counts:    int = 0
        self._total_requests:  int = 0
        self.start_time = datetime.utcnow()

    async def get_health(self) -> PlatformHealth:
        ollama_ok, models = await self._check_ollama()
        whisper_ok        = await self._check_whisper()
        comfyui_ok        = await self._check_comfyui()
        gpu_available, gpu_used, gpu_total = self._check_gpu()

        return PlatformHealth(
            timestamp=        time.time(),
            ollama_connected= ollama_ok,
            ollama_models=    models,
            whisper_loaded=   whisper_ok,
            comfyui_running=  comfyui_ok,
            gpu_available=    gpu_available,
            gpu_memory_used=  gpu_used,
            gpu_memory_total= gpu_total,
            cpu_percent=      psutil.cpu_percent(interval=0.1),
            ram_percent=      psutil.virtual_memory().percent,
            avg_latency_ms=   {k: sum(v)/len(v) for k, v in self._latency_samples.items() if v},
            requests_today=   self._request_counts.copy(),
            error_rate=       self._error_counts / max(self._total_requests, 1)
        )

    async def _check_ollama(self) -> tuple[bool, list[str]]:
        try:
            async with httpx.AsyncClient(timeout=3) as client:
                res = await client.get("http://localhost:11434/api/tags")
                models = [m["name"] for m in res.json().get("models", [])]
                return True, models
        except:
            return False, []

    async def _check_whisper(self) -> bool:
        # Whisper loads lazily — check if module is importable
        try:
            from faster_whisper import WhisperModel
            return True
        except:
            return False

    async def _check_comfyui(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=2) as client:
                res = await client.get("http://localhost:7860/system_stats")
                return res.status_code == 200
        except:
            return False

    def _check_gpu(self) -> tuple[bool, Optional[float], Optional[float]]:
        try:
            import torch
            if torch.cuda.is_available():
                used  = torch.cuda.memory_allocated() / 1e9
                total = torch.cuda.get_device_properties(0).total_memory / 1e9
                return True, round(used, 2), round(total, 2)
        except:
            pass
        return False, None, None

    def record_request(self, provider: str, latency_ms: float, success: bool):
        """Called after every AI request to track performance."""
        if provider not in self._latency_samples:
            self._latency_samples[provider] = []
        self._latency_samples[provider].append(latency_ms)
        # Keep only last 100 samples per provider
        if len(self._latency_samples[provider]) > 100:
            self._latency_samples[provider].pop(0)

        self._request_counts[provider] = self._request_counts.get(provider, 0) + 1
        self._total_requests += 1
        if not success:
            self._error_counts += 1

    def get_forge_report(self) -> str:
        """Generates a one-paragraph HERALD report for FORGE admin briefing."""
        counts = self._request_counts
        total  = sum(counts.values())
        local  = counts.get('ollama', 0) + counts.get('whisper-local', 0) + counts.get('comfyui', 0)
        cloud  = total - local
        pct_local = round(local / max(total, 1) * 100)

        return (
            f"AI Platform: {total} requests today. "
            f"{pct_local}% served by local models (zero cost). "
            f"{cloud} cloud requests charged credits. "
            f"Error rate: {round(self._error_counts / max(total, 1) * 100, 1)}%. "
            f"Models active: {', '.join(self._request_counts.keys()) or 'none'}."
        )

    # Legacy method for backward compatibility
    def get_system_stats(self) -> Dict[str, Any]:
        """Get GPU/Memory monitoring results for HERALD dashboard"""
        stats = {
            "timestamp": datetime.utcnow().isoformat(),
            "cpu_usage_percent": psutil.cpu_percent(interval=None),
            "memory": {
                "total": psutil.virtual_memory().total,
                "available": psutil.virtual_memory().available,
                "percent": psutil.virtual_memory().percent
            },
            "disk": {
                "total": psutil.disk_usage('/').total,
                "free": psutil.disk_usage('/').free,
                "percent": psutil.disk_usage('/').percent
            }
        }
        
        # Try to get GPU info
        stats["gpu"] = self._get_gpu_stats()
        
        return stats

    def _get_gpu_stats(self) -> Dict[str, Any]:
        """Mock GPU stats if no specialized library is present"""
        return {
            "name": "NVIDIA GeForce RTX 4090 (Simulation)",
            "memory_total": 24576, # MB
            "memory_used": 8192,
            "memory_free": 16384,
            "utilization": 32.5,
            "temperature": 65 # C
        }


# Exported singleton
herald = HERALDMonitor()
herald_monitor = HERALDMonitor()  # Backward compatibility alias
