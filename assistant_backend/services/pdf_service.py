import base64
import io
import pdfplumber
import logging

logger = logging.getLogger(__name__)

def extract_text_from_pdf(base64_pdf: str) -> str:
    """
    Extracts text from a base64 encoded PDF file.
    """
    try:
        # Decode base64
        pdf_bytes = base64.b64decode(base64_pdf)
        
        # Load PDF with pdfplumber
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            full_text = []
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    full_text.append(text)
            
            return "\n".join(full_text)
            
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {e}")
        return f"Error extracting text from PDF: {str(e)}"
