from celery import Celery

app = Celery("alerting", broker="memory://", backend="cache+memory://")


@app.task
def generate_alert(prediction: int, district: str = "Unknown") -> dict:
    message = "High landslide risk detected" if prediction else "No immediate landslide risk"
    return {"district": district, "prediction": prediction, "message": message}
