# winners-ecosystem/ai-platform/routers/images.py
from fastapi import APIRouter, HTTPException, Form
from services.comfyui import comfyui_service
from pydantic import BaseModel
from typing import Optional, Dict, Any
import httpx
import os
import base64

router = APIRouter(prefix="/api/v1/images", tags=["images"])

class ImageGenRequest(BaseModel):
    prompt: str
    model: Optional[str] = "sdxl"  # Options: sdxl (ComfyUI), dall-e-3, dall-e-2
    width: Optional[int] = 1024
    height: Optional[int] = 1024
    quality: Optional[str] = "standard"  # For DALL-E: standard, hd

@router.post("/generate")
async def generate_image(request: ImageGenRequest):
    """
    Image generation with multiple provider support:
    
    - "sdxl" (default): Local ComfyUI - free, requires GPU
    - "dall-e-3": OpenAI DALL-E 3 - highest quality, paid
    - "dall-e-2": OpenAI DALL-E 2 - faster, paid
    
    FORGE routes automatically based on credits and quality requirements.
    """
    model = request.model or "sdxl"
    
    # Route to DALL-E for cloud generation
    if model in ("dall-e-3", "dall-e-2"):
        return await generate_dalle(request)
    
    # Default: ComfyUI local generation
    try:
        result = await comfyui_service.generate_image(
            request.prompt,
            model=request.model
        )
        return {
            "status": "queued",
            "prompt_id": result.get("prompt_id"),
            "provider": "comfyui",
            "model": request.model or "sdxl"
        }
    except Exception as e:
        # Fallback to DALL-E if ComfyUI fails
        if model == "sdxl":
            try:
                return await generate_dalle(request)
            except:
                pass
        raise HTTPException(status_code=500, detail=f"Image generation error: {str(e)}")


async def generate_dalle(request: ImageGenRequest):
    """Generate image using OpenAI DALL-E"""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")
    
    # Determine model and quality
    model = "dall-e-3" if request.model == "dall-e-3" else "dall-e-2"
    quality = request.quality if request.model == "dall-e-3" else "standard"
    
    # Validate dimensions (DALL-E has specific size requirements)
    size = f"{request.width}x{request.height}"
    valid_sizes = ["256x256", "512x512", "1024x1024", "1792x1024", "1024x1792"]
    if size not in valid_sizes:
        size = "1024x1024"  # Default
    
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                "https://api.openai.com/v1/images/generations",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": model,
                    "prompt": request.prompt,
                    "n": 1,
                    "size": size,
                    "quality": quality,
                    "response_format": "b64_json"
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail=f"DALL-E error: {response.text}")
            
            data = response.json()
            image_data = data["data"][0]["b64_json"]
            
            return {
                "status": "success",
                "image": f"data:image/png;base64,{image_data}",
                "provider": "openai",
                "model": model,
                "size": size,
                "quality": quality
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DALL-E error: {str(e)}")


@router.get("/status/{prompt_id}")
async def get_image_status(prompt_id: str):
    """Check image generation status from ComfyUI history"""
    try:
        status = await comfyui_service.get_history(prompt_id)
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
