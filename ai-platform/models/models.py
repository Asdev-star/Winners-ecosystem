from pydantic import BaseModel
from typing import Optional, List, Dict, Any

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

class ProviderConfig(BaseModel):
    primary: str
    fallback: str
    formats: List[str]

class OrchestrationStatus(BaseModel):
    status: str
    timestamp: str
    services: Dict[str, Any]

AVAILABLE_MODELS = [
    {"id": "claude", "name": "Claude 3.5 Sonnet", "provider": "Anthropic"},
    {"id": "gpt-4o", "name": "GPT-4o", "provider": "OpenAI"},
    {"id": "gemini", "name": "Gemini 1.5 Pro", "provider": "Google"},
    {"id": "llama3.2", "name": "Llama 3.2 (Local)", "provider": "Ollama"},
]

AVAILABLE_ASSISTANTS = [
    {"id": "OMEGA", "name": "OMEGA", "description": "Master Orchestrator"},
    {"id": "ARIA", "name": "ARIA", "description": "Core Engine Assistant"},
    {"id": "NOVA", "name": "NOVA", "description": "Community AI"},
    {"id": "SAGE", "name": "SAGE", "description": "Academy Tutor"},
    {"id": "ATLAS", "name": "ATLAS", "description": "Market Intelligence"},
    {"id": "FORGE", "name": "FORGE", "description": "Intelligence Platform"},
    {"id": "CIRCUIT", "name": "CIRCUIT", "description": "Work Matching AI"},
    {"id": "NEXUS", "name": "NEXUS", "description": "Cloud Support"},
    {"id": "HERALD", "name": "HERALD", "description": "AI Infrastructure Lead"},
]
