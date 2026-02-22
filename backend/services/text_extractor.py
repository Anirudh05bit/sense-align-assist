import pytesseract
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
from pdf2image import convert_from_path
from PIL import Image
import cv2
import numpy as np


def preprocess_image(pil_img):
    img = np.array(pil_img)

    # If already grayscale, skip conversion
    if len(img.shape) == 2:
        gray = img
    else:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)[1]
    return Image.fromarray(thresh)


def extract_text_from_image(path):
    img = Image.open(path)
    img = preprocess_image(img)
    text = pytesseract.image_to_string(img)
    return text


def extract_text_from_pdf(path):
    POPPLER_PATH = r"C:\Users\Rohit Reddy\Downloads\Poppler\poppler-25.12.0\Library\bin"
    pages = convert_from_path(path, dpi=300, poppler_path=POPPLER_PATH)

    text = ""

    for page in pages:
        page = preprocess_image(page)
        text += pytesseract.image_to_string(page)

    return text


def extract_text_from_file(path, ftype):
    if ftype == "pdf":
        return extract_text_from_pdf(path)

    elif ftype == "image":
        return extract_text_from_image(path)

    return ""