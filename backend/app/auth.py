from fastapi import APIRouter, HTTPException, Depends, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
import re
import logging
from app.db import supabase
from app.config import settings

logger = logging.getLogger("station_ai.auth")

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])
security = HTTPBearer()

# -------------------------------------------------------------
# PYDANTIC SCHEMAS
# -------------------------------------------------------------

class SignUpRequest(BaseModel):
    email: EmailStr
    password: str
    role: str = Field(..., description="Must be either 'trainee' or 'manager'")
    restaurant_id: Optional[str] = Field(None, description="UUID of the tenant restaurant")
    gdpr_consent: bool = Field(..., description="Must be true to comply with UK GDPR terms")

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """
        Relaxed password rules for Demo/Testing:
        - Minimum 4 characters
        """
        if len(v) < 4:
            raise ValueError("Password must be at least 4 characters long")
        return v

    @field_validator("role")
    @classmethod
    def validate_role_type(cls, v: str) -> str:
        if v not in ("trainee", "manager"):
            raise ValueError("Role must be either 'trainee' or 'manager'")
        return v

    @field_validator("gdpr_consent")
    @classmethod
    def validate_gdpr(cls, v: bool) -> bool:
        if not v:
            raise ValueError("UK GDPR consent is mandatory for registration")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthUserContext(BaseModel):
    user_id: str
    email: str
    role: str
    restaurant_id: Optional[str] = None

# -------------------------------------------------------------
# ROUTE GUARDS / DEPENDENCIES
# -------------------------------------------------------------

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> AuthUserContext:
    """
    Asynchronous FastAPI dependency that extracts and validates the JWT token
    from the Authorization header using Supabase Auth.
    """
    token = credentials.credentials
    try:
        # Get user details from Supabase Auth using the JWT token
        response = supabase.auth.get_user(token)
        if not response or not response.user:
            raise HTTPException(status_code=401, detail="Invalid session token")
        
        user_id = response.user.id
        email = response.user.email
        
        # Query public.users using direct selection to fetch role and restaurant_id
        # We query with RLS bypassed or direct database selector
        user_res = supabase.table("users").select("role, restaurant_id").eq("user_id", user_id).execute()
        
        if not user_res.data or len(user_res.data) == 0:
            raise HTTPException(status_code=401, detail="User profile not initialized in database")
        
        user_data = user_res.data[0]
        
        return AuthUserContext(
            user_id=user_id,
            email=email,
            role=user_data.get("role", "trainee"),
            restaurant_id=user_data.get("restaurant_id")
        )
    except Exception as e:
        logger.error(f"JWT Verification failed: {e}")
        raise HTTPException(status_code=401, detail="Session expired or invalid")


class RequireRole:
    """
    FastAPI dependency factory that restricts routes to specific user roles (RBAC).
    """
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: AuthUserContext = Depends(get_current_user)) -> AuthUserContext:
        if current_user.role not in self.allowed_roles:
            logger.warning(f"Access denied for user {current_user.user_id} with role {current_user.role}")
            raise HTTPException(
                status_code=403, 
                detail=f"Access forbidden. Required role(s): {', '.join(self.allowed_roles)}"
            )
        return current_user

# -------------------------------------------------------------
# CONTROLLER ROUTES
# -------------------------------------------------------------

@router.post("/signup")
async def signup(body: SignUpRequest):
    """
    Registers a new trainee or manager. Automatically links user info in public schema.
    """
    try:
        # Sign up using Supabase Auth, passing custom metadata in options.data
        # This will fire the Postgres trigger to sync data into the public.users table
        res = supabase.auth.sign_up({
            "email": body.email,
            "password": body.password,
            "options": {
                "data": {
                    "role": body.role,
                    "restaurant_id": body.restaurant_id
                }
            }
        })
        
        if not res or not res.user:
            raise HTTPException(status_code=400, detail="Registration failed")
            
        return {
            "success": True,
            "message": "User registered successfully",
            "user_id": res.user.id
        }
    except Exception as e:
        logger.error(f"Signup error: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login")
async def login(body: LoginRequest):
    """
    Authenticates email and password. Returns JWT token.
    """
    try:
        # Authenticate against Supabase Auth
        res = supabase.auth.sign_in_with_password({
            "email": body.email,
            "password": body.password
        })
        
        if not res or not res.session:
            raise HTTPException(status_code=401, detail="Authentication failed")
            
        # Get matching user profile from public.users
        user_res = supabase.table("users").select("role, restaurant_id").eq("user_id", res.user.id).execute()
        role = "trainee"
        restaurant_id = None
        if user_res.data and len(user_res.data) > 0:
            role = user_res.data[0].get("role", "trainee")
            restaurant_id = user_res.data[0].get("restaurant_id")
            
        return {
            "success": True,
            "message": "Welcome to the new way to train and supervise your staff with StationAI",
            "access_token": res.session.access_token,
            "refresh_token": res.session.refresh_token,
            "role": role,
            "restaurant_id": restaurant_id,
            "expires_in": res.session.expires_in
        }
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=401, detail="Invalid email or password")
