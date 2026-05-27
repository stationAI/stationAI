import json
import logging
import time
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Dict, Any, List
from datetime import datetime
from app.db import supabase
from app.voice import query_gemma_model

logger = logging.getLogger("station_ai.observability")

# -------------------------------------------------------------
# STRUCTURED JSON LOGGING MIDDLEWARE
# -------------------------------------------------------------

class StructuredLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware that intercepts all incoming API calls and logs structured JSON telemetry
    containing execution latency, endpoint paths, client metadata, and statuses.
    """
    async def dispatch(self, request: Request, call_next) -> Response:
        start_time = time.time()
        
        # Read request metadata
        client_ip = request.client.host if request.client else "unknown"
        method = request.method
        path = request.url.path
        
        response = await call_next(request)
        
        # Calculate execution latency in milliseconds
        process_time_ms = int((time.time() - start_time) * 1000)
        status_code = response.status_code
        
        log_payload = {
            "timestamp": datetime.utcnow().isoformat(),
            "client_ip": client_ip,
            "method": method,
            "path": path,
            "status_code": status_code,
            "latency_ms": process_time_ms
        }
        
        # Log in clean, structured JSON format for monitoring integrations (e.g. Datadog, CloudWatch)
        logger.info(json.dumps(log_payload))
        
        return response

# -------------------------------------------------------------
# OFFLINE LEARNING LOOP: GOLDEN TEST SETS & LoRA DATASETS
# -------------------------------------------------------------

async def curate_golden_test_set(restaurant_id: str) -> List[Dict[str, Any]]:
    """
    Queries the Supabase logs table to extract all session items flagged with a
    'thumbs down' by managers, curating them into a Golden Test Set feedback store.
    """
    logger.info(f"Curating Golden Test Set for restaurant: {restaurant_id}")
    try:
        # Select flagged interaction logs in Supabase
        res = supabase.table("logs") \
            .select("log_id, question, answer, confidence_score") \
            .eq("flagged", True) \
            .execute()
            
        if not res.data:
            logger.info("No flagged session errors found. Golden Test Set is empty.")
            return []
            
        logger.info(f"Retrieved {len(res.data)} flagged errors for the feedback store.")
        return res.data
    except Exception as e:
        logger.error(f"Failed to curate Golden Test Set: {e}")
        return []


async def run_accuracy_eval_job(restaurant_id: str) -> Dict[str, Any]:
    """
    Weekly automated evaluation task:
    Re-runs the Golden Test Set questions through Gemma 4, calculates model accuracy,
    and logs evaluation statistics.
    """
    logger.info(f"Starting automated weekly accuracy evaluation job for: {restaurant_id}")
    golden_set = await curate_golden_test_set(restaurant_id)
    if not golden_set:
        return {"status": "skipped", "message": "Golden Test Set is empty."}
        
    start_time = time.time()
    passed_count = 0
    total_count = len(golden_set)
    
    for item in golden_set:
        question = item["question"]
        expected_answer = item["answer"]
        
        # Query current version of Gemma 4
        # Compile a test prompt with context
        prompt = f"[INST] You are Coach. Kitchen assistant. Answer: {question} [/INST]"
        new_answer = await query_gemma_model(prompt, max_tokens=100)
        
        # Simple semantic overlap match for evaluation
        # In a full run, we compute BLEU/ROUGE scores or use a judge model
        if len(set(new_answer.lower().split()).intersection(set(expected_answer.lower().split()))) > 2:
            passed_count += 1
            
    accuracy_rate = passed_count / total_count if total_count > 0 else 1.0
    duration = time.time() - start_time
    
    eval_stats = {
        "restaurant_id": restaurant_id,
        "eval_timestamp": datetime.utcnow().isoformat(),
        "total_test_cases": total_count,
        "passed_cases": passed_count,
        "accuracy_rate": accuracy_rate,
        "duration_seconds": int(duration)
    }
    
    logger.info(f"Evaluation Job completed. Accuracy: {accuracy_rate * 100}%.")
    
    # Store audit logs record
    try:
        supabase.table("audit").insert({
            "action": "ACCURACY_EVAL_RUN",
            "details": eval_stats
        }).execute()
    except Exception as e:
        logger.warning(f"Failed to save evaluation audit: {e}")
        
    return eval_stats


async def generate_fine_tuning_dataset(restaurant_id: str) -> Optional[str]:
    """
    Gathers successful, high-confidence trainee conversation turns (not flagged)
    and formats them into a JSON Lines (.jsonl) dataset, ready for LoRA fine-tuning.
    """
    logger.info(f"Compiling LoRA fine-tuning dataset for restaurant: {restaurant_id}")
    try:
        res = supabase.table("logs") \
            .select("question, answer") \
            .eq("flagged", False) \
            .gt("confidence_score", 0.85) \
            .limit(1000) \
            .execute()
            
        if not res.data or len(res.data) < 10:
            logger.warning("Insufficient high-confidence logs to generate a quality dataset.")
            return None
            
        jsonl_lines = []
        for turn in res.data:
            # Format in Gemma instruction-tuning structure
            payload = {
                "text": f"<bos><start_of_turn>user\n{turn['question']}<end_of_turn>\n<start_of_turn>model\n{turn['answer']}<end_of_turn>\n"
            }
            jsonl_lines.append(json.dumps(payload))
            
        full_jsonl = "\n".join(jsonl_lines)
        logger.info(f"LoRA training dataset generated successfully. Turns compiled: {len(jsonl_lines)}")
        return full_jsonl
    except Exception as e:
        logger.error(f"Failed to generate fine-tuning dataset: {e}")
        return None
