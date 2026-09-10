# SIH PS26001: AI-Based Landslide Early Warning & Decision Support System (NER)
Ministry of Development of North Eastern Region (MDoNER)

## Overview
This submission includes a complete end-to-end full-stack solution:
- **Giridrishti Historical Inventory & Early Warning Portal (`/` & `/frontends/`)**: Primary frontend carrying `frontends/style.css`, `data.js`, and `script.js`. Features field-validated landslide incidents across all 8 North Eastern states, interactive map canvas, hotspot distribution analytics, paginated incident search, and offline field reporting.
- **Tactical Command Center Dashboard (`/command-center/`)**: Live Leaflet risk heatmap, real-time sensor node pulse telemetry, interactive ML prediction simulator, district-wise risk analytics with Chart.js, citizen hazard reporting with geo-tagging, audio sirens, and printable SitRep emergency reports.
- **RESTful Machine Learning & GIS Backend (`main.py` / `simple_server.py`)**: FastAPI / Python backend providing landslide vulnerability inference, GIS risk map features, historical district analytics, weather telemetry, and authentication.

---

## Quick Start & Running the Application

### 1. Run the Application
From this directory, run:

```powershell
python main.py
```
*(Or use `python simple_server.py` as a zero-dependency fallback server).*

### 2. Access the Dashboards
Open your browser and navigate to:
- **Giridrishti Inventory Portal**: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- **Tactical Command Center**: [http://127.0.0.1:8000/command-center/](http://127.0.0.1:8000/command-center/)
- **Swagger / OpenAPI Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## Useful Endpoints

- `GET /` — Primary Giridrishti Inventory Frontend
- `GET /style.css` — Giridrishti Stylesheet (`frontends/style.css`)
- `GET /data.js` — Historical Landslide Dataset (`frontends/data.js`)
- `GET /script.js` — Giridrishti Application Logic (`frontends/script.js`)
- `GET /command-center/` — Tactical Command Center Dashboard
- `GET /health` — Service health monitor
- `POST /prediction/predict` — ML model landslide risk prediction
- `POST /prediction/batch` — Batch prediction for multi-station telemetry
- `POST /auth/register` — User/Official registration
- `POST /auth/login` — Authentication session
- `GET /analytics/district-risk` — District risk scores & vulnerability metrics
- `GET /gis/risk-map` — GeoJSON risk zones for NER states (Sikkim, Assam, Meghalaya, etc.)
- `GET /weather/` — Live/simulated meteorological feed
- `POST /reports/` — Citizen and field-surveyor incident reports

