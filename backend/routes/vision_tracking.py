from fastapi import APIRouter
from pydantic import BaseModel
from services.vision_tracking_service import vision_service

router = APIRouter()

class FrameRequest(BaseModel):
    frame: str

@router.post("/process-frame")
async def process_frame(req: FrameRequest):
    return vision_service.process_frame(req.frame)