from celery import Celery

# The memory broker keeps local development self-contained.  Use RabbitMQ/Redis
# configuration through environment variables for a deployed worker.
app = Celery("sensor", broker="memory://", backend="cache+memory://")


@app.task
def ingest_sensor_data(rainfall_mm: float, slope_degrees: float, soil_moisture: float) -> dict:
    return {
        "rainfall_mm": rainfall_mm,
        "slope_degrees": slope_degrees,
        "soil_moisture": soil_moisture,
    }
