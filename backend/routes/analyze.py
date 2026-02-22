from fastapi import APIRouter, UploadFile, File, HTTPException, status
from services.text_extractor import extract_text_from_file
from services.classifier import classify_report_text
from utils.file_utils import save_upload_to_temp, detect_file_type
import os

router = APIRouter()


@router.post("/analyze-report")
async def analyze_report(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No file uploaded")
    if file.size > 10 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File too large")
    temp_path = None
    try:
        temp_path = await save_upload_to_temp(file)
        ftype = detect_file_type(temp_path)
        if ftype not in ("pdf", "image"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported file type")

        text = extract_text_from_file(temp_path, ftype)
        text = extract_text_from_file(temp_path, ftype)

        print("===== EXTRACTED TEXT START =====")
        print(text[:2000])
        print("===== EXTRACTED TEXT END =====")
        analysis = classify_report_text(text)

        assistant_to_load = analysis.get("assistant_to_load", "")

        return {"status": "success", "analysis": analysis, "assistant_to_load": assistant_to_load}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass
