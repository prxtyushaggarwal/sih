"""Dependency-free local server used only when Uvicorn is unavailable."""

from __future__ import annotations

import json
import mimetypes
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

from analytics import district_risk
from database import add_report, authenticate, create_user, init_db, list_reports
from gis_services import risk_map
from landslide_prediction import LandslidePredictionEngine
from weather_services import weather

ROOT = Path(__file__).resolve().parent
FRONTEND = ROOT / "frontend"
FRONTENDS = ROOT / "frontends"
PREDICTOR = LandslidePredictionEngine()


def _train_predictor() -> None:
    PREDICTOR.fit(
        [[12, 8, 20], [18, 15, 30], [45, 25, 65], [70, 35, 78], [90, 40, 88], [35, 12, 45]],
        [0, 0, 1, 1, 1, 0],
    )


class Handler(BaseHTTPRequestHandler):
    def log_message(self, format: str, *args: object) -> None:
        print(f"{self.address_string()} - {format % args}")

    def send_json(self, data: dict, status: HTTPStatus = HTTPStatus.OK) -> None:
        payload = json.dumps(data).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def send_file(self, path: Path) -> None:
        if not path.is_file():
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        content = path.read_bytes()
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", mimetypes.guess_type(path.name)[0] or "application/octet-stream")
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if path == "/health":
            self.send_json({"status": "ok"})
        elif path == "/weather/":
            self.send_json(weather())
        elif path == "/analytics/district-risk":
            self.send_json(district_risk())
        elif path == "/gis/risk-map":
            self.send_json(risk_map())
        elif path == "/reports/":
            self.send_json({"reports": list_reports()})
        elif path == "/docs":
            self.send_json({"message": "Start with Uvicorn to use Swagger docs; the dashboard works in fallback mode."})
        elif path in ("/frontends", "/giridrishti", "/inventory"):
            self.send_response(HTTPStatus.MOVED_PERMANENTLY)
            self.send_header("Location", "/")
            self.end_headers()
        elif path in ("/command-center", "/frontend"):
            self.send_response(HTTPStatus.MOVED_PERMANENTLY)
            self.send_header("Location", "/command-center/")
            self.end_headers()
        elif path.startswith("/frontends/"):
            subpath = path[len("/frontends/"):].lstrip("/")
            requested = "index.html" if not subpath else subpath
            safe_path = (FRONTENDS / requested).resolve()
            if FRONTENDS.resolve() not in safe_path.parents and safe_path != FRONTENDS.resolve():
                self.send_error(HTTPStatus.NOT_FOUND)
            else:
                self.send_file(safe_path)
        elif path.startswith("/command-center/") or path.startswith("/frontend/"):
            prefix = "/command-center/" if path.startswith("/command-center/") else "/frontend/"
            subpath = path[len(prefix):].lstrip("/")
            requested = "index.html" if not subpath else subpath
            safe_path = (FRONTEND / requested).resolve()
            if FRONTEND.resolve() not in safe_path.parents and safe_path != FRONTEND.resolve():
                self.send_error(HTTPStatus.NOT_FOUND)
            else:
                self.send_file(safe_path)
        else:
            requested = "index.html" if path == "/" else path.lstrip("/")
            target_base = FRONTENDS if (FRONTENDS / requested).exists() else FRONTEND
            safe_path = (target_base / requested).resolve()
            if target_base.resolve() not in safe_path.parents and safe_path != target_base.resolve():
                self.send_error(HTTPStatus.NOT_FOUND)
            else:
                self.send_file(safe_path)

    def do_POST(self) -> None:
        try:
            length = int(self.headers.get("Content-Length", 0))
            data = json.loads(self.rfile.read(length) or b"{}")
            path = urlparse(self.path).path
            if path == "/prediction/predict":
                values = [[float(data["rainfall_mm"]), float(data["slope_degrees"]), float(data["soil_moisture"])]]
                prediction = PREDICTOR.predict(values)[0]
                self.send_json({"prediction": prediction, "risk": "high" if prediction else "low"})
            elif path == "/reports/":
                for field in ("district", "description", "severity"):
                    if not str(data.get(field, "")).strip():
                        raise ValueError(f"{field} is required")
                self.send_json({"message": "Report received successfully.", "report": add_report(data)}, HTTPStatus.CREATED)
            elif path == "/auth/register":
                user = create_user(data["username"], data.get("role", "Member"), data["email"], data["password"])
                self.send_json({"message": "User registered successfully.", "user": {key: user[key] for key in ("id", "username", "role", "email")}}, HTTPStatus.CREATED)
            elif path == "/auth/login":
                user = authenticate(data["username"], data["password"])
                if user is None:
                    self.send_json({"detail": "Invalid username or password"}, HTTPStatus.UNAUTHORIZED)
                else:
                    self.send_json({"message": "Login successful.", "user": {key: user[key] for key in ("id", "username", "role", "email")}})
            else:
                self.send_error(HTTPStatus.NOT_FOUND)
        except (KeyError, TypeError, ValueError, json.JSONDecodeError) as error:
            self.send_json({"detail": str(error)}, HTTPStatus.BAD_REQUEST)


def run() -> None:
    init_db()
    _train_predictor()
    server = ThreadingHTTPServer(("127.0.0.1", 8000), Handler)
    print("Dashboard available at http://127.0.0.1:8000/")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
    finally:
        server.server_close()
