from fastapi import APIRouter, status

from database import add_report, list_reports
from schemas import ReportRequest

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("/", status_code=status.HTTP_201_CREATED)
def report(request: ReportRequest) -> dict:
    return {"message": "Report received successfully.", "report": add_report(request.model_dump())}


@router.get("/")
def reports() -> dict:
    return {"reports": list_reports()}
