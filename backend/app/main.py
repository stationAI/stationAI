import os
import shutil
import logging
import uuid
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any
from app.config import settings
from app.db import supabase, check_db_health
from app.auth import router as auth_router, get_current_user, AuthUserContext
from app.ingest import ingest_document
from app.session import SessionState, save_active_session, get_active_session
from app.voice import execute_voice_turn, stream_tts_audio

# Setup high-quality logger formatting
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("station_ai.main")

app = FastAPI(
    title="StationAI Core API Monolith",
    description="Multi-tenant Real-time AI Voice Guidance Mentor Backend",
    version="1.0.0"
)

# Configure Cross-Origin Resource Sharing (CORS) for local and production hosts
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow mobile Expo clients and local dashboards
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect Phase 1 authentication routing
app.include_router(auth_router)

# Ensure temp directory exists for parsing uploads
UPLOAD_TEMP_DIR = "temp_uploads"
os.makedirs(UPLOAD_TEMP_DIR, exist_ok=True)

# -------------------------------------------------------------
# CORE HTTP ENDPOINTS
# -------------------------------------------------------------

@app.get("/health")
async def health_check():
    """
    Diagnostics endpoint to ensure server, database, and cache pools are online.
    """
    is_healthy = await check_db_health()
    if is_healthy:
        return {"status": "healthy", "database": "connected", "redis": "connected"}
    raise HTTPException(status_code=500, detail="Database or Cache connection offline")


@app.post("/api/v1/ingest/upload")
async def upload_document(
    file: UploadFile = File(...),
    station: str = Form(...),
    restaurant_id: str = Form(...),
    # Require manager credentials to authorize document ingestion
    current_user: AuthUserContext = Depends(get_current_user)
):
    """
    Uploads a training material file (PDF, Video, Audio, or Image) from the dashboard,
    validates criteria, and triggers the multi-modal RAG ingestion engine.
    """
    # Enforce P0 size threshold constraint (Max 10MB)
    max_size_bytes = 10 * 1024 * 1024
    content = await file.read()
    if len(content) > max_size_bytes:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB.")
    
    # Save upload to local temp path for processing
    temp_path = os.path.join(UPLOAD_TEMP_DIR, f"{uuid.uuid4()}_{file.filename}")
    try:
        with open(temp_path, "wb") as buffer:
            buffer.write(content)
        
        # Trigger full multimodal ingestion and embedding workflow
        result = await ingest_document(
            file_path=temp_path,
            restaurant_id=restaurant_id,
            station=station,
            manager_id=current_user.user_id,
            document_name=file.filename
        )
        
        # Cleanup temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)
            
        return result
    except Exception as e:
        logger.error(f"Failed to ingest uploaded document: {e}")
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/v1/sessions/start")
async def start_training_session(
    station_id: str,
    current_user: AuthUserContext = Depends(get_current_user)
):
    """
    Initializes a new trainee session, generating a session ID, setting up Redis caches,
    and inserting a tracking record in Supabase.
    """
    session_id = str(uuid.uuid4())
    restaurant_id = current_user.restaurant_id
    
    if not restaurant_id:
        raise HTTPException(status_code=400, detail="User profile lacks a valid restaurant_id reference.")

    try:
        # 1. Create a tracking session row in public.sessions table
        supabase.table("sessions").insert({
            "session_id": session_id,
            "trainee_id": current_user.user_id,
            "restaurant_id": restaurant_id,
            "station_id": station_id,
            "status": "active"
        }).execute()

        # 2. Create active session container in Redis cache
        state = SessionState(
            session_id=session_id,
            trainee_id=current_user.user_id,
            restaurant_id=restaurant_id,
            station_id=station_id
        )
        await save_active_session(state)
        
        return {
            "success": True,
            "session_id": session_id,
            "welcome_message": "Let's change the way of getting trained"
        }
    except Exception as e:
        logger.error(f"Failed to initialize training session: {e}")
        raise HTTPException(status_code=500, detail="Database session allocation failed.")

# -------------------------------------------------------------
# REAL-TIME BIDIRECTIONAL WEBSOCKET VOICE STREAM
# -------------------------------------------------------------

@app.websocket("/ws/voice/{session_id}")
async def websocket_voice_endpoint(websocket: WebSocket, session_id: str):
    """
    Asynchronous bidirectional WebSocket stream:
    Receives raw trainee PCM voice frames -> executes pipeline -> streams TTS wav response.
    """
    await websocket.accept()
    logger.info(f"Trainee headset connected. Active session: {session_id}")
    
    # Send welcoming audio trigger on connection
    welcome_text = "Welcome back, let's continue"
    # To demonstrate streaming, we send a start signal
    await websocket.send_json({"event": "welcome", "text": welcome_text})

    try:
        while True:
            # Trainee mobile client streams raw audio chunk as bytes via WebSocket
            data = await websocket.receive_bytes()
            if not data or len(data) == 0:
                continue

            # Run full voice pipeline turn (STT -> RAG -> LLM -> Audit)
            result = await execute_voice_turn(session_id, data)
            
            if "error" in result:
                await websocket.send_json({"event": "error", "message": result["error"]})
                continue

            # Stream back Chatterbox TTS audio frames in real-time
            response_text = result["text"]
            action = result["action"]
            
            await websocket.send_json({
                "event": "response_text",
                "text": response_text,
                "action": action,
                "latency_ms": result["latency_ms"]
            })

            # Async generator streams audio chunks back to the client device
            async for audio_chunk in stream_tts_audio(response_text, "default_tenant"):
                # Send raw binary audio frame to headset Web Audio API
                await websocket.send_bytes(audio_chunk)

            # Send complete marker
            await websocket.send_json({"event": "audio_complete"})

    except WebSocketDisconnect:
        logger.info(f"Trainee headset disconnected. Active session: {session_id}")
    except Exception as e:
        logger.error(f"WebSocket execution crash on {session_id}: {e}")
        try:
            await websocket.send_json({"event": "error", "message": "Voice pipeline encountered an internal error."})
        except Exception:
            pass

# -------------------------------------------------------------
# APPLICATION BOOTSTRAP
# -------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    # Boot uvicorn server on configured host and port
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True
    )
