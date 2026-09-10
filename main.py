from contextlib import asynccontextmanager
from pathlib import Path
import sys

# Uvicorn is kept here when the shared interpreter is not writable.
LOCAL_PACKAGES = Path(__file__).with_name(".packages")
if LOCAL_PACKAGES.exists():
    sys.path.insert(0, str(LOCAL_PACKAGES))

from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles

from analytics import router as analytics_router
from audit_logging import configure_logging
from database import init_db
from gis_services import router as gis_router
from landslide_prediction import LandslidePredictionEngine
from report_service import router as report_router
from routes import router as auth_router
from schemas import PredictionRequest
from weather_services import router as weather_router

logger = configure_logging()
predictor = LandslidePredictionEngine()


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    # rainfall (mm), slope (degrees), soil moisture (%) and known outcomes.
    predictor.fit(
        [[12, 8, 20], [18, 15, 30], [45, 25, 65], [70, 35, 78], [90, 40, 88], [35, 12, 45]],
        [0, 0, 1, 1, 1, 0],
    )
    logger.info("Landslide monitoring service started")
    yield
    logger.info("Landslide monitoring service stopped")


app = FastAPI(title="Landslide Monitoring API", version="1.0.0", lifespan=lifespan)
app.include_router(auth_router)
app.include_router(analytics_router)
app.include_router(gis_router)
app.include_router(report_router)
app.include_router(weather_router)


@app.get("/health", tags=["system"])
def health() -> dict:
    return {"status": "ok"}


@app.post("/prediction/predict", tags=["prediction"])
def predict(request: PredictionRequest) -> dict:
    values = [[request.rainfall_mm, request.slope_degrees, request.soil_moisture]]
    prediction = predictor.predict(values)[0]
    return {"prediction": prediction, "risk": "high" if prediction else "low"}


@app.post("/prediction/batch", tags=["prediction"])
def batch_predict(requests: list[PredictionRequest]) -> dict:
    values = [[item.rainfall_mm, item.slope_degrees, item.soil_moisture] for item in requests]
    predictions = predictor.predict(values) if values else []
    return {"predictions": predictions}


BASE_DIR = Path(__file__).resolve().parent
FRONTENDS_DIR = BASE_DIR / "frontends"
FRONTEND_DIR = BASE_DIR / "frontend"


@app.get("/frontends", include_in_schema=False)
def redirect_frontends():
    return RedirectResponse(url="/frontends/")


@app.get("/giridrishti", include_in_schema=False)
@app.get("/inventory", include_in_schema=False)
def redirect_inventory():
    return RedirectResponse(url="/")


@app.get("/command-center", include_in_schema=False)
@app.get("/frontend", include_in_schema=False)
def redirect_command_center():
    return RedirectResponse(url="/command-center/")


# Mount the command-center (tactical dashboard) at /command-center and /frontend
if FRONTEND_DIR.exists():
    app.mount("/command-center", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="command_center")
    app.mount("/frontend", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")

# Mount frontends at /frontends and at root /
if FRONTENDS_DIR.exists():
    app.mount("/frontends", StaticFiles(directory=str(FRONTENDS_DIR), html=True), name="frontends")
    app.mount("/", StaticFiles(directory=str(FRONTENDS_DIR), html=True), name="primary_frontend")
elif FRONTEND_DIR.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="fallback_frontend")


if __name__ == "__main__":
    try:
        import uvicorn

        if not callable(getattr(uvicorn, "run", None)):
            raise ImportError("A usable Uvicorn installation was not found")
        uvicorn.run(app, host="127.0.0.1", port=8000)
    except ImportError:
        from simple_server import run

        run()
