# winners-ecosystem/ai-platform/routers/chat.py
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from models.models import ChatRequest, ChatResponse
from services.provider_service import provider_service
from services.ollama import ollama_service
from services.forge_router import forge_router
from datetime import datetime
import json
import asyncio

router = APIRouter(prefix="/api/v1/chat", tags=["chat"])

@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Main multimodal chat endpoint"""
    start_time = datetime.utcnow()
    
    # System prompt from assistant definition
    # Note: For now, the prompt map is hardcoded in ForgeRouter or could be here
    # I'll rely on the provider_service which handles it
    
    # Provider selection
    provider = forge_router.select_provider(
        message=request.message,
        assistant=request.assistant,
        requested_model=request.model
    )
    
    # Handle files from request (simplified from main.py)
    image_b64 = None
    audio_b64 = None
    video_b64 = None
    if request.files:
        for f in request.files:
            if f.get("type") == "image":
                image_b64 = f.get("data", "").split(",")[-1]
            elif f.get("type") == "audio":
                audio_b64 = f.get("data", "").split(",")[-1]
            elif f.get("type") == "video":
                video_b64 = f.get("data", "").split(",")[-1]

    try:
        if provider == "claude":
            result = await provider_service.call_claude(request.message, image_b64)
        elif provider == "gpt-4o":
            result = await provider_service.call_openai(request.message, audio_b64)
        elif provider == "gemini":
            result = await provider_service.call_gemini(request.message, video_b64)
        elif provider == "ollama":
            res = await ollama_service.generate(model="llama3.2", prompt=request.message)
            result = {"response": res.get("response", ""), "tokens": 0}
        else:
            result = await provider_service.call_claude(request.message, image_b64)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    latency = int((datetime.utcnow() - start_time).total_seconds() * 1000)
    
    return ChatResponse(
        response=result["response"],
        provider=provider,
        tokens_used=result.get("tokens", 0),
        latency_ms=latency,
        assistant=request.assistant
    )

@router.get("/stream")
async def chat_stream(message: str, model: str = "claude"):
    """Server-Sent Events (SSE) streaming chat endpoint"""
    async def event_generator():
        # Mock streaming for now
        response_text = f"Streaming response from {model}: This is a sample real-time response."
        words = response_text.split()
        for word in words:
            yield f"data: {json.dumps({'chunk': word + ' '})}\n\n"
            await asyncio.sleep(0.1)
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
