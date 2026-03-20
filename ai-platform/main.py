# winners-ecosystem/ai-platform/main.py
"""
Winners Ecosystem AI Platform - FastAPI Service
Refactored for Modular AI routing service
"""

from dotenv import load_dotenv
import os

# Load environment variables from parent .env file
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

# Import routers
from routers.chat import router as chat_router
from routers.images import router as images_router
from routers.speech import router as speech_router
from routers.multimodal import router as multimodal_router
from routers.health import router as health_router
from routers.config import router as config_router

app = FastAPI(title="Winners AI Platform", version="1.0.0")

# CORS - allow all for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(chat_router)
app.include_router(images_router)
app.include_router(speech_router)
app.include_router(multimodal_router)
app.include_router(health_router)
app.include_router(config_router)

@app.get("/")
async def root():
    """Health check"""
    return {
        "name": "Winners AI Platform",
        "version": "1.0.0",
        "status": "running",
        "timestamp": datetime.utcnow().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
