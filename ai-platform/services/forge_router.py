# winners-ecosystem/ai-platform/services/forge_router.py
# FORGE Provider Router - Intelligent AI provider selection
# Local models always take priority — cloud only when quality genuinely requires it

from dataclasses import dataclass
from typing import Optional
import mimetypes


@dataclass
class ProviderDecision:
    provider:       str
    model:          str
    is_local:       bool
    credit_cost:    int   # 0 for local, >0 for cloud
    rationale:      str


class FORGERouter:
    """
    FORGE makes provider routing decisions based on:
    - Input type (text, image, audio, video, PDF, code)
    - User's credit balance
    - Quality requirements
    - Network availability (local fallback when offline)
    """

    ROUTING_TABLE = {
        "text": {
            "free":     ("ollama",          "llama3.1",           0,  "Local free — excellent for general tasks"),
            "standard": ("ollama",          "llama3.1",           0,  "Local free — sufficient for most queries"),
            "premium":  ("claude",          "claude-sonnet-4-6",  2,  "Cloud — complex reasoning, long context"),
        },
        "code": {
            "free":     ("ollama",          "deepseek-coder",     0,  "Local free — code-specialised model"),
            "standard": ("ollama",          "deepseek-coder",     0,  "Local free — DeepSeek exceeds GPT-3.5 on code"),
            "premium":  ("claude",          "claude-sonnet-4-6",  2,  "Cloud — architecture review, complex debugging"),
        },
        "image": {
            "free":     ("claude",          "claude-3-5-sonnet",  1,  "Claude has excellent image understanding"),
            "standard": ("claude",          "claude-3-5-sonnet",  1,  "Claude — best accuracy on diverse image types"),
            "premium":  ("gpt4o",           "gpt-4o",            3,  "GPT-4o — maximum image analysis depth"),
        },
        "pdf": {
            "free":     ("claude",          "claude-3-5-sonnet",  2,  "Claude native PDF — up to 100 pages"),
            "standard": ("claude",          "claude-3-5-sonnet",  2,  "Claude — best PDF extraction accuracy"),
            "premium":  ("claude",          "claude-3-5-sonnet",  2,  "Same — Claude has no better alternative for PDFs"),
        },
        "audio": {
            "free":     ("whisper-local",   "medium",             0,  "Offline Whisper — excellent accuracy, free"),
            "standard": ("whisper-local",   "medium",             0,  "Offline Whisper — no reason to pay for cloud"),
            "premium":  ("gpt4o-whisper",   "whisper-1",         3,  "GPT-4o Whisper — marginal improvement for accented speech"),
        },
        "video": {
            "free":     (None,              None,                 0,  "Video requires cloud — not available on free tier"),
            "standard": ("gemini",          "gemini-1.5-pro",    5,  "Gemini — native video understanding"),
            "premium":  ("gemini",          "gemini-1.5-pro",    5,  "Same — Gemini is the only choice for video"),
        },
        "image_gen": {
            "free":     ("comfyui",         "sdxl",              0,  "Local ComfyUI — requires GPU"),
            "standard": ("comfyui",         "sdxl",              0,  "Local free — excellent quality"),
            "premium":  ("dalle3",          "dall-e-3",          4,  "DALL-E 3 — photorealistic, prompt-accurate"),
        },
    }

    CREDIT_THRESHOLDS = {
        "out_of_credits": 0,
        "low_credits":    20,
        "normal":         100,
    }

    # Legacy provider_routing for backward compatibility
    provider_routing = {
        "image": {"primary": "claude", "fallback": "gpt-4o", "formats": ["jpeg", "jpg", "png", "gif", "webp"]},
        "pdf": {"primary": "claude", "fallback": "gpt-4o", "formats": ["pdf"]},
        "audio": {"primary": "whisper", "fallback": "gemini", "formats": ["mp3", "wav", "m4a", "ogg"]},
        "video": {"primary": "gemini", "fallback": "gpt-4o", "formats": ["mp4", "webm", "mov"]},
        "text": {"primary": "ollama", "fallback": "claude", "formats": ["txt", "md", "json"]},
    }

    # Assistant preferences for backward compatibility
    assistant_preferences = {
        "OMEGA": "claude",
        "HERALD": "ollama",
        "FORGE": "claude",
        "ARIA": "claude",
        "NOVA": "gemini",
        "SAGE": "claude",
        "ATLAS": "gpt-4o",
        "CIRCUIT": "claude",
        "NEXUS": "claude",
    }

    @classmethod
    def route(
        cls,
        input_type: str,
        user_credits: int,
        user_plan:    str = "free",
        force_provider: Optional[str] = None
    ) -> ProviderDecision:
        """
        FORGE decides provider based on input type + credits + plan.
        Users can override with force_provider (e.g. "Switch to GPT-4o").
        """
        # Determine quality tier
        if user_credits < cls.CREDIT_THRESHOLDS["low_credits"] or user_plan == "free":
            tier = "free"
        elif user_plan in ("pro", "enterprise") and user_credits >= 100:
            tier = "premium"
        else:
            tier = "standard"

        # Get routing decision
        routes = cls.ROUTING_TABLE.get(input_type, cls.ROUTING_TABLE["text"])
        provider, model, credit_cost, rationale = routes.get(tier, routes["free"])

        # Handle force override
        if force_provider:
            provider = force_provider
            # Adjust credit cost for cloud models
            credit_cost = 3 if force_provider in ("gpt4o", "claude") else 0

        # Safety check: no provider for this tier
        if provider is None:
            return ProviderDecision(
                provider="unavailable",
                model="",
                is_local=False,
                credit_cost=0,
                rationale=f"Video analysis requires credits. Your current balance: {user_credits}."
            )

        is_local = provider in ("ollama", "whisper-local", "comfyui")

        return ProviderDecision(
            provider=provider,
            model=model,
            is_local=is_local,
            credit_cost=credit_cost if not is_local else 0,
            rationale=rationale
        )

    @classmethod
    def detect_input_type(cls, filename: str, content_type: str) -> str:
        """Auto-detect input type from file metadata."""
        ext = filename.lower().rsplit('.', 1)[-1] if '.' in filename else ''

        if ext in ('pdf',):                           return 'pdf'
        if ext in ('py', 'ts', 'tsx', 'js', 'go',
                   'rs', 'java', 'cpp', 'c', 'cs'):  return 'code'
        if ext in ('mp3', 'wav', 'm4a', 'ogg',
                   'webm') and 'audio' in content_type: return 'audio'
        if ext in ('mp4', 'mov', 'webm', 'avi') and \
           'video' in content_type:                  return 'video'
        if ext in ('jpg', 'jpeg', 'png', 'gif',
                   'webp', 'bmp'):                   return 'image'
        return 'text'

    def get_file_type(self, filename: str) -> str:
        """Legacy method for backward compatibility."""
        ext = filename.split(".")[-1].lower()
        for file_type, config in self.provider_routing.items():
            if ext in config["formats"]:
                return file_type
        return "text"

    def select_provider(self, 
                        message: str, 
                        file_type: Optional[str] = None, 
                        assistant: Optional[str] = None, 
                        requested_model: Optional[str] = None) -> str:
        """Legacy method for backward compatibility."""
        if requested_model and requested_model != "auto":
            return requested_model
            
        if assistant and assistant in self.assistant_preferences:
            return self.assistant_preferences[assistant]
            
        if file_type and file_type in self.provider_routing:
            return self.provider_routing[file_type]["primary"]
            
        return "claude" # Default


# Exported singleton
forge_router = FORGERouter()
