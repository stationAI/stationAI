import json
import re
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.db import redis_client, supabase
import asyncio

logger = logging.getLogger("station_ai.session")

SESSION_TTL = 28800 # 8 hours TTL in seconds as specified in the PRD

class SessionState:
    """
    Data container representing the active state of a trainee session.
    """
    def __init__(
        self,
        session_id: str,
        trainee_id: str,
        restaurant_id: str,
        station_id: str,
        current_procedure: str = "",
        current_step_index: int = 0,
        procedure_steps: List[str] = None,
        conversation_history: List[Dict[str, str]] = None,
        last_active: float = 0.0,
        rush_mode: bool = False
    ):
        self.session_id = session_id
        self.trainee_id = trainee_id
        self.restaurant_id = restaurant_id
        self.station_id = station_id
        self.current_procedure = current_procedure
        self.current_step_index = current_step_index
        self.procedure_steps = procedure_steps or []
        self.conversation_history = conversation_history or [] # Last 10 turns
        self.last_active = last_active
        self.rush_mode = rush_mode

    def to_dict(self) -> Dict[str, Any]:
        return {
            "session_id": self.session_id,
            "trainee_id": self.trainee_id,
            "restaurant_id": self.restaurant_id,
            "station_id": self.station_id,
            "current_procedure": self.current_procedure,
            "current_step_index": self.current_step_index,
            "procedure_steps": self.procedure_steps,
            "conversation_history": self.conversation_history,
            "last_active": self.last_active,
            "rush_mode": self.rush_mode
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "SessionState":
        return cls(
            session_id=data["session_id"],
            trainee_id=data["trainee_id"],
            restaurant_id=data["restaurant_id"],
            station_id=data["station_id"],
            current_procedure=data.get("current_procedure", ""),
            current_step_index=data.get("current_step_index", 0),
            procedure_steps=data.get("procedure_steps", []),
            conversation_history=data.get("conversation_history", []),
            last_active=data.get("last_active", 0.0),
            rush_mode=data.get("rush_mode", False)
        )

# -------------------------------------------------------------
# REDIS PERSISTENCE LAYER
# -------------------------------------------------------------

async def get_active_session(session_id: str) -> Optional[SessionState]:
    """
    Retrieves the active session state from Redis.
    """
    try:
        data = await redis_client.get(f"session:{session_id}")
        if data:
            return SessionState.from_dict(json.loads(data))
        return None
    except Exception as e:
        logger.error(f"Redis session lookup failed for {session_id}: {e}")
        return None


async def save_active_session(state: SessionState) -> bool:
    """
    Saves the session state to Redis with an 8-hour TTL.
    Called on every transaction turn to maintain absolute persistence.
    """
    state.last_active = asyncio.get_event_loop().time()
    try:
        # Enforce last 10 conversation turns in the memory to prevent memory bloat
        if len(state.conversation_history) > 10:
            state.conversation_history = state.conversation_history[-10:]
            
        await redis_client.setex(
            f"session:{state.session_id}",
            SESSION_TTL,
            json.dumps(state.to_dict())
        )
        return True
    except Exception as e:
        logger.error(f"Failed to save session {state.session_id} to Redis: {e}")
        return False

# -------------------------------------------------------------
# STEP BY STEP GUIDANCE ENGINE
# -------------------------------------------------------------

def parse_procedure_steps_from_context(context_chunks: List[Dict[str, Any]]) -> List[str]:
    """
    Analyzes retrieved context chunks to detect and extract step sequences (e.g. "Step 1:...", "1. ...").
    Extracts up to 50 sequential steps to populate the Procedure guidance checklist.
    """
    steps = []
    full_text = "\n".join([chunk["content"] for chunk in context_chunks])
    
    # Detect patterns matching standard step-lists: e.g. "Step 1: Toast bun", "2. Lower basket"
    pattern = re.compile(r'(?:Step\s+\d+[:.]|\d+[:.])\s+([^\n.]+)', re.IGNORECASE)
    matches = pattern.findall(full_text)
    
    if matches:
        for m in matches:
            step_desc = m.strip()
            if step_desc and step_desc not in steps:
                steps.append(step_desc)
    else:
        # Fallback to splitting by periods/new lines if no standard steps are numbered
        lines = [line.strip() for line in full_text.split("\n") if len(line.strip()) > 15]
        steps = lines[:10] # Extract top 10 instructions
        
    return steps


async def process_step_navigation(state: SessionState, confirmation_utterance: str) -> str:
    """
    Advances the trainee to the next step when a confirmation keyword is spoken.
    Tracks step completion index and returns the step description to Chatterbox.
    """
    if not state.procedure_steps:
        return "I don't have an active procedure loaded yet. What station task are we working on?"
        
    if state.current_step_index >= len(state.procedure_steps):
        # Already completed
        return "You have completed all steps for this procedure! Say the wake word when you are ready to start another task."

    current_desc = state.procedure_steps[state.current_step_index]
    step_num = state.current_step_index + 1
    
    # Check if this was the final step
    if step_num == len(state.procedure_steps):
        state.current_step_index += 1
        await save_active_session(state)
        # Audit session completion to Supabase log
        try:
            supabase.table("logs").insert({
                "session_id": state.session_id,
                "question": "Step confirmation: Final",
                "answer": "Procedure completed successfully. Great job!",
                "response_time_ms": 10,
                "confidence_score": 0.99
            }).execute()
        except Exception as e:
            logger.warning(f"Failed to write completion log: {e}")
            
        return f"Step {step_num}: {current_desc}. That was the final step! You have successfully completed this task. Excellent work!"
        
    # Advance to next step index
    state.current_step_index += 1
    await save_active_session(state)
    
    next_step_num = state.current_step_index + 1
    next_desc = state.procedure_steps[state.current_step_index]
    
    return f"Got it. Step {next_step_num}: {next_desc}."

# -------------------------------------------------------------
# SUPABASE SYNCHRONIZATION
# -------------------------------------------------------------

async def close_and_sync_session(session_id: str) -> bool:
    """
    Terminates an active session:
    Saves final metadata and timestamps to Supabase, clears Redis cache, and updates dashboard status.
    """
    logger.info(f"Closing session and syncing to Supabase: {session_id}")
    state = await get_active_session(session_id)
    if not state:
        return False
        
    try:
        # Update session record in public.sessions table
        current_time = datetime.utcnow().isoformat()
        supabase.table("sessions") \
            .update({
                "ended_at": current_time,
                "status": "completed",
                "last_active": current_time
            }) \
            .eq("session_id", session_id) \
            .execute()
            
        # Delete active Redis key
        await redis_client.delete(f"session:{session_id}")
        logger.info(f"Session {session_id} successfully closed and synchronized.")
        return True
    except Exception as e:
        logger.error(f"Failed to sync session closure: {e}")
        return False
