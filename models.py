from pydantic import BaseModel, Field


class User(BaseModel):
    id: int
    username: str
    role: str
    email: str


class Role(BaseModel):
    id: int
    name: str


class District(BaseModel):
    id: int
    name: str


class Village(BaseModel):
    id: int
    name: str


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    role: str = "Member"
    email: str
    password: str = Field(min_length=4)


class LoginRequest(BaseModel):
    username: str
    password: str
