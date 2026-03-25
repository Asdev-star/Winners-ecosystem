# winners-ecosystem/ai-platform/services/provider_service.py
import os
import httpx
from typing import Optional, Dict, Any, List
from fastapi import HTTPException

class ProviderService:
    async def call_claude(self, prompt: str, image_b64: Optional[str] = None, system: Optional[str] = None) -> Dict[str, Any]:
        """Call Anthropic Claude API"""
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not configured")
        
        messages = []
        if image_b64:
            messages.append({
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {"type": "base64", "media_type": "image/jpeg", "data": image_b64}
                    },
                    {"type": "text", "text": prompt}
                ]
            })
        else:
            messages.append({"role": "user", "content": prompt})
        
        payload = {
            "model": "claude-3-5-sonnet-20241022",
            "max_tokens": 4096,
            "messages": messages
        }
        if system:
            payload["system"] = system
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json"
                },
                json=payload,
                timeout=60.0
            )
            data = response.json()
            if "error" in data:
                raise Exception(data["error"].get("message", "Claude API Error"))
                
            return {
                "response": data["content"][0]["text"],
                "tokens": data.get("usage", {}).get("output_tokens", 0)
            }

    async def call_openai(self, prompt: str, audio_b64: Optional[str] = None, system: Optional[str] = None) -> Dict[str, Any]:
        """Call OpenAI GPT-4o API"""
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")
        
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
            
        user_content = []
        if audio_b64:
            user_content.append({
                "type": "input_audio",
                "input_audio": {"data": audio_b64, "format": "wav"}
            })
        user_content.append({"type": "text", "text": prompt})
        messages.append({"role": "user", "content": user_content})
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={"model": "gpt-4o", "messages": messages, "max_tokens": 4096},
                timeout=60.0
            )
            data = response.json()
            if "error" in data:
                raise Exception(data["error"].get("message", "OpenAI API Error"))
                
            return {
                "response": data["choices"][0]["message"]["content"],
                "tokens": data.get("usage", {}).get("total_tokens", 0)
            }

    async def call_gemini(self, prompt: str, video_b64: Optional[str] = None, system: Optional[str] = None) -> Dict[str, Any]:
        """Call Google Gemini API"""
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="GOOGLE_API_KEY not configured")
        
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        
        model_kwargs = {}
        if system:
            model_kwargs["system_instruction"] = system
            
        model = genai.GenerativeModel("gemini-1.5-pro", **model_kwargs)
        contents = [prompt]
        if video_b64:
            contents.append({"mime_type": "video/mp4", "data": video_b64})
        
        response = model.generate_content(contents)
        return {
            "response": response.text,
            "tokens": 0
        }

provider_service = ProviderService()
