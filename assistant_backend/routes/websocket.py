import json
import base64
import asyncio
import logging
from fastapi import WebSocket, WebSocketDisconnect
import numpy as np
from io import BytesIO

from services.vision import vision_service
from services.pdf_service import extract_text_from_pdf


# System prompt for the visual assistant
VISUAL_ASSISTANT_PROMPT = """You are Vocalis, a specialized AI assistant for visually impaired users. 
Your goal is to be their eyes and a helpful companion.
1. Be concise, clear, and warm. Avoid long lists unless asked.
2. Use descriptive language for visual elements.
3. If a user uploads a PDF or text, read it out clearly, summarizing long parts unless asked for full text.
4. Always confirm when you are listening or processing.
5. If the user seems lost, gently guide them on how to talk to you.
"""

async def send_text_and_tts(websocket: WebSocket, text: str, tts):
    """Helper to send transcription/LLM text and then stream TTS audio."""
    # Send text response
    await websocket.send_json({
        "type": "llm_response",
        "text": text
    })

    # Start TTS streaming
    await websocket.send_json({"type": "tts_start"})

    audio_data = tts.text_to_speech(text)

    # Stream in chunks
    chunk_size = 4096
    for i in range(0, len(audio_data), chunk_size):
        chunk = audio_data[i:i + chunk_size]
        await websocket.send_json({
            "type": "tts_chunk",
            "audio_chunk": base64.b64encode(chunk).decode()
        })

    await websocket.send_json({"type": "tts_end"})


async def websocket_endpoint(websocket: WebSocket, transcriber, llm, tts):
    await websocket.accept()
    print("Assistant connected")
    
    # Send initial status
    await websocket.send_json({"type": "status", "message": "Connected to Vocalis"})

    try:
        while True:
            try:
                data = await websocket.receive_text()
                message = json.loads(data)
                msg_type = message.get("type")

                if not msg_type:
                    continue

                # =====================
                # PING (Keep-alive)
                # =====================
                if msg_type == "ping":
                    continue

                # =====================
                # GREETING (Initial Call)
                # =====================
                elif msg_type == "greeting":
                    greeting_text = "Hello! I'm Vocalis, your AI assistant. I'm here to help you see and understand the world around you. What can I do for you?"
                    # Initialize LLM
                    llm.clear_history()
                    await send_text_and_tts(websocket, greeting_text, tts)

                # =====================
                # AUDIO INPUT
                # =====================
                elif msg_type == "audio":
                    audio_b64 = message.get("audio_data")
                    if not audio_b64:
                        continue
                    
                    # Notify processing
                    await websocket.send_json({"type": "status", "message": "Transcribing..."})

                    audio_bytes = base64.b64decode(audio_b64)
                    audio_array = np.frombuffer(audio_bytes, dtype=np.uint8)

                    # Transcribe
                    text, _ = transcriber.transcribe(audio_array)
                    
                    if text.strip():
                        print(f"User said: {text}")
                        # Send transcription to UI
                        await websocket.send_json({
                            "type": "transcription",
                            "text": text
                        })

                        # Get LLM response with system context
                        await websocket.send_json({"type": "status", "message": "Thinking..."})
                        llm_result = llm.get_response(text, system_prompt=VISUAL_ASSISTANT_PROMPT)
                        response = llm_result["text"]
                        
                        # Send response and TTS
                        await send_text_and_tts(websocket, response, tts)
                    else:
                        # No speech detected
                        await websocket.send_json({"type": "status", "message": "Listening..."})

                # =====================
                # VISION IMAGE
                # =====================
                elif msg_type == "vision_image":
                    image_data = message.get("image")
                    if image_data:
                        await websocket.send_json({"type": "status", "message": "Analyzing image..."})
                        description = vision_service.process_image(image_data)
                        
                        # Add vision context to LLM
                        llm.add_to_history("user", f"[System: The user shared an image. Description: {description}]")
                        
                        # Get assistant response based on the image
                        await websocket.send_json({"type": "status", "message": "Describing..."})
                        response = llm.get_response("Describe this image to me.", system_prompt=VISUAL_ASSISTANT_PROMPT)
                        await send_text_and_tts(websocket, response["text"], tts)

                elif msg_type == "pdf_upload":
                    pdf_data = message.get("pdf")
                    if pdf_data:
                        await websocket.send_json({"type": "status", "message": "Reading PDF..."})
                        extracted_text = extract_text_from_pdf(pdf_data)
                        
                        if extracted_text.startswith("Error"):
                            await websocket.send_json({"type": "error", "message": extracted_text})
                        else:
                            # Use LLM to summarize
                            llm.add_to_history("user", f"[User uploaded a PDF. Content: {extracted_text[:3000]}...]")
                            await websocket.send_json({"type": "status", "message": "Summarizing PDF..."})
                            response = llm.get_response("I have uploaded a PDF. Please read out a summary of its content in a natural way.", system_prompt=VISUAL_ASSISTANT_PROMPT)
                            await send_text_and_tts(websocket, response["text"], tts)

            except json.JSONDecodeError:
                print("Received malformed JSON")
                continue
            except Exception as e:
                print(f"Error processing message: {e}")
                import traceback
                traceback.print_exc()
                await websocket.send_json({"type": "error", "message": str(e)})
                continue

    except WebSocketDisconnect:
        print("Assistant disconnected")
    except Exception as e:
        print(f"WebSocket fatal error: {e}")
