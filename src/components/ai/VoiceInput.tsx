// src/components/ai/VoiceInput.tsx
// Web-based voice input — hold to record → release → transcribes via Whisper

import { useState, useRef } from "react";
import { useAuthStore } from "../../features/auth/authStore";

interface VoiceInputProps {
  onTranscript?: (text: string) => void;
  onTranscription?: (text: string) => void;
  disabled?: boolean;
}

export default function VoiceInput({ onTranscript, onTranscription, disabled }: VoiceInputProps) {
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [processing, setProcessing] = useState(false);
  const chunks = useRef<Blob[]>([]);
  const token  = useAuthStore(s => s.token);
  const handleTranscript = onTranscript ?? onTranscription;

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    chunks.current = [];
    mr.ondataavailable = e => { if (e.data.size > 0) chunks.current.push(e.data); };
    mr.start();
    setMediaRecorder(mr);
    setRecording(true);
  };

  const stopRecording = async () => {
    if (!mediaRecorder) return;

    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach(t => t.stop());
    setRecording(false);
    setProcessing(true);

    await new Promise(res => { mediaRecorder.onstop = res; });

    const blob     = new Blob(chunks.current, { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('audio', blob, 'voice.webm');

    const res  = await fetch('/api/v1/ai-platform/speech/transcribe', {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}` },
      body:    formData
    });
    const data = await res.json();
    if (data.text) handleTranscript?.(data.text);
    setProcessing(false);
  };

  return (
    <button
      onMouseDown={startRecording}
      onMouseUp={stopRecording}
      onTouchStart={startRecording}
      onTouchEnd={stopRecording}
      disabled={disabled || processing}
      style={{
        width: 34, height: 34, borderRadius: '50%',
        background: recording ? 'var(--red)' : 'var(--surface2)',
        border: `1px solid ${recording ? 'var(--red)' : 'var(--border)'}`,
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, transition: 'all .15s',
        animation: recording ? 'voicepulse 1s ease-in-out infinite' : 'none'
      }}
      title="Hold to record"
    >
      {processing ? '⏳' : '🎤'}
    </button>
  );
}
