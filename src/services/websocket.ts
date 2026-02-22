export enum MessageType {
  AUDIO = "audio",
  TRANSCRIPTION = "transcription",
  LLM_RESPONSE = "llm_response",
  TTS_CHUNK = "tts_chunk",
  TTS_START = "tts_start",
  TTS_END = "tts_end",
  VISION_FILE_UPLOAD = "vision_file_upload",
}

type Listener = (data: any) => void;

export class WebSocketService {
  private socket: WebSocket | null = null;
  private listeners: Map<string, Listener[]> = new Map();

  connect() {
    this.socket = new WebSocket("ws://localhost:8000/ws");

    this.socket.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      const handlers = this.listeners.get(msg.type) || [];
      handlers.forEach((cb) => cb(msg));
    };
  }

  addEventListener(type: string, cb: Listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type)!.push(cb);
  }

  send(type: MessageType, data: any = {}) {
    this.socket?.send(JSON.stringify({ type, ...data }));
  }

  sendAudio(buffer: Float32Array) {
    const base64 = btoa(
      String.fromCharCode(...new Uint8Array(buffer.buffer))
    );
    this.send(MessageType.AUDIO, { audio_data: base64 });
  }

  sendVisionImage(base64: string) {
    this.send(MessageType.VISION_FILE_UPLOAD, { image_data: base64 });
  }

  static base64ToArrayBuffer(base64: string) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return bytes.buffer;
  }
}

export default new WebSocketService();