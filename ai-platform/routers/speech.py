# winners-ecosystem/ai-platform/routers/speech.py
from fastapi import APIRouter, HTTPException, File, UploadFile, Form
from services.whisper import whisper_service
from services.provider_service import provider_service
import base64
from typing import Optional
import httpx
import os

router = APIRouter(prefix="/api/v1/speech", tags=["speech"])

@router.post("/stt")
async def speech_to_text(file: UploadFile = File(...), model: str = "whisper"):
    """Whisper Speech-to-Text transcription"""
    try:
        content = await file.read()
        audio_b64 = base64.b64encode(content).decode("utf-8")
        
        # Determine whether to use local whisper or cloud
        if model == "whisper":
            result = await whisper_service.transcribe(audio_b64)
            provider = "local-whisper"
        else:
            # Fallback to OpenAI Whisper cloud via provider_service
            # Need to add STT to provider_service or use existing OpenAI chat if it supports audio
            result = await provider_service.call_openai("Transcribe this audio", audio_b64=audio_b64)
            provider = "openai-whisper"
            
        return {
            "text": result.get("text", result.get("response", "")),
            "provider": provider,
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Whisper error: {str(e)}")

@router.post("/tts")
async def text_to_speech(text: str = Form(...), voice: Optional[str] = "alloy", provider: Optional[str] = "openai"):
    """
    Text-to-Speech using OpenAI TTS API or Ollama (free local).
    
    Provider options:
    - "openai" (default): Uses OpenAI TTS-1 - high quality, paid
    - "ollama": Uses local Ollama with VALL-E or other TTS model - free
    
    OpenAI voices: alloy, echo, fable, onyx, nova, shimmer
    """
    import httpx
    import os
    import base64
    
    # Route to Ollama if requested
    if provider == "ollama":
        return await ollama_tts(text, voice or "alloy")
    
    # Default: OpenAI TTS
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")
    
    # Validate voice
    valid_voices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"]
    if voice not in valid_voices:
        voice = "alloy"
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://api.openai.com/v1/audio/speech",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "tts-1",
                    "voice": voice,
                    "input": text,
                    "response_format": "mp3"
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail=f"TTS API error: {response.text}")
            
            # Return base64 encoded audio
            audio_b64 = base64.b64encode(response.content).decode("utf-8")
            
            return {
                "audio": f"data:audio/mp3;base64,{audio_b64}",
                "voice": voice,
                "model": "tts-1",
                "provider": "openai",
                "status": "success"
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS error: {str(e)}")


async def ollama_tts(text: str, voice: str = "alloy"):
    """
    Text-to-Speech using local Ollama with VALL-E or other TTS models.
    Free alternative to OpenAI TTS.
    """
    import httpx
    import os
    
    ollama_host = os.getenv("OLLAMA_HOST", "http://localhost:11434")
    
    # Try to find available TTS model
    # Common Ollama TTS models: vals, bark, snowboy
    tts_models = ["bark", "vals", "soundwriter", "tts"]
    
    # First, check available models
    available_model = None
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.get(f"{ollama_host}/api/tags")
            if res.status_code == 200:
                models = res.json().get("models", [])
                model_names = [m["name"] for m in models]
                for tts_model in tts_models:
                    if any(tts_model in name.lower() for name in model_names):
                        available_model = next(name for name in model_names if tts_model in name.lower())
                        break
    except Exception:
        pass
    
    if not available_model:
        # No local TTS model - return fallback message with OpenAI as backup
        # Try OpenAI as fallback
        return await text_to_speech_fallback(text, voice)
    
    try:
        # Generate speech using Ollama
        async with httpx.AsyncClient(timeout=120.0) as client:
            # Some Ollama TTS models accept a "text" prompt
            response = await client.post(
                f"{ollama_host}/api/generate",
                json={
                    "model": available_model,
                    "prompt": text,
                    "stream": False
                }
            )
            
            if response.status_code != 200:
                # Fallback to OpenAI
                return await text_to_speech_fallback(text, voice)
            
            result = response.json()
            
            # If model returns audio data directly
            if "response" in result:
                audio_data = result["response"]
                # Check if it's base64 audio
                if isinstance(audio_data, str) and len(audio_data) > 1000:
                    return {
                        "audio": f"data:audio/wav;base64,{audio_data}",
                        "voice": voice,
                        "model": available_model,
                        "provider": "ollama",
                        "status": "success"
                    }
            
            # If no audio returned, fallback to OpenAI
            return await text_to_speech_fallback(text, voice)
            
    except Exception as e:
        # Fallback to OpenAI on error
        return await text_to_speech_fallback(text, voice)


async def text_to_speech_fallback(text: str, voice: str):
    """Fallback to OpenAI TTS when Ollama is unavailable"""
    import httpx
    import os
    import base64
    
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=503, 
            detail="Both Ollama TTS and OpenAI TTS unavailable. Please install Ollama with a TTS model or configure OPENAI_API_KEY."
        )
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://api.openai.com/v1/audio/speech",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "tts-1",
                    "voice": voice,
                    "input": text,
                    "response_format": "mp3"
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail=f"TTS fallback error: {response.text}")
            
            audio_b64 = base64.b64encode(response.content).decode("utf-8")
            
            return {
                "audio": f"data:audio/mp3;base64,{audio_b64}",
                "voice": voice,
                "model": "tts-1",
                "provider": "openai-fallback",
                "status": "success",
                "note": "Ollama unavailable, used OpenAI fallback"
            }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"All TTS providers failed: {str(e)}")
