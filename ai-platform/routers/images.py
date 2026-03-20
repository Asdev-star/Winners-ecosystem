# winners-ecosystem/ai-platform/routers/images.py
from fastapi import APIRouter, HTTPException, Form
from services.comfyui import comfyui_service
from pydantic import BaseModel
from typing import Optional, Dict, Any

router = APIRouter(prefix="/api/v1/images", tags=["images"])

class ImageGenRequest(BaseModel):
    prompt: str
    model: Optional[str] = "sdxl"
    width: Optional[int] = 1024
    height: Optional[int] = 1024

@router.post("/generate")
async def generate_image(request: ImageGenRequest):
    """ComfyUI image generation"""
    try:
        result = await comfyui_service.generate_image(request.prompt)
        return {
            "status": "queued",
            "prompt_id": result.get("prompt_id"),
            "provider": "comfyui"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ComfyUI error: {str(e)}")

@router.get("/status/{prompt_id}")
async def get_image_status(prompt_id: str):
    """Check image generation status from ComfyUI history"""
    try:
        status = await comfyui_service.get_history(prompt_id)
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
