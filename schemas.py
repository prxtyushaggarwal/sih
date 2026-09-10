from pydantic import BaseModel, Field


class UserSchema(BaseModel):
    id: int
    username: str
    role: str


class RoleSchema(BaseModel):
    id: int
    name: str


class PredictionRequest(BaseModel):
    rainfall_mm: float = Field(ge=0)
    slope_degrees: float = Field(ge=0, le=90)
    soil_moisture: float = Field(ge=0, le=100)


class ReportRequest(BaseModel):
    district: str
    description: str = Field(min_length=5)
    severity: str = "medium"
