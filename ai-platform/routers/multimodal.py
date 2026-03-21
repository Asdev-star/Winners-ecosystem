# winners-ecosystem/ai-platform/routers/multimodal.py
# Unified multimodal router - FORGE-powered file analysis

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import StreamingResponse
import httpx
import base64
import time
import asyncio
from functools import wraps
from services.forge_router import forge
from services.herald_monitor import herald
from services.provider_service import provider_service
from models.models import ChatResponse
from typing import Optional
from datetime import datetime
from io import BytesIO

# Retry decorator for async functions
def retry_on_failure(max_retries: int = 2, delay: float = 1.0):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            last_error = None
            for attempt in range(max_retries + 1):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    last_error = e
                    if attempt < max_retries:
                        await asyncio.sleep(delay * (attempt + 1))
                        continue
            raise last_error
        return wrapper
    return decorator

router = APIRouter(prefix="/api/v1/multimodal", tags=["multimodal"])


@router.post("/analyze")
async def analyze_file(
    file:             UploadFile = File(...),
    prompt:           str        = Form("Analyse this and provide a structured response."),
    provider:         str        = Form(None),
    user_credits:     int        = Form(100),
    user_plan:        str        = Form("pro"),
    supervisor_name:  str        = Form("aria")
):
    """
    FORGE-powered multimodal analysis.
    Auto-detects file type → routes to optimal provider → returns analysis.
    """
    start_time = time.time()
    file_bytes = await file.read()
    content_type = file.content_type or ""

    # FORGE decides the provider
    input_type = forge.detect_input_type(file.filename or "", content_type)
    decision   = forge.route(input_type, user_credits, user_plan, provider)

    if decision.provider == "unavailable":
        raise HTTPException(status_code=402, detail=decision.rationale)

    # Route to correct provider with retry logic
    try:
        result = await route_to_provider(decision.provider, file_bytes, content_type, prompt, decision.model)

        latency = (time.time() - start_time) * 1000
        herald.record_request(decision.provider, latency, True)

        return {
            "analysis":    result,
            "provider":    decision.provider,
            "model":       decision.model,
            "is_local":    decision.is_local,
            "credit_cost": decision.credit_cost,
            "latency_ms":  round(latency),
            "input_type":  input_type,
            "rationale":   decision.rationale
        }

    except Exception as e:
        herald.record_request(decision.provider, (time.time() - start_time) * 1000, False)
        # Auto-fallback: if local fails, try cloud
        if decision.is_local:
            try:
                cloud_decision = forge.route(input_type, user_credits, user_plan, "claude")
                result = await route_to_provider("claude", file_bytes, content_type, prompt, cloud_decision.model)
                return {
                    "analysis": result, 
                    "provider": "claude", 
                    "fallback": True, 
                    "original_error": str(e)
                }
            except:
                pass
        raise HTTPException(status_code=500, detail=str(e))


async def route_to_provider(provider: str, file_bytes: bytes, content_type: str, prompt: str, model: str) -> dict:
    """
    Route file analysis to the appropriate provider with retry logic.
    Returns the analysis result from the provider.
    """
    max_retries = 2
    last_error = None
    
    for attempt in range(max_retries + 1):
        try:
            if provider == "claude":
                return await analyze_with_claude(file_bytes, content_type, prompt, model)
            elif provider == "ollama":
                return await analyze_with_ollama(file_bytes, content_type, prompt, model)
            elif provider == "whisper-local":
                return await transcribe_with_whisper(file_bytes)
            elif provider == "gemini":
                return await analyze_with_gemini(file_bytes, content_type, prompt)
            elif provider == "gpt4o":
                return await analyze_with_gpt4o(file_bytes, content_type, prompt)
            else:
                return {"analysis": "Provider not available", "provider": provider}
        except Exception as e:
            last_error = e
            if attempt < max_retries:
                await asyncio.sleep(1 * (attempt + 1))
                continue
    
    # All retries failed
    raise last_error or Exception(f"Provider {provider} failed after {max_retries} retries")


async def analyze_with_claude(file_bytes: bytes, content_type: str, prompt: str, model: str) -> str:
    """Analyze files using Claude API."""
    import anthropic
    client = anthropic.AsyncAnthropic()

    # Build content based on type
    if "pdf" in content_type:
        content = [
            {"type": "document", "source": {"type": "base64", "media_type": content_type,
                                             "data": base64.b64encode(file_bytes).decode()}},
            {"type": "text", "text": prompt}
        ]
    elif "image" in content_type:
        content = [
            {"type": "image", "source": {"type": "base64", "media_type": content_type,
                                          "data": base64.b64encode(file_bytes).decode()}},
            {"type": "text", "text": prompt}
        ]
    else:
        text = file_bytes.decode("utf-8", errors="replace")
        content = [{"type": "text", "text": f"{prompt}\n\nContent:\n{text}"}]

    response = await client.messages.create(model=model, max_tokens=2000, messages=[{"role": "user", "content": content}])
    return response.content[0].text


async def analyze_with_ollama(file_bytes: bytes, content_type: str, prompt: str, model: str) -> str:
    """Analyze files using local Ollama."""
    text = file_bytes.decode("utf-8", errors="replace")
    async with httpx.AsyncClient(timeout=120) as client:
        res = await client.post(
            "http://localhost:11434/api/generate",
            json={"model": model, "prompt": f"{prompt}\n\n{text}", "stream": False}
        )
        return res.json().get("response", "")


async def transcribe_with_whisper(audio_bytes: bytes) -> dict:
    """Transcribe audio using Faster Whisper."""
    from faster_whisper import WhisperModel
    import tempfile, os

    model = WhisperModel("medium", device="cpu", compute_type="int8")
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        segments, info = model.transcribe(tmp_path, beam_size=5)
        transcript = " ".join([s.text.strip() for s in segments])
        return {"text": transcript, "language": info.language, "confidence": round(info.language_probability, 3)}
    finally:
        os.unlink(tmp_path)


async def analyze_with_gemini(file_bytes: bytes, content_type: str, prompt: str) -> dict:
    """Analyze files using Gemini API for video and native multimodal."""
    import google.generativeai as genai
    import os
    
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        return {"analysis": "Google API key not configured", "provider": "gemini", "error": "missing_api_key"}
    
    genai.configure(api_key=api_key)
    
    # Determine mime type
    mime_type_map = {
        "image/jpeg": "image/jpeg",
        "image/png": "image/png",
        "image/gif": "image/gif",
        "image/webp": "image/webp",
        "video/mp4": "video/mp4",
        "video/webm": "video/webm",
        "application/pdf": "application/pdf",
        "audio/mpeg": "audio/mpeg",
        "audio/wav": "audio/wav",
        "audio/mp3": "audio/mp3",
    }
    
    mime_type = mime_type_map.get(content_type, content_type)
    
    try:
        # For video files, use the video-specific model
        if "video" in content_type:
            model = "gemini-2.0-flash-exp"  # Video understanding
        else:
            model = "gemini-1.5-pro"
        
        # Upload file to Gemini for processing
        from io import BytesIO
        file_data = BytesIO(file_bytes)
        
        # For images and video, use theFiles API
        uploaded_file = genai.upload_file(
            file_data,
            mime_type=mime_type
        )
        
        # Generate analysis
        model_obj = genai.GenerativeModel(model)
        response = model_obj.generate_content([uploaded_file, prompt])
        
        return {
            "analysis": response.text,
            "provider": "gemini",
            "model": model,
            "mime_type": mime_type
        }
    except Exception as e:
        return {
            "analysis": f"Gemini API error: {str(e)}",
            "provider": "gemini",
            "error": str(e)
        }


async def analyze_with_gpt4o(file_bytes: bytes, content_type: str, prompt: str) -> dict:
    """Analyze files using OpenAI GPT-4o for images, audio, and native multimodal."""
    import httpx
    import os
    import base64
    
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return {"analysis": "OpenAI API key not configured", "provider": "gpt4o", "error": "missing_api_key"}
    
    # Encode file to base64
    file_b64 = base64.b64encode(file_bytes).decode("utf-8")
    
    # Determine content type for API
    if "image" in content_type:
        media_type = "image/jpeg" if "jpeg" in content_type else content_type
        if "png" in content_type:
            media_type = "image/png"
        elif "gif" in content_type:
            media_type = "image/gif"
        elif "webp" in content_type:
            media_type = "image/webp"
        
        content = [
            {
                "type": "image_url",
                "image_url": {
                    "url": f"data:{media_type};base64,{file_b64}"
                }
            },
            {
                "type": "text",
                "text": prompt
            }
        ]
    elif "audio" in content_type:
        # GPT-4o audio support via audio input
        media_type = "audio/wav" if "wav" in content_type else "audio/mp3"
        content = [
            {
                "type": "input_audio",
                "input_audio": {
                    "data": file_b64,
                    "format": "wav" if "wav" in content_type else "mp3"
                }
            },
            {
                "type": "text",
                "text": prompt
            }
        ]
    elif "video" in content_type:
        # For video, extract frames using a simple approach
        return {
            "analysis": "GPT-4o does not natively support video. Use Gemini for video analysis.",
            "provider": "gpt4o",
            "fallback": "gemini",
            "error": "video_not_supported"
        }
    else:
        # Text fallback
        text_content = file_bytes.decode("utf-8", errors="replace")
        content = [
            {
                "type": "text",
                "text": f"{prompt}\n\nContent:\n{text_content}"
            }
        ]
    
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-4o",
                    "messages": [
                        {
                            "role": "user",
                            "content": content
                        }
                    ],
                    "max_tokens": 4096
                }
            )
            
            if response.status_code != 200:
                return {
                    "analysis": f"GPT-4o API error: {response.status_code}",
                    "provider": "gpt4o",
                    "error": response.text
                }
            
            data = response.json()
            return {
                "analysis": data["choices"][0]["message"]["content"],
                "provider": "gpt4o",
                "model": "gpt-4o",
                "tokens": data.get("usage", {}).get("total_tokens", 0)
            }
    except Exception as e:
        return {
            "analysis": f"GPT-4o API error: {str(e)}",
            "provider": "gpt4o",
            "error": str(e)
        }


# Legacy endpoint for backward compatibility
@router.post("", response_model=ChatResponse)
async def multimodal_chat(
    message: str = Form(...),
    model: Optional[str] = Form(None),
    assistant: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
) -> ChatResponse:
    """Legacy multipart multimodal chat with automatic routing"""
    from services.forge_router import forge_router
    
    start_time = datetime.utcnow()
    
    # Identify file type and primary provider
    file_type = "text"
    file_b64 = None
    if file:
        content = await file.read()
        file_b64 = base64.b64encode(content).decode("utf-8")
        file_type = forge_router.get_file_type(file.filename)
    
    # Select provider based on file type if model is not specified
    provider = forge_router.select_provider(
        message=message,
        file_type=file_type,
        assistant=assistant,
        requested_model=model
    )
    
    # Process request based on provider
    try:
        if provider == "claude":
            result = await provider_service.call_claude(message, file_b64 if file_type == "image" else None)
        elif provider == "gpt-4o":
            result = await provider_service.call_openai(message, system=f"Analysing {file_type}")
        elif provider == "gemini":
            result = await provider_service.call_gemini(message, file_b64 if file_type == "video" else None)
        else:
            result = await provider_service.call_claude(message, file_b64 if file_type == "image" else None)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    latency = int((datetime.utcnow() - start_time).total_seconds() * 1000)
    
    return ChatResponse(
        response=result["response"],
        provider=provider,
        tokens_used=result.get("tokens", 0),
        latency_ms=latency,
        assistant=assistant
    )
