from fastapi import APIRouter, HTTPException, status

from database import authenticate, create_user
from models import LoginRequest, RegisterRequest

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(request: RegisterRequest) -> dict:
    try:
        user = create_user(request.username, request.role, str(request.email), request.password)
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    return {"message": "User registered successfully.", "user": {key: user[key] for key in ("id", "username", "role", "email")}}


@router.post("/login")
def login(request: LoginRequest) -> dict:
    user = authenticate(request.username, request.password)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    return {"message": "Login successful.", "user": {key: user[key] for key in ("id", "username", "role", "email")}}
