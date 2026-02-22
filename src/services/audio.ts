import websocketService, { WebSocketService } from "./websocket";

export enum AudioState {
  INACTIVE = "inactive",
  RECORDING = "recording",
  SPEAKING = "speaking",
}

export enum AudioEvent {
  RECORDING_START = "recording_start",
  RECORDING_STOP = "recording_stop",
  PLAYBACK_END = "playback_end",
}

type Listener = (data?: any) => void;

export class AudioService {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private buffer: Float32Array[] = [];
  private listeners = new Map<AudioEvent, Listener[]>();

  private async init() {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }
  }

  /* ---------- RECORDING ---------- */

  async startRecording() {
    await this.init();

    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    const source = this.audioContext!.createMediaStreamSource(this.mediaStream);
    this.processor = this.audioContext!.createScriptProcessor(4096, 1, 1);

    source.connect(this.processor);
    this.processor.connect(this.audioContext!.destination);

    this.processor.onaudioprocess = (e) => {
      const data = e.inputBuffer.getChannelData(0);
      this.buffer.push(new Float32Array(data));
    };

    this.dispatch(AudioEvent.RECORDING_START);
  }

  stopRecording() {
    if (!this.processor) return;

    this.processor.disconnect();

    const merged = this.mergeBuffers();
    websocketService.sendAudio(merged);

    this.dispatch(AudioEvent.RECORDING_STOP);
  }

  private mergeBuffers() {
    const len = this.buffer.reduce((a, b) => a + b.length, 0);
    const result = new Float32Array(len);

    let offset = 0;
    this.buffer.forEach((b) => {
      result.set(b, offset);
      offset += b.length;
    });

    this.buffer = [];
    return result;
  }

  /* ---------- TTS ---------- */

  async playAudioChunk(base64: string) {
    await this.init();

    const buf = WebSocketService.base64ToArrayBuffer(base64);
    const decoded = await this.audioContext!.decodeAudioData(buf);

    const src = this.audioContext!.createBufferSource();
    src.buffer = decoded;
    src.connect(this.audioContext!.destination);
    src.start();

    src.onended = () => this.dispatch(AudioEvent.PLAYBACK_END);
  }

  handleTtsStart() {}

  handleTtsEnd() {}

  releaseHardware() {
    this.mediaStream?.getTracks().forEach((t) => t.stop());
  }

  /* ---------- EVENTS ---------- */

  addEventListener(event: AudioEvent, cb: Listener) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event)!.push(cb);
  }

  private dispatch(event: AudioEvent, data?: any) {
    this.listeners.get(event)?.forEach((cb) => cb(data));
  }
}

export default new AudioService();