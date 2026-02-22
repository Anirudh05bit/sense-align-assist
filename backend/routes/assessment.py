from fastapi import APIRouter
from services.mock_db import ASSESSMENT_DATA
from services.report_service import generate_report, calculate_domain_scores
from services.assistant_service import decide_assistant

router = APIRouter()

@router.get("/report")
def get_report():
    return generate_report(ASSESSMENT_DATA)

@router.get("/assistant")
def generate_assistant():
    domain_scores = calculate_domain_scores(ASSESSMENT_DATA)
    assistant = decide_assistant(domain_scores)

    return {
        "assistant": assistant,
        "domain_scores": domain_scores
    }