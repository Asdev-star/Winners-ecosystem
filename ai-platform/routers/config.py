# winners-ecosystem/ai-platform/routers/config.py
from fastapi import APIRouter
from models.models import AVAILABLE_MODELS, AVAILABLE_ASSISTANTS

router = APIRouter(prefix="/api/v1", tags=["config"])

@router.get("/models")
async def get_models():
    """Get registry of available models"""
    return AVAILABLE_MODELS

@router.get("/assistants")
async def get_assistants():
    """Get registry of available assistants"""
    return AVAILABLE_ASSISTANTS
