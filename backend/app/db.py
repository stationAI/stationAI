from supabase import create_client, Client
import redis.asyncio as aioredis
from app.config import settings
import logging

logger = logging.getLogger("station_ai.db")

# Initialize synchronous Supabase Client
try:
    supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    logger.info("Supabase client initialized successfully.")
except Exception as e:
    logger.error(f"Failed to initialize Supabase client: {e}")
    raise e

# Initialize asynchronous Redis connection client
# decode_responses=True returns strings instead of raw bytes for simpler retrieval
redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)

async def check_db_health() -> bool:
    """
    Diagnostic helper to verify connections to Supabase and Redis.
    """
    try:
        # Check Redis connection
        await redis_client.ping()
        
        # Check Supabase connection (simple select)
        supabase.table("tenants").select("count", count="exact").limit(1).execute()
        
        return True
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return False
