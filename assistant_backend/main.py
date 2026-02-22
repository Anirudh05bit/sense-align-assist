import uvicorn
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

from config import get_config
from services.transcription import WhisperTranscriber
from services.llm import LLMClient
from services.tts import TTSClient
from services.vision import vision_service
from routes.websocket import websocket_endpoint

cfg = get_config()

app = FastAPI(title="Assistant Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("Initializing services...")

transcriber = WhisperTranscriber(
    model_size=cfg["whisper_model"],
    sample_rate=cfg["audio_sample_rate"]
)

llm = LLMClient(
    api_endpoint=cfg["llm_api_endpoint"],
    model=cfg["llm_model"]
)

tts = TTSClient(
    api_endpoint=cfg["tts_api_endpoint"],
    model=cfg["tts_model"],
    voice=cfg["tts_voice"],
    output_format=cfg["tts_format"]
)

vision_service.initialize()

print("Assistant ready")


@app.websocket("/ws")
async def ws(websocket: WebSocket):
    await websocket_endpoint(websocket, transcriber, llm, tts)


if __name__ == "__main__":
    uvicorn.run("main:app", host=cfg["websocket_host"], port=cfg["websocket_port"], reload=True)