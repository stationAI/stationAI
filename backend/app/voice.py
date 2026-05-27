import asyncio
import logging
import re
from typing import Dict, Any, AsyncGenerator, Optional
import numpy as np
from app.config import settings
from app.db import supabase
from app.session import SessionState, get_active_session, save_active_session, process_step_navigation, parse_procedure_steps_from_context, close_and_sync_session
from app.retrieve import retrieve_context

# Import optional webrtcvad for VAD frame gating
try:
    import webrtcvad
    VAD_AVAILABLE = True
except ImportError:
    VAD_AVAILABLE = False

logger = logging.getLogger("station_ai.voice")

# Initialize webrtcvad frame checker (sensitivity level 1 to 3; 3 is most aggressive at filtering out noise)
vad = webrtcvad.Vad(3) if VAD_AVAILABLE else None

# -------------------------------------------------------------
# AUDIO VAD & FILTERING WIDGETS
# -------------------------------------------------------------

def is_speech_frame(frame: bytes, sample_rate: int = 16000) -> bool:
    """
    Checks if a given PCM audio frame (10ms, 20ms, or 30ms) contains human speech.
    Filters out static fryer and extract fan hums below 60dB.
    """
    if not VAD_AVAILABLE or not vad:
        return True # Fallback if library is not loaded

    # 16-bit PCM mono frame size calculations:
    # At 16000Hz, a 30ms frame is 16000 * 0.03 = 480 samples. 2 bytes per sample = 960 bytes.
    frame_length = len(frame)
    if frame_length not in (320, 640, 960): # 10ms, 20ms, 30ms frame sizes at 16kHz
        # Apply normalization or pass
        return True

    # Simple noise gate: calculate root-mean-square (RMS) energy to filter out low-volume fan hums
    audio_data = np.frombuffer(frame, dtype=np.int16)
    rms = np.sqrt(np.mean(audio_data.astype(np.float32)**2)) if len(audio_data) > 0 else 0
    if rms < 300: # Threshold corresponding roughly to 60dB in a commercial kitchen
        return False

    try:
        return vad.is_speech(frame, sample_rate)
    except Exception:
        return True

# -------------------------------------------------------------
# WHISPER STT CONNECTOR
# -------------------------------------------------------------

async def transcribe_audio_chunk(audio_bytes: bytes) -> Dict[str, Any]:
    """
    Communicates with Whisper Small hosted on Cloud Run GPU to transcribe audio.
    Returns transcribed text along with a confidence score.
    """
    logger.info("Transcribing audio chunk via Whisper GPU...")
    # Mocking STT transcription latency (target <300ms)
    await asyncio.sleep(0.25)
    
    # Simple mock transcript return for simulation. 
    # Real pipeline sends a POST request with the PCM wav buffer.
    return {
        "text": "how do I build a chicken burger",
        "confidence": 0.94
    }

# -------------------------------------------------------------
# INTENT CLASSIFIER (95% Accuracy Target)
# -------------------------------------------------------------

def classify_intent(text: str) -> str:
    """
    Classifies trainee utterance into standard operational routing:
    - RUSH_MODE: toggles 5-word quick instruction.
    - EXIT: exits shifts gracefully.
    - CONFIRMATION: advances step checklist.
    - QUESTION: triggers semantic database retrieval.
    - AMBIGUOUS: prompts clarification.
    """
    cleaned = text.lower().strip()
    
    # 1. Check for Rush Mode voice trigger
    if "rush mode" in cleaned:
        return "RUSH_MODE"
        
    # 2. Check for End Session phrase
    if cleaned in ("goodbye coach", "coach done", "exit session", "stop training"):
        return "EXIT"

    # 3. Check for Confirmation keywords
    confirm_words = {"done", "finished", "ready", "next", "yes", "okay", "got it", "ok"}
    # Split text into words to check exact matching
    words = set(re.findall(r'\b\w+\b', cleaned))
    if words.intersection(confirm_words):
        return "CONFIRMATION"

    # 4. Check for Procedure Questions
    question_starters = ("how", "what", "when", "where", "why", "who", "which", "can you", "could you")
    if cleaned.startswith(question_starters) or cleaned.endswith("?"):
        return "QUESTION"

    # 5. Fallback for ambiguous input
    return "AMBIGUOUS"

# -------------------------------------------------------------
# GEMMA 4 SLM PROMPT INFERENCE
# -------------------------------------------------------------

async def query_gemma_model(prompt: str, max_tokens: int = 100) -> str:
    """
    Calls Gemma 4 model hosted on Cloud Run GPU to execute context-aware inference.
    """
    logger.info("Running inference query against Gemma 4 GPU...")
    # Target latency <500ms
    await asyncio.sleep(0.3)
    
    # Mock response based on prompt instructions
    if "Rush mode" in prompt:
        return "Toast bun. Apply mayo. Close."
    elif "chicken burger" in prompt:
        return "Step 1: Toast the burger bun for 15 seconds. Step 2: Apply 15ml of mayonnaise. Step 3: Add shredded lettuce. Step 4: Place the crispy chicken breast and close the sandwich."
    else:
        return "Ask your manager."

# -------------------------------------------------------------
# CHATTERBOX TTS STREAMING GENERATOR
# -------------------------------------------------------------

async def stream_tts_audio(text: str, restaurant_id: str) -> AsyncGenerator[bytes, None]:
    """
    Converts AI response to speech using Chatterbox TTS async generator streaming mono PCM back to client.
     Achieves first word streaming in under 400ms.
    """
    logger.info(f"Generating TTS audio stream via Chatterbox for: '{text}'")
    # In the full model, we check for a voice clone sample in:
    # path: voice-clones/{restaurant_id}/sample.wav
    # If present, ChatterBox clones it in under 2 minutes. Otherwise, it uses default.
    
    # Generate mock 24kHz Mono 16-bit PCM audio chunks (yielding 4000 byte blocks)
    # Target first word under 400ms
    await asyncio.sleep(0.15) # First word streaming delay
    
    for i in range(3):
        # Yield mock PCM noise block representation
        yield b'\x00\x0f' * 2000
        await asyncio.sleep(0.1)
        
# -------------------------------------------------------------
# CENTRAL PIPELINE ORCHESTRATOR (End-to-End < 1.5 seconds)
# -------------------------------------------------------------

async def execute_voice_turn(
    session_id: str,
    audio_data: bytes
) -> Dict[str, Any]:
    """
    Orchestrates the entire real-time Voice Mentor pipeline turn:
    STT -> Intent Classify -> RAG -> Gemma -> TTS -> Session state persist.
    """
    start_time = asyncio.get_event_loop().time()
    
    # 1. Load active session state
    state = await get_active_session(session_id)
    if not state:
        return {"error": "Active training session not found."}

    # 2. Transcribe voice buffer via Whisper
    stt_res = await transcribe_audio_chunk(audio_data)
    text = stt_res["text"]
    confidence = stt_res["confidence"]
    
    # Whisper quality gate
    if confidence < 0.70:
        return {
            "text": "I didn't quite catch that, could you repeat?",
            "action": "REPEAT",
            "latency_ms": int((asyncio.get_event_loop().time() - start_time) * 1000)
        }

    # 3. Classify Utterance Intent
    intent = classify_intent(text)
    response_text = ""
    action = intent

    if intent == "RUSH_MODE":
        state.rush_mode = True
        await save_active_session(state)
        response_text = "Rush mode active! Say done for next step."
        
    elif intent == "EXIT":
        response_text = "Goodbye! Session closed successfully."
        # Background final sync to database
        asyncio.create_task(close_and_sync_session(session_id))
        
    elif intent == "CONFIRMATION":
        # Advance step guidance checklist
        response_text = await process_step_navigation(state, text)
        
    elif intent == "QUESTION":
        # RAG retrieval from Supabase (Hybridpgvector + BM25)
        context_chunks = await retrieve_context(
            question=text,
            restaurant_id=state.restaurant_id,
            station=state.station_id
        )
        
        # Populate procedure checklist steps if not loaded yet
        if not state.procedure_steps:
            state.procedure_steps = parse_procedure_steps_from_context(context_chunks)
            state.current_step_index = 0
            
        # Compile system prompts for Gemma 4
        if state.rush_mode:
            # 5 words maximum
            prompt = f"[INST] You are Coach. Rush mode active. Give instruction in 5 words maximum. Facts: {context_chunks[0]['content'] if context_chunks else ''} Task: {text} [/INST]"
            response_text = await query_gemma_model(prompt, max_tokens=20)
        else:
            # 2 sentences maximum
            facts = " ".join([c["content"] for c in context_chunks])
            prompt = f"[INST]\nYou are Coach. A kitchen training assistant.\nRules:\n- Answer in 1-2 sentences only\n- Use only the facts below\n- If answer not found say exactly: Ask your manager\n- Never guess or make up information\nFacts:\n{facts}\nQuestion: {text}\n[/INST]"
            response_text = await query_gemma_model(prompt, max_tokens=100)

        # Append last turn to history
        state.conversation_history.append({"q": text, "a": response_text})
        await save_active_session(state)
        
    else: # AMBIGUOUS
        response_text = "Say 'done' to continue or ask a question."

    # 4. Write audit transaction log to Supabase in the background
    end_time = asyncio.get_event_loop().time()
    latency_ms = int((end_time - start_time) * 1000)
    
    try:
        supabase.table("logs").insert({
            "session_id": session_id,
            "question": text,
            "answer": response_text,
            "response_time_ms": latency_ms,
            "confidence_score": confidence,
            "flagged": False
        }).execute()
    except Exception as e:
        logger.warning(f"Failed to save shift transaction log: {e}")

    return {
        "text": response_text,
        "action": action,
        "latency_ms": latency_ms,
        "rush_mode": state.rush_mode
    }
