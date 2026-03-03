# winners-ecosystem/ai-platform/main.py
"""
Winners Ecosystem AI Platform - FastAPI Service
Multimodal AI routing service for handling images, PDFs, audio, video
Routes to Claude, GPT-4o, Gemini, or Ollama based on file type
"""

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import base64
import os
import json
import httpx
from datetime import datetime

app = FastAPI(title="Winners AI Platform", version="1.0.0")

# CORS - allow all for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Provider routing rules
PROVIDER_ROUTING = {
    "image": {"primary": "claude", "fallback": "gpt-4o", "formats": ["jpeg", "jpg", "png", "gif", "webp"]},
    "pdf": {"primary": "claude", "fallback": "gpt-4o", "formats": ["pdf"]},
    "audio": {"primary": "whisper", "fallback": "gemini", "formats": ["mp3", "wav", "m4a", "ogg"]},
    "video": {"primary": "gemini", "fallback": "gpt-4o", "formats": ["mp4", "webm", "mov"]},
    "text": {"primary": "ollama", "fallback": "claude", "formats": ["txt", "md", "json"]},
}

# Assistant system prompts
ASSISTANT_PROMPTS = {
    "OMEGA": "You are OMEGA, the master orchestrator of Winners Ecosystem. You supervise all 8 platforms and drive the Agentic Loop. Be strategic, visionary, and see patterns across layers.",
    "ARIA": "You are ARIA, the Core Engine assistant. Calm, precise, organized. Help with dashboard insights, billing, and workspace management.",
    "NOVA": "You are NOVA, the Community AI. Warm, trend-aware, creative. Help with content moderation, creator growth, and talent detection.",
    "SAGE": "You are SAGE, the Academy tutor. Patient, knowledgeable, encouraging. Help with course tutoring, PDF analysis, and skill guidance.",
    "ATLAS": "You are ATLAS, the Market intelligence. Analytical, commercial, data-driven. Help with product research, pricing strategy, vendor intelligence.",
    "FORGE": "You are FORGE, the Intelligence platform. Technical, precise, performance-focused. Help with model routing and AI cost management.",
    "CIRCUIT": "You are CIRCUIT, the Work matching AI. Professional, tactical, results-oriented. Help with job matching, proposal writing, contract review.",
    "NEXUS": "You are NEXUS, the Cloud support. Developer-focused, documentation-expert. Help with API guidance, SDK support, integration troubleshooting.",
    "HERALD": "You are HERALD, the AI Platform infrastructure. Technical, infrastructure-focused. Help with Ollama management, GPU routing, model benchmarking.",
}

class ChatRequest(BaseModel):
    message: str
    model: Optional[str] = "claude"
    assistant: Optional[str] = None
    history: Optional[List[Dict[str, str]]] = None
    files: Optional[List[Dict[str, Any]]] = None

class ChatResponse(BaseModel):
    response: str
    provider: str
    tokens_used: int
    latency_ms: int
    assistant: Optional[str] = None


def get_file_type(filename: str) -> str:
    """Determine file type from extension"""
    ext = filename.split(".")[-1].lower()
    for file_type, config in PROVIDER_ROUTING.items():
        if ext in config["formats"]:
            return file_type
    return "text"


def encode_file_base64(file_content: bytes) -> str:
    """Encode file content to base64"""
    return base64.b64encode(file_content).decode("utf-8")


async def call_claude(prompt: str, image_b64: Optional[str] = None) -> Dict[str, Any]:
    """Call Anthropic Claude API"""
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not configured")
    
    messages = []
    if image_b64:
        messages.append({
            "type": "image",
            "source": {"type": "base64", "media_type": "image/jpeg", "data": image_b64}
        })
    messages.append({"type": "text", "text": prompt})
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            },
            json={"model": "claude-3-5-sonnet-20241022", "max_tokens": 4096, "messages": messages},
            timeout=60.0
        )
        data = response.json()
        return {
            "response": data["content"][0]["text"],
            "tokens": data.get("usage", {}).get("output_tokens", 0)
        }


async def call_openai(prompt: str, audio_b64: Optional[str] = None) -> Dict[str, Any]:
    """Call OpenAI GPT-4o API"""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")
    
    messages = [{"role": "user", "content": []}]
    if audio_b64:
        messages[0]["content"].append({
            "type": "audio",
            "audio": {"base64": audio_b64}
        })
    messages[0]["content"].append({"type": "text", "text": prompt})
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={"model": "gpt-4o", "messages": messages, "max_tokens": 4096},
            timeout=60.0
        )
        data = response.json()
        return {
            "response": data["choices"][0]["message"]["content"],
            "tokens": data.get("usage", {}).get("total_tokens", 0)
        }


async def call_gemini(prompt: str, video_b64: Optional[str] = None) -> Dict[str, Any]:
    """Call Google Gemini API"""
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GOOGLE_API_KEY not configured")
    
    import google.generativeai as genai
    genai.configure(api_key=api_key)
    
    model = genai.GenerativeModel("gemini-1.5-pro")
    contents = [prompt]
    if video_b64:
        contents.append({"mime_type": "video/mp4", "data": video_b64})
    
    response = model.generate_content(contents)
    return {
        "response": response.text,
        "tokens": 0
    }


async def call_ollama(prompt: str, model: str = "llama3.2") -> Dict[str, Any]:
    """Call local Ollama API"""
    ollama_host = os.getenv("OLLAMA_HOST", "http://localhost:11434")
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{ollama_host}/api/generate",
                json={"model": model, "prompt": prompt, "stream": False},
                timeout=120.0
            )
            data = response.json()
            return {
                "response": data.get("response", ""),
                "tokens": len(prompt.split()) + len(data.get("response", "").split())
            }
        except Exception as e:
            raise HTTPException(status_code=503, detail=f"Ollama unavailable: {str(e)}")


@app.get("/")
async def root():
    """Health check"""
    return {
        "name": "Winners AI Platform",
        "version": "1.0.0",
        "status": "running",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/health")
async def health():
    """Detailed health check"""
    return {
        "status": "healthy",
        "providers": {
            "claude": bool(os.getenv("ANTHROPIC_API_KEY")),
            "openai": bool(os.getenv("OPENAI_API_KEY")),
            "gemini": bool(os.getenv("GOOGLE_API_KEY")),
            "ollama": True  # Checked at runtime
        },
        "assistants": list(ASSISTANT_PROMPTS.keys())
    }


@app.post("/api/v1/chat")
async def chat(request: ChatRequest) -> ChatResponse:
    """Main multimodal chat endpoint"""
    start_time = datetime.utcnow()
    
    # Build system prompt
    system_prompt = ""
    if request.assistant and request.assistant in ASSISTANT_PROMPTS:
        system_prompt = ASSISTANT_PROMPTS[request.assistant]
    
    # Handle files
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
    
    # Route to provider
    model = request.model or "claude"
    provider = model
    
    try:
        if model == "claude":
            result = await call_claude(request.message, image_b64)
            provider = "claude"
        elif model == "gpt-4o":
            result = await call_openai(request.message, audio_b64)
            provider = "openai"
        elif model == "gemini":
            result = await call_gemini(request.message, video_b64)
            provider = "gemini"
        elif model == "ollama":
            result = await call_ollama(request.message)
            provider = "ollama"
        else:
            # Default to Claude
            result = await call_claude(request.message, image_b64)
            provider = "claude"
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Provider error: {str(e)}")
    
    latency = int((datetime.utcnow() - start_time).total_seconds() * 1000)
    
    return ChatResponse(
        response=result["response"],
        provider=provider,
        tokens_used=result["tokens"],
        latency_ms=latency,
        assistant=request.assistant
    )


@app.post("/api/v1/multimodal")
async def multimodal_chat(
    message: str = Form(...),
    model: str = Form("claude"),
    assistant: str = Form(None),
    file: UploadFile = File(None)
) -> ChatResponse:
    """Multipart multimodal chat with file upload"""
    start_time = datetime.utcnow()
    
    file_b64 = None
    if file:
        content = await file.read()
        file_b64 = encode_file_base64(content)
    
    # Determine routing
    if file:
        file_type = get_file_type(file.filename)
        routing = PROVIDER_ROUTING.get(file_type, PROVIDER_ROUTING["text"])
        model = routing["primary"]
    
    # Build prompt
    prompt = message
    if file_b64:
        prompt = f"[File: {file.filename}]\n\n{message}"
    
    # Route to provider
    try:
        if model == "claude":
            result = await call_claude(prompt, file_b64 if file_type == "image" else None)
        elif model == "gpt-4o":
            result = await call_openai(prompt)
        elif model == "gemini":
            result = await call_gemini(prompt, file_b64 if file_type == "video" else None)
        elif model == "ollama":
            result = await call_ollama(prompt)
        else:
            result = await call_claude(prompt)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    latency = int((datetime.utcnow() - start_time).total_seconds() * 1000)
    
    return ChatResponse(
        response=result["response"],
        provider=model,
        tokens_used=result["tokens"],
        latency_ms=latency,
        assistant=assistant
    )


@app.get("/api/v1/assistants")
async def list_assistants():
    """List all available assistants"""
    return {
        "assistants": [
            {"name": name, "description": desc}
            for name, desc in ASSISTANT_PROMPTS.items()
        ]
    }


@app.post("/api/v1/assistants/{assistant_name}/chat")
async def assistant_chat(assistant_name: str, request: ChatRequest) -> ChatResponse:
    """Chat with specific assistant"""
    if assistant_name not in ASSISTANT_PROMPTS:
        raise HTTPException(status_code=404, detail=f"Assistant {assistant_name} not found")
    
    request.assistant = assistant_name
    return await chat(request)


@app.get("/api/v1/models")
async def list_models():
    """List available AI models"""
    return {
        "models": [
            {"id": "claude", "name": "Claude 3.5 Sonnet", "provider": "anthropic", "supports": ["text", "images", "pdf"]},
            {"id": "gpt-4o", "name": "GPT-4o", "provider": "openai", "supports": ["text", "images", "audio", "video"]},
            {"id": "gemini", "name": "Gemini 1.5 Pro", "provider": "google", "supports": ["text", "images", "audio", "video", "pdf"]},
            {"id": "ollama", "name": "Ollama Local", "provider": "local", "supports": ["text", "images"]},
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
