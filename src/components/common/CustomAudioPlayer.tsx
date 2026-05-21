"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause } from "lucide-react";

interface CustomAudioPlayerProps {
  audioUrl: string;
  onClick?: () => void;
  thumbnailUrl?: string;
}

export function CustomAudioPlayer({
  audioUrl,
  onClick,
  thumbnailUrl,
}: CustomAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [frequency, setFrequency] = useState<number[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationIdRef = useRef<number | null>(null);

  // Initialize Web Audio API for frequency visualization
  useEffect(() => {
    const initAudioContext = async () => {
      if (!audioRef.current) return;

      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;

        const source = audioContext.createMediaElementSource(audioRef.current);
        source.connect(analyser);
        analyser.connect(audioContext.destination);

        analyserRef.current = analyser;
      } catch (error) {
        console.log("Web Audio API not available, using basic player");
      }
    };

    initAudioContext();
  }, []);

  // Visualize frequency bars
  useEffect(() => {
    const updateFrequency = () => {
      if (!isPlaying || !analyserRef.current) {
        animationIdRef.current = requestAnimationFrame(updateFrequency);
        return;
      }

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);

      // Sample every 4th value and normalize to 0-1
      const sampledData = Array.from(dataArray)
        .filter((_, i) => i % 4 === 0)
        .map((value) => value / 255);

      setFrequency(sampledData);
      animationIdRef.current = requestAnimationFrame(updateFrequency);
    };

    updateFrequency();

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [isPlaying]);

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();

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
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className="w-full relative overflow-hidden rounded-xl sm:border border-gray-100 dark:border-gray-800 cursor-pointer group"
      style={{
        background: thumbnailUrl ? `url(${thumbnailUrl})` : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        aspectRatio: "16 / 9",
      }}
      onClick={onClick}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-all duration-200" />

      {/* Audio Element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      {/* Frequency Bars - Center */}
      <div className="absolute inset-0 flex items-center justify-center gap-0.5 px-4">
        {frequency.length > 0 ? (
          frequency.map((bar, i) => (
            <div
              key={i}
              className="flex-1 rounded-full bg-white/80 transition-all duration-100"
              style={{
                height: `${Math.max(4, bar * 100)}%`,
              }}
            />
          ))
        ) : (
          // Default static bars when not playing
          Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 rounded-full bg-white/60"
              style={{
                height: `${20 + Math.random() * 30}%`,
              }}
            />
          ))
        )}
      </div>

      {/* Play/Pause Button - Center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <button
          onClick={handlePlayPause}
          className="relative z-10 bg-white/90 hover:bg-white transition-all duration-200 rounded-full p-3 shadow-lg group-hover:scale-110 active:scale-95"
        >
          {isPlaying ? (
            <Pause className="w-8 h-8 text-gray-900 fill-gray-900" />
          ) : (
            <Play className="w-8 h-8 text-gray-900 fill-gray-900" />
          )}
        </button>
      </div>

      {/* Progress Bar - Bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
        <div
          className="h-full bg-white transition-all duration-100"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Time Display - Bottom Right */}
      <div className="absolute bottom-2 right-2 text-xs text-white font-semibold drop-shadow">
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
