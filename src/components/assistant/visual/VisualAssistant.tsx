import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Phone, PhoneOff, Upload } from "lucide-react";

import websocketService, { MessageType } from "@/services/websocket";
import audioService, { AudioEvent } from "@/services/audio";

import BackgroundStars from "./BackgroundStars";
import AssistantOrb from "./AssistantOrb";

type VoiceState =
  | "idle"
  | "listening"
  | "processing"
  | "speaking"
  | "vision_processing";

const VisualAssistant: React.FC = () => {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [aiText, setAiText] = useState("");
  const [sessionStarted, setSessionStarted] = useState(false);

  const isSpeakingRef = useRef(false);

  useEffect(() => {
    websocketService.connect();

    websocketService.addEventListener(
      MessageType.TRANSCRIPTION,
      (data: any) => {
        setTranscript(data.text);
        setVoiceState("processing");
      }
    );

    websocketService.addEventListener(
      MessageType.LLM_RESPONSE,
      (data: any) => {
        setAiText(data.text);
      }
    );

    websocketService.addEventListener(MessageType.TTS_START, () => {
      audioService.handleTtsStart();
      setVoiceState("speaking");
      isSpeakingRef.current = true;
    });

    websocketService.addEventListener(
      MessageType.TTS_CHUNK,
      (data: any) => {
        audioService.playAudioChunk(data.audio_chunk);
      }
    );

    websocketService.addEventListener(MessageType.TTS_END, () => {
      audioService.handleTtsEnd();
    });

    audioService.addEventListener(AudioEvent.PLAYBACK_END, () => {
      setVoiceState("idle");
      isSpeakingRef.current = false;
    });
  }, []);

  const startSession = async () => {
    await audioService.startRecording();
    setSessionStarted(true);
    setVoiceState("listening");
  };

  const toggleMic = () => {
    if (voiceState === "listening") {
      audioService.stopRecording();
      setVoiceState("processing");
    } else {
      audioService.startRecording();
      setVoiceState("listening");
    }
  };

  const endSession = () => {
    audioService.releaseHardware();
    setSessionStarted(false);
    setVoiceState("idle");
  };

  const handleFileUpload = async (file: File) => {
    setVoiceState("vision_processing");

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      websocketService.sendVisionImage(base64);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col items-center justify-center">
      <BackgroundStars />
      <AssistantOrb state={voiceState} />

      <div className="mt-6 text-center">
        <p>{transcript}</p>
        <p className="text-green-300">{aiText}</p>
      </div>

      <div className="flex gap-4 mt-10">
        {!sessionStarted ? (
          <button onClick={startSession} className="p-5 bg-green-600 rounded-full">
            <Phone />
          </button>
        ) : (
          <>
            <button onClick={toggleMic} className="p-4 bg-indigo-600 rounded-full">
              {voiceState === "listening" ? <MicOff /> : <Mic />}
            </button>

            <label className="p-4 bg-yellow-600 rounded-full cursor-pointer">
              <Upload />
              <input
                hidden
                type="file"
                onChange={(e) => handleFileUpload(e.target.files![0])}
              />
            </label>

            <button onClick={endSession} className="p-4 bg-red-600 rounded-full">
              <PhoneOff />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VisualAssistant;