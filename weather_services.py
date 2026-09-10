from fastapi import APIRouter

router = APIRouter(prefix="/weather", tags=["weather"])


@router.get("/")
def weather() -> dict:
    return {"weather_data": {"rainfall_mm": 42.0, "temperature_c": 24.0, "source": "demo"}}
