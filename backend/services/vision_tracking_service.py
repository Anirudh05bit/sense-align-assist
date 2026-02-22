import cv2
import mediapipe as mp
import numpy as np
import base64
import math
import os
import urllib.request
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

class VisionTrackingService:
    def __init__(self):
        self.model_path = os.path.join(os.path.dirname(__file__), "face_landmarker.task")
        self._ensure_model_exists()

        base_options = python.BaseOptions(model_asset_path=self.model_path)
        options = vision.FaceLandmarkerOptions(
            base_options=base_options,
            num_faces=1,
            running_mode=vision.RunningMode.IMAGE
        )
        self.landmarker = vision.FaceLandmarker.create_from_options(options)

    def _ensure_model_exists(self):
        if not os.path.exists(self.model_path):
            url = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"
            urllib.request.urlretrieve(url, self.model_path)

    def process_frame(self, base64_image: str):
        try:
            encoded_data = base64_image.split(',')[1]
            nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if frame is None:
                return None

            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)

            result = self.landmarker.detect(mp_image)

            status = "No face detected"
            distance = 0

            if result.face_landmarks:
                landmarks = result.face_landmarks[0]
                h, w, _ = frame.shape

                p1 = landmarks[234]
                p2 = landmarks[454]
                face_width = math.dist((p1.x, p1.y), (p2.x, p2.y)) * w
                distance = (w * 15) / (face_width + 1e-6)

                nose = landmarks[1]

                if not (0.4 < nose.x < 0.6):
                    status = "Align your face"
                elif distance < 45:
                    status = "Move back"
                elif distance > 65:
                    status = "Move closer"
                else:
                    status = "Calibration complete"

                # Draw mesh
                for lm in landmarks:
                    cv2.circle(frame, (int(lm.x*w), int(lm.y*h)), 1, (0,255,0), -1)

            _, buffer = cv2.imencode(".jpg", frame)
            img = base64.b64encode(buffer).decode()

            return {
                "processed_frame": f"data:image/jpeg;base64,{img}",
                "distance": round(distance,1),
                "calibration_status": status
            }
        except Exception as e:
            print("Error:", e)
            return None

vision_service = VisionTrackingService()