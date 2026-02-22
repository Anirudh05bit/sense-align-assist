from fastapi import WebSocket, WebSocketDisconnect
import json
import base64

from assistant.tts import generate_tts_audio
from assistant.vision import process_vision_input

# TODO: replace with real STT + LLM
# For now simple placeholders

async def transcribe_audio(audio_bytes: bytes) -> str:
    return "I heard your voice clearly."

async def get_llm_response(text: str) -> str:
    return f"You said: {text}. How can I help further?"


async def send_tts(websocket: WebSocket, text: str):
    """
    Convert text → TTS → stream to frontend
    """

    await websocket.send_json({"type": "tts_start"})

    audio_chunks = generate_tts_audio(text)

    for chunk in audio_chunks:
        await websocket.send_json({
            "type": "tts_chunk",
            "audio_chunk": base64.b64encode(chunk).decode()
        })

    await websocket.send_json({"type": "tts_end"})


async def handle_assistant_connection(websocket: WebSocket):
    await websocket.accept()

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")

            # ================================
            # 🎤 VOICE AUDIO
            # ================================
            if msg_type == "audio":
                audio_b64 = data["audio_data"]
                audio_bytes = base64.b64decode(audio_b64)

                text = await transcribe_audio(audio_bytes)

                await websocket.send_json({
                    "type": "transcription",
                    "text": text
                })

                reply = await get_llm_response(text)

                await websocket.send_json({
                    "type": "llm_response",
                    "text": reply
                })

                await send_tts(websocket, reply)

            # ================================
            # 📄 VISION INPUT (PDF / IMAGE)
            # ================================
            elif msg_type == "vision_file_upload":
                image_b64 = data["image_data"]

                extracted_text = await process_vision_input(image_b64)

                await websocket.send_json({
                    "type": "llm_response",
                    "text": extracted_text
                })

                await send_tts(websocket, extracted_text)

    except WebSocketDisconnect:
        print("Assistant disconnected")