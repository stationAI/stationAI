import os
from pydantic_settings import BaseSettings
from pydantic import Field, HttpUrl
from typing import Optional

class Settings(BaseSettings):
    # Supabase Connection
    SUPABASE_URL: str = Field("https://ryzojlkwxvtrofdbrwzx.supabase.co", env="SUPABASE_URL")
    SUPABASE_KEY: str = Field("mock_supabase_key_for_immediate_demo_mode", env="SUPABASE_KEY")
    
    # Redis Cache & Sessions
    REDIS_URL: str = Field("redis://localhost:6379/0", env="REDIS_URL")
    
    # RunPod GPU Inference (Whisper / Gemma 4 / Chatterbox)
    RUNPOD_API_URL: Optional[str] = Field(None, env="RUNPOD_API_URL")
    RUNPOD_API_KEY: Optional[str] = Field(None, env="RUNPOD_API_KEY")
    
    # FastAPI Server configuration
    HOST: str = Field("0.0.0.0", env="HOST")
    PORT: int = Field(8000, env="PORT")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

# Instantiate and validate settings
settings = Settings(_env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"))
