import React, { useRef, useState, useEffect } from "react";
import { Play, Pause, Trash2, Send } from "lucide-react";

interface VoiceNotePreviewProps {
  audioBlob: Blob;
  onSend: () => void;
  onCancel: () => void;
}

export const VoiceNotePreview: React.FC<VoiceNotePreviewProps> = ({ audioBlob, onSend, onCancel }) => {
  const audioUrl = React.useMemo(() => URL.createObjectURL(audioBlob), [audioBlob]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [frequency, setFrequency] = useState<number[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  useEffect(() => {
    if (!audioRef.current) return;
    let ctx: AudioContext;
    let analyser: AnalyserNode;
    let source: MediaElementAudioSourceNode;
    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);
      analyserRef.current = analyser;
      setAudioContext(ctx);
    } catch (e) {
      // fallback: no frequency
    }
    return () => {
      if (ctx) ctx.close();
    };
  }, [audioUrl]);

  useEffect(() => {
    const updateFrequency = () => {
      if (!isPlaying || !analyserRef.current) {
        animationIdRef.current = requestAnimationFrame(updateFrequency);
        return;
      }
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      setFrequency(Array.from(dataArray));
      animationIdRef.current = requestAnimationFrame(updateFrequency);
    };
    updateFrequency();
    return () => {
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
    };
  }, [isPlaying]);

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };
  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };
  const handleEnded = () => setIsPlaying(false);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Frequency bars: 32 bars, height 0-100%
  const bars = frequency.length ? frequency.slice(0, 32) : Array(32).fill(0);

  return (
    <div className="w-full flex flex-col items-center mb-2">
      <div className="flex items-center bg-white border border-gray-200 rounded-2xl shadow-lg px-6 py-4" style={{ minWidth: 500, maxWidth: 700 }}>
        <button
          onClick={handlePlayPause}
          className="mr-4 bg-[#800517] hover:bg-[#A0061D] text-white rounded-full p-3 focus:outline-none"
        >
          {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7" />}
        </button>
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex items-end h-16 gap-0.5 w-full">
            {bars.map((bar, i) => (
              <div
                key={i}
                className="bg-[#800517] rounded"
                style={{ width: 6, height: `${10 + (bar / 255) * 54}px`, transition: 'height 0.1s' }}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        <button
          onClick={onSend}
          className="ml-4 bg-[#800517] hover:bg-[#A0061D] text-white rounded-full p-3 focus:outline-none"
        >
          <Send className="w-6 h-6" />
        </button>
        <button
          onClick={onCancel}
          className="ml-2 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full p-3 focus:outline-none"
        >
          <Trash2 className="w-6 h-6" />
        </button>
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          className="hidden"
        />
      </div>
    </div>
  );
};
