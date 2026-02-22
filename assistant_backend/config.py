import os

# =====================
# SYSTEM CONFIG
# =====================

WEBSOCKET_HOST = "0.0.0.0"
WEBSOCKET_PORT = 8001

# =====================
# AUDIO CONFIG
# =====================

AUDIO_SAMPLE_RATE = 44100

# =====================
# WHISPER CONFIG
# =====================

WHISPER_MODEL = "base"

# =====================
# LLM CONFIG
# =====================

LLM_API_ENDPOINT = "http://127.0.0.1:11434/v1/chat/completions"
LLM_MODEL = "llama3:latest"

# =====================
# TTS CONFIG
# =====================

TTS_API_ENDPOINT = "http://localhost:5005/v1/audio/speech"
TTS_MODEL = "tts-1"
TTS_VOICE = "nova"
TTS_FORMAT = "wav"

def get_config():
    return {
        "whisper_model": WHISPER_MODEL,
        "audio_sample_rate": AUDIO_SAMPLE_RATE,
        "llm_api_endpoint": LLM_API_ENDPOINT,
        "llm_model": LLM_MODEL,
        "tts_api_endpoint": TTS_API_ENDPOINT,
        "tts_model": TTS_MODEL,
        "tts_voice": TTS_VOICE,
        "tts_format": TTS_FORMAT,
        "websocket_host": WEBSOCKET_HOST,
        "websocket_port": WEBSOCKET_PORT
    }