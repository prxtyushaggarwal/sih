from fastapi import APIRouter

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/district-risk")
def district_risk() -> dict:
    """Return landslide risk scores and alert levels for NER districts."""
    return {"district_risk": [
        {"district": "Mangan (North Sikkim)", "state": "Sikkim", "risk": "high", "score": 0.89, "slope_deg": 41.2, "rainfall_mm": 112.5},
        {"district": "Cherrapunji (East Khasi Hills)", "state": "Meghalaya", "risk": "high", "score": 0.91, "slope_deg": 38.0, "rainfall_mm": 138.0},
        {"district": "Noney (Tupul)", "state": "Manipur", "risk": "high", "score": 0.88, "slope_deg": 39.4, "rainfall_mm": 98.0},
        {"district": "Dima Hasao (Haflong)", "state": "Assam", "risk": "high", "score": 0.85, "slope_deg": 36.8, "rainfall_mm": 94.0},
        {"district": "Tawang", "state": "Arunachal Pradesh", "risk": "high", "score": 0.81, "slope_deg": 43.5, "rainfall_mm": 86.4},
        {"district": "Kohima", "state": "Nagaland", "risk": "high", "score": 0.79, "slope_deg": 35.0, "rainfall_mm": 72.0},
        {"district": "Aizawl Slopes", "state": "Mizoram", "risk": "medium", "score": 0.58, "slope_deg": 31.0, "rainfall_mm": 54.0},
        {"district": "Gangtok", "state": "Sikkim", "risk": "medium", "score": 0.54, "slope_deg": 28.5, "rainfall_mm": 48.0},
        {"district": "Shillong", "state": "Meghalaya", "risk": "medium", "score": 0.48, "slope_deg": 24.0, "rainfall_mm": 42.0},
        {"district": "Agartala", "state": "Tripura", "risk": "low", "score": 0.16, "slope_deg": 7.0, "rainfall_mm": 18.0},
    ]}
