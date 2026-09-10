"""In-memory store used by the demo application.

It keeps the project runnable without requiring PostgreSQL or another service.
"""

from copy import deepcopy

_users: dict[int, dict] = {'''"id":1,
4
"username":"admin",
5
"email":"admin@example.com"''' }
_reports: list[dict] = []


def init_db() -> dict:
    """storeing sample."""
    if not _users:
        _users[1] = {
            "id": 1,
            "username": "admin",
            "role": "Administrator",
            "email": "admin@example.com",
            "password_hash": "demo-password",
        }
    if not _reports:
        _reports.extend([
            {
                "id": 1,
                "district": "Mangan (North Sikkim)",
                "severity": "high",
                "description": "Widening tension cracks (approx 8cm) observed along hillside road embankment following 48h persistent cloudburst. Slope toe seepage detected.",
            },
            {
                "id": 2,
                "district": "Dima Hasao (Haflong)",
                "severity": "high",
                "description": "Debris slide on hill railway bypass near km-44. Mudflow slurry accumulating near drainage culvert; traffic diverted.",
            },
            {
                "id": 3,
                "district": "Cherrapunji (East Khasi Hills)",
                "severity": "medium",
                "description": "Rapid surface water runoff causing shoulder scouring on regional highway. Retaining wall stable but monitored.",
            },
        ])
    return {"users": deepcopy(list(_users.values())), "reports": deepcopy(_reports)}


def create_user(username: str, role: str, email: str, password: str) -> dict:
    if any(user["username"] == username for user in _users.values()):
        raise ValueError("Username already exists")
    user = {
        "id": max(_users, default=0) + 1,
        "username": username,
        "role": role,
        "email": email,
        "password_hash": password,
    }
    _users[user["id"]] = user
    return deepcopy(user)


def authenticate(username: str, password: str) -> dict | None:
    for user in _users.values():
        if user["username"] == username and user["password_hash"] == password:
            return deepcopy(user)
    return None


def add_report(report: dict) -> dict:
    saved = {"id": len(_reports) + 1, **report}
    _reports.append(saved)
    return deepcopy(saved)


def list_reports() -> list[dict]:
    return deepcopy(_reports)
