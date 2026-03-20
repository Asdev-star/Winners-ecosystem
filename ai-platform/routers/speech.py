# winners-ecosystem/ai-platform/routers/speech.py
from fastapi import APIRouter, HTTPException, File, UploadFile, Form
from services.whisper import whisper_service
from services.provider_service import provider_service
import base64
from typing import Optional

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
async def text_to_speech(text: str = Form(...), voice: Optional[str] = "alloy"):
    """Placeholder for text-to-speech functionality"""
    return {
        "text": text,
        "voice": voice,
        "status": "not_implemented",
        "detail": "TTS service coming soon"
    }
