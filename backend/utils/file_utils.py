import os
import shutil
import tempfile
from fastapi import UploadFile


async def save_upload_to_temp(upload_file: UploadFile) -> str:
    suffix = ""
    if upload_file.filename and "." in upload_file.filename:
        suffix = os.path.splitext(upload_file.filename)[1]

    fd, path = tempfile.mkstemp(suffix=suffix)
    os.close(fd)
    with open(path, "wb") as f:
        content = await upload_file.read()
        f.write(content)
    return path


def detect_file_type(path: str) -> str:
    # simple detection by extension first
    ext = os.path.splitext(path)[1].lower()
    if ext == ".pdf":
        return "pdf"
    if ext in (".jpg", ".jpeg", ".png", ".tiff", ".bmp"):
        return "image"

    # fallback: try to read header
    try:
        with open(path, "rb") as f:
            head = f.read(20)
            if head.startswith(b"%PDF"):
                return "pdf"
    except Exception:
        pass

    return "image"
