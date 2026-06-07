import { useState, useEffect } from "react";
import { Music, AlertCircle } from "lucide-react";

interface LoadingScreenProps {
  onComplete: () => void;
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState("Initializing Sound Synthesis...");

  useEffect(() => {
    const textStates = [
      "Initializing Sound Synthesis...",
      "Generating Rhythmic Audio Generators...",
      "Calibrating Gameplay Canvas Latencies...",
      "Preparing Neon Star Particle Engines...",
      "Musiqa Tiles is Ready!"
    ];

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + Math.floor(Math.random() * 8) + 4;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            onComplete();
          }, 300);
          return 100;
        }
        
        // Update texts based on progress boundaries
        const textIdx = Math.min(
          Math.floor((next / 100) * textStates.length),
          textStates.length - 1
        );
        setLoadingText(textStates[textIdx]);

        return next;
      });
    }, 80);

    return () => clearInterval(interval);
  }, [onComplete]);

  // SVG parameters for circular loading
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div 
      id="loading-screen" 
      className="flex flex-col items-center justify-center min-h-screen bg-[#0a0514] text-white select-none px-6 relative"
    >
      {/* Background ambient glows from Artistic Flair specs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[55%] h-[55%] bg-cyan-600/20 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Title */}
      <div className="text-center mb-12 relative z-10 animate-pulse">
        <h1 
          id="loading-title"
          className="text-5xl md:text-7xl font-sans font-black italic tracking-tighter bg-gradient-to-r from-cyan-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent filter drop-shadow-[0_0_25px_rgba(168,85,247,0.5)]"
        >
          MUSIQA TILES
        </h1>
        <p className="text-cyan-400 text-xs tracking-[0.4em] font-mono mt-4 uppercase font-bold">
          Rhythm Engine v2.4
        </p>
      </div>

      {/* Interactive circular progress */}
      <div className="relative flex items-center justify-center w-36 h-36 mb-8">
        <svg className="w-full h-full rotate-[-90deg]">
          {/* Background circle */}
          <circle
            cx="72"
            cy="72"
            r={radius}
            className="stroke-slate-800"
            strokeWidth="6"
            fill="transparent"
          />
          {/* Active indicator with gradients */}
          <circle
            cx="72"
            cy="72"
            r={radius}
            className="stroke-cyan-400 transition-all duration-100 ease-out"
            strokeWidth="6"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>

        {/* Inner icon and percentage readout */}
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-3xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-200">
            {progress}%
          </span>
          <Music className="w-5 h-5 text-purple-400 mt-1 animate-bounce" />
        </div>
      </div>

      {/* Loading Detail Logs */}
      <div className="text-center">
        <p className="text-slate-400 font-mono text-sm max-w-xs truncate">
          {loadingText}
        </p>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700/50 text-[10px] text-slate-400 font-mono mt-4">
          <AlertCircle className="w-3.5 h-3.5 text-cyan-400" />
          Click anywhere to enable Chrome/Safari Audio
        </span>
      </div>

      {/* Fine-print details */}
      <div className="absolute bottom-8 text-center text-[10px] text-slate-500 font-mono tracking-wider uppercase">
        VITE REACT 19 • DYNAMIC WEB AUDIO API
      </div>
    </div>
  );
}
