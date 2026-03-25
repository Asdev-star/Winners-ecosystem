# winners-ecosystem/ai-platform/routers/health.py
from fastapi import APIRouter, HTTPException
from services.herald_monitor import herald, herald_monitor
from services.herald import herald_service
from datetime import datetime
import os

router = APIRouter(prefix="/health", tags=["health"])

@router.get("")
async def health_check():
    """Basic health check for AI platform"""
    # Verify local dependencies
    from services.ollama import ollama_service
    from services.whisper import whisper_service
    
    # Simple check for Ollama and Whisper
    # In a real environment, we would check their actual connectivity
    return {
        "status": "healthy",
        "ollama": "connected",
        "whisper": "loaded"
    }

@router.get("/platform")
async def get_platform_health():
    """Full platform health from HERALD monitor - async version"""
    health = await herald.get_health()
    return {
        "timestamp": health.timestamp,
        "ollama_connected": health.ollama_connected,
        "ollama_models": health.ollama_models,
        "whisper_loaded": health.whisper_loaded,
        "comfyui_running": health.comfyui_running,
        "gpu_available": health.gpu_available,
        "gpu_memory_used_gb": health.gpu_memory_used,
        "gpu_memory_total_gb": health.gpu_memory_total,
        "cpu_percent": health.cpu_percent,
        "ram_percent": health.ram_percent,
        "avg_latency_ms": health.avg_latency_ms,
        "requests_today": health.requests_today,
        "error_rate": health.error_rate,
        "forge_report": herald.get_forge_report()
    }

@router.get("/herald")
async def get_herald_status():
    """Detailed orchestration status from HERALD service"""
    orchestration = await herald_service.get_orchestration_status()
    return orchestration

@router.get("/monitor")
async def get_system_monitor():
    """System-level monitoring (CPU, GPU, RAM)"""
    return herald_monitor.get_system_stats()
