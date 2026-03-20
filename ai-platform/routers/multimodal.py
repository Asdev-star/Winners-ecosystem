# winners-ecosystem/ai-platform/routers/multimodal.py
# Unified multimodal router - FORGE-powered file analysis

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import StreamingResponse
import httpx
import base64
import time
from services.forge_router import forge
from services.herald_monitor import herald
from services.provider_service import provider_service
from models.models import ChatResponse
from typing import Optional
from datetime import datetime

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

    # Route to correct provider
    try:
        if decision.provider == "claude":
            result = await analyze_with_claude(file_bytes, content_type, prompt, decision.model)
        elif decision.provider == "ollama":
            result = await analyze_with_ollama(file_bytes, content_type, prompt, decision.model)
        elif decision.provider == "whisper-local":
            result = await transcribe_with_whisper(file_bytes)
        elif decision.provider == "gemini":
            result = await analyze_with_gemini(file_bytes, content_type, prompt)
        elif decision.provider == "gpt4o":
            result = await analyze_with_gpt4o(file_bytes, content_type, prompt)
        else:
            result = {"analysis": "Provider not available", "provider": decision.provider}

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
            cloud_decision = forge.route(input_type, user_credits, user_plan, "claude")
            result = await analyze_with_claude(file_bytes, content_type, prompt, cloud_decision.model)
            return {"analysis": result, "provider": "claude", "fallback": True, "original_error": str(e)}
        raise HTTPException(status_code=500, detail=str(e))


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
    """Analyze files using Gemini."""
    # Placeholder for Gemini integration
    return {"analysis": "Gemini integration pending", "provider": "gemini"}


async def analyze_with_gpt4o(file_bytes: bytes, content_type: str, prompt: str) -> dict:
    """Analyze files using GPT-4o."""
    # Placeholder for GPT-4o integration
    return {"analysis": "GPT-4o integration pending", "provider": "gpt4o"}


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
