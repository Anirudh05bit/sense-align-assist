import React, { useEffect, useState, useRef } from "react";
import { Phone, Mic, MicOff, FileText, Upload, Square } from "lucide-react";

import websocketService from "@/services/websocket";
import audioService, { AudioEvent } from "@/services/audio";
import BackgroundStars from "./BackgroundStars";
import AssistantOrb from "./AssistantOrb";

type VoiceState =
  | "idle"
  | "connecting"
  | "listening"
  | "processing"
  | "speaking"
  | "error";

const VisualAssistant: React.FC = () => {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [aiText, setAiText] = useState("");
  const [sessionStarted, setSessionStarted] = useState(false);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ---------------- CONNECT WS ---------------- */
  useEffect(() => {
    websocketService.connect();

    websocketService.addEventListener("transcription", (data: any) => {
      setTranscript(data.text);
      setVoiceState("processing");
    });

    websocketService.addEventListener("llm_response", (data: any) => {
      setAiText(data.text);
    });

    websocketService.addEventListener("tts_start", () => {
      audioService.handleTtsStart();
      setVoiceState("speaking");
    });

    websocketService.addEventListener("tts_chunk", (data: any) => {
      audioService.playAudioChunk(data.audio_chunk);
    });

    websocketService.addEventListener("tts_end", () => {
      audioService.handleTtsEnd();
    });

    audioService.addEventListener(AudioEvent.PLAYBACK_END, () => {
      setVoiceState("listening");
    });

    websocketService.addEventListener("status", (data: any) => {
      setAiText(data.message);
      if (data.message.includes("Listening")) {
        setVoiceState("listening");
      }
    });

    websocketService.addEventListener("error", (data: any) => {
      setAiText(data.message);
      setVoiceState("error");
      audioService.playAudioCue(220, 0.3, "sawtooth"); // Error cue
    });

    return () => websocketService.disconnect();
  }, []);

  /* ---------------- CUES ON STATE CHANGE ---------------- */
  useEffect(() => {
    if (voiceState === "listening") {
      audioService.playAudioCue(880, 0.05); // High beep
    } else if (voiceState === "processing") {
      audioService.playAudioCue(440, 0.05); // Mid beep
    }
  }, [voiceState]);

  /* ---------------- START SESSION ---------------- */
  const startSession = async () => {
    setSessionStarted(true);
    setVoiceState("connecting");

    try {
      const ready = await websocketService.waitForOpen(3000);
      if (!ready) {
        websocketService.connect();
        const ready2 = await websocketService.waitForOpen(5000);
        if (!ready2) {
          throw new Error('Could not connect to assistant service');
        }
      }

      websocketService.sendGreeting();
      await audioService.startRecording();
      if (audioService.isMicrophoneMuted()) {
        audioService.toggleMicrophoneMute();
      }
      setVoiceState('listening');
      audioService.playAudioCue(880, 0.1);
    } catch (err: any) {
      console.error('startSession failed', err);
      setAiText(err.message || 'Connection failed. Please try again.');
      setVoiceState('error');
      setTimeout(() => {
        setSessionStarted(false);
        setVoiceState('idle');
      }, 3000);
    }
  };

  /* ---------------- TOGGLE MIC ---------------- */
  const toggleMic = async () => {
    const isMuted = audioService.toggleMicrophoneMute();
    if (isMuted) {
      audioService.playAudioCue(440, 0.1, "sine"); // Mute cue
      setAiText("Microphone Muted");
    } else {
      audioService.playAudioCue(880, 0.1, "sine"); // Unmute cue
      setAiText("Microphone Active");
    }
  };

  /* ---------------- STOP SPEAKING ---------------- */
  const stopSpeaking = () => {
    audioService.stopPlayback();
    setVoiceState("listening");
    setAiText("Assistant stopped speaking.");
    audioService.playAudioCue(440, 0.1, "sine");
  };

  /* ---------------- END SESSION ---------------- */
  const endSession = () => {
    audioService.stopRecording();
    setSessionStarted(false);
    setVoiceState("idle");
    setTranscript("");
    setAiText("");
  };

  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setAiText("Please upload a valid PDF file.");
      return;
    }
    setIsUploadingPdf(true);
    setAiText("Processing PDF...");
    try {
      if (!sessionStarted) await startSession();
      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = (reader.result as string).split(',')[1];
        websocketService.sendPdf(base64Data);
        setIsUploadingPdf(false);
      };
      reader.onerror = () => {
        setAiText("Error reading PDF file.");
        setIsUploadingPdf(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("PDF upload failed", err);
      setAiText("Failed to upload PDF.");
      setIsUploadingPdf(false);
    }
  };

  const triggerPdfUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col items-center justify-center">
      <BackgroundStars />
      <AssistantOrb state={voiceState === 'error' ? 'idle' : voiceState} />

      <div className="mt-8 text-center max-w-lg px-6 z-50">
        {voiceState === "connecting" && (
          <p className="text-blue-400 animate-pulse font-medium text-lg">Connecting to Vocalis AI...</p>
        )}
        {voiceState === "error" && (
          <p className="text-red-400 font-medium text-lg">Connection Error</p>
        )}
        <p className="text-sm text-gray-400 min-h-[1.25rem] italic mb-2">{transcript}</p>
        <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 backdrop-blur-sm min-h-[80px] flex items-center justify-center">
          <p className="text-green-300 font-medium max-h-[120px] overflow-y-auto">{aiText || "Vocalis is ready to assist you."}</p>
        </div>
      </div>

      <div className="flex gap-10 mt-12 relative z-50">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handlePdfUpload}
          accept="application/pdf"
          className="hidden"
        />

        {!sessionStarted ? (
          <div className="flex flex-col items-center gap-6">
            <div className="flex gap-12">
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={startSession}
                  disabled={voiceState === "connecting"}
                  className={`p-10 bg-green-600 rounded-full hover:bg-green-500 transition-all transform hover:scale-110 active:scale-95 shadow-[0_0_30px_rgba(22,163,74,0.3)] ${voiceState === "connecting" ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  aria-label="Start Call"
                >
                  <Phone size={40} />
                </button>
                <span className="text-xs font-bold uppercase tracking-widest text-green-500">Start Call</span>
              </div>

              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={triggerPdfUpload}
                  disabled={isUploadingPdf}
                  className={`p-10 bg-amber-600 rounded-full hover:bg-amber-500 transition-all transform hover:scale-110 active:scale-95 shadow-[0_0_30px_rgba(217,119,6,0.3)] ${isUploadingPdf ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  aria-label="Read PDF"
                >
                  <FileText size={40} />
                </button>
                <span className="text-xs font-bold uppercase tracking-widest text-amber-500">Read PDF</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-8">
            <div className="flex flex-wrap justify-center gap-8 items-end">
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={toggleMic}
                  className={`p-6 bg-indigo-600 rounded-full hover:bg-indigo-500 transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-indigo-900/20 ${voiceState === "listening" ? "ring-4 ring-indigo-400/30" : ""
                    } ${audioService.isMicrophoneMuted() ? "bg-zinc-700 opacity-60" : ""}`}
                >
                  {audioService.isMicrophoneMuted() ? <MicOff size={28} /> : <Mic size={28} />}
                </button>
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
                  {audioService.isMicrophoneMuted() ? "Unmute" : "Mute"}
                </span>
              </div>

              {(voiceState === "speaking" || aiText.includes("Reading") || aiText.includes("Thinking")) && (
                <div className="flex flex-col items-center gap-3">
                  <button
                    onClick={stopSpeaking}
                    className="p-8 bg-amber-600 rounded-full hover:bg-amber-500 transition-all transform hover:scale-110 active:scale-95 shadow-lg shadow-amber-900/30 animate-pulse"
                  >
                    <Square size={32} fill="currentColor" />
                  </button>
                  <span className="text-xs font-bold uppercase tracking-widest text-amber-500">Stop</span>
                </div>
              )}

              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={triggerPdfUpload}
                  disabled={isUploadingPdf}
                  className="p-6 bg-zinc-700 rounded-full hover:bg-zinc-600 transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-zinc-900/20"
                >
                  <Upload size={24} />
                </button>
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">PDF</span>
              </div>

              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={endSession}
                  className="p-6 bg-red-600 rounded-full hover:bg-red-500 transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-red-900/20"
                >
                  <Phone size={28} className="rotate-[135deg]" />
                </button>
                <span className="text-xs font-bold uppercase tracking-widest text-red-500">End</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualAssistant;