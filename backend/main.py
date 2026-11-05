import logging
import os
from pathlib import Path
from typing import Any, Optional, Tuple, Union

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, FastAPI, Header, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from postgrest import APIError
from pydantic import BaseModel, field_validator
from supabase import Client, create_client
from supabase_auth.errors import AuthApiError

# Load environment variables
env_file = Path(__file__).resolve().parent / ".env"
if env_file.exists():
    load_dotenv(dotenv_path=env_file)
else:
    load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("campusconnect")

# Read Supabase credentials
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_PUBLISHABLE_KEY")

_base_client: Optional[Client] = None


def get_supabase_client() -> Client:
    """Get or initialize the shared Supabase client."""
    global _base_client
    if _base_client is not None:
        return _base_client

    url = os.environ.get("SUPABASE_URL") or SUPABASE_URL
    key = os.environ.get("SUPABASE_PUBLISHABLE_KEY") or SUPABASE_KEY

    if not url or not key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase credentials (SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY) are not configured.",
        )

    try:
        _base_client = create_client(url, key)
        logger.info("Supabase client initialized successfully")
        return _base_client
    except Exception as err:
        logger.exception("Failed to initialize Supabase client")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to connect to Supabase: {str(err)}",
        )


# Initialize FastAPI app
app = FastAPI(
    title="CampusConnect API",
    description="FastAPI backend for CampusConnect events and registrations",
    version="1.0.0",
)

# Configure CORS so frontend on any origin (e.g. Vercel deployment) can connect seamlessly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Custom exception handler for consistent {"error": "..."} format expected by frontend
@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    detail = exc.detail
    if isinstance(detail, dict):
        if "error" not in detail:
            detail["error"] = detail.get("detail", "An error occurred.")
        return JSONResponse(status_code=exc.status_code, content=detail)
    message = str(detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": message, "detail": message},
    )


@app.exception_handler(RequestValidationError)
async def custom_validation_exception_handler(
    request: Request, exc: RequestValidationError
):
    errors = exc.errors()
    first_msg = "Invalid request parameters."
    for error in errors:
        loc = error.get("loc", ())
        if "event_id" in loc:
            first_msg = "A valid event_id is required."
            break
        if "body" in loc and error.get("type") == "json_invalid":
            first_msg = "Request body must be valid JSON."
            break
        first_msg = error.get("msg", first_msg)

    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"error": first_msg, "detail": errors},
    )


# Dependency to extract and verify bearer token, returning (user, authenticated_client)
def get_authenticated_user_and_client(
    authorization: Optional[str] = Header(None),
) -> Tuple[Any, Client]:
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Valid bearer token required.",
        )

    scheme, _, token = authorization.partition(" ")
    clean_token = token.strip()
    if scheme.lower() != "bearer" or not clean_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Valid bearer token required.",
        )

    base_client = get_supabase_client()
    try:
        user_response = base_client.auth.get_user(clean_token)
    except AuthApiError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Valid bearer token required.",
        )
    except Exception as err:
        logger.warning(f"Authentication verification error: {err}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Valid bearer token required.",
        )

    if user_response is None or not getattr(user_response, "user", None):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Valid bearer token required.",
        )

    url = os.environ.get("SUPABASE_URL") or SUPABASE_URL
    key = os.environ.get("SUPABASE_PUBLISHABLE_KEY") or SUPABASE_KEY
    request_client: Client = create_client(url, key)
    request_client.postgrest.auth(clean_token)

    try:
        yield user_response.user, request_client
    finally:
        try:
            if hasattr(request_client.postgrest, "session"):
                request_client.postgrest.session.close()
            if hasattr(request_client.auth, "close"):
                request_client.auth.close()
        except Exception:
            pass


# Pydantic schemas
class RegistrationCreate(BaseModel):
    event_id: Union[str, int]

    @field_validator("event_id")
    @classmethod
    def validate_event_id(cls, value: Any) -> Any:
        if isinstance(value, bool):
            raise ValueError("A valid event_id is required.")
        if isinstance(value, (str, int)):
            s = str(value).strip()
            if not s:
                raise ValueError("A valid event_id is required.")
            return value
        raise ValueError("A valid event_id is required.")


# API Router
router = APIRouter()


@router.get("/health")
def health_check():
    return {"status": "ok", "service": "CampusConnect FastAPI"}


@router.get("/events")
def list_events():
    client = get_supabase_client()
    try:
        response = client.table("events").select("*").execute()
    except APIError:
        logger.exception("Unable to load events.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to load events.",
        )
    return response.data or []


@router.get("/events/{event_id}")
def get_event(event_id: str):
    client = get_supabase_client()
    try:
        response = (
            client.table("events")
            .select("*")
            .eq("id", event_id)
            .limit(1)
            .execute()
        )
    except APIError as error:
        if getattr(error, "code", None) == "22P02":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found.",
            )
        logger.exception("Unable to load event.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to load event.",
        )

    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found.",
        )
    return response.data[0]


@router.post("/registrations", status_code=status.HTTP_201_CREATED)
def create_registration(
    payload: RegistrationCreate,
    auth_data: Tuple[Any, Client] = Depends(get_authenticated_user_and_client),
):
    user, auth_client = auth_data
    event_id = payload.event_id

    try:
        response = (
            auth_client.table("registrations")
            .insert({"event_id": event_id, "user_id": user.id})
            .select("*")
            .execute()
        )
    except APIError as error:
        if getattr(error, "code", None) == "23505":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="You are already registered for this event.",
            )
        if getattr(error, "code", None) == "23503":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found.",
            )
        logger.exception("Unable to create registration.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create registration.",
        )

    registration = response.data[0] if response.data else None
    return registration


@router.get("/me/registrations")
def list_my_registrations(
    auth_data: Tuple[Any, Client] = Depends(get_authenticated_user_and_client),
):
    user, auth_client = auth_data
    try:
        response = (
            auth_client.table("registrations")
            .select("*")
            .eq("user_id", user.id)
            .execute()
        )
    except APIError:
        logger.exception("Unable to load registrations.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to load registrations.",
        )
    return response.data or []


@router.get("/events/{event_id}/registrations")
def list_event_registrations(
    event_id: str,
    auth_data: Tuple[Any, Client] = Depends(get_authenticated_user_and_client),
):
    user, auth_client = auth_data
    try:
        event_response = (
            auth_client.table("events")
            .select("id, organizer_id")
            .eq("id", event_id)
            .limit(1)
            .execute()
        )
    except APIError as error:
        if getattr(error, "code", None) == "22P02":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found.",
            )
        logger.exception("Unable to load event.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to load event.",
        )

    if not event_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found.",
        )

    organizer_id = event_response.data[0].get("organizer_id")
    if organizer_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the event organizer can view registrations.",
        )

    try:
        response = (
            auth_client.table("registrations")
            .select("*")
            .eq("event_id", event_id)
            .execute()
        )
    except APIError:
        logger.exception("Unable to load event registrations.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to load event registrations.",
        )
    return response.data or []


# HTML root route (matches original Flask app index)
@app.get("/", response_class=HTMLResponse)
def index():
    try:
        client = get_supabase_client()
        response = client.table("users").select("*").execute()
        users = response.data or []
        html = "<h1>Users</h1><ul>"
        for user in users:
            email = user.get("email", "Unknown")
            html += f"<li>{email}</li>"
        html += "</ul>"
        return HTMLResponse(content=html)
    except Exception as error:
        error_msg = getattr(error, "message", str(error))
        return HTMLResponse(content=f"<p>Error loading users: {error_msg}</p>")


# Mount router both at /api and at root for full routing compatibility on Vercel and locally
app.include_router(router, prefix="/api")
app.include_router(router)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=5001, reload=True)
