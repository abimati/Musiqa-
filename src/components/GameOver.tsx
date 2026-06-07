import { RotateCcw, Home, Award, Star, Flame, Target, MessageSquare } from "lucide-react";
import { ScoreReport } from "../types";

interface GameOverProps {
  report: ScoreReport;
  isVictory: boolean;
  onRetry: () => void;
  onGoHome: () => void;
}

export function GameOver({ report, isVictory, onRetry, onGoHome }: GameOverProps) {
  // Generate visual stars array
  const renderStars = () => {
    const starColorClass = (idx: number) => {
      if (idx < report.stars) {
        return "text-amber-400 fill-amber-400 filter drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]";
      }
      return "text-slate-800 fill-transparent";
    };

    return (
      <div className="flex items-center justify-center gap-2.5 mb-6">
        {[0, 1, 2].map((idx) => (
          <Star key={idx} className={`w-10 h-10 transition-all transform hover:scale-110 duration-200 ${starColorClass(idx)}`} />
        ))}
      </div>
    );
  };

  return (
    <div 
      id="game-over-screen"
      className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 backdrop-blur-md text-white select-none px-6 py-8 z-40 overflow-hidden animate-[fadeIn_0.3s_ease-out_1]"
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes popIn {
          from { transform: scale(0.92); opacity: 0; }
          to { transform: scale(1.0); opacity: 1; }
        }
      `}</style>
      
      {/* Background radial lights conforming to Artistic Flair specifications */}
      <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] ${isVictory ? "bg-emerald-600/15" : "bg-rose-600/15"} blur-[120px] rounded-full pointer-events-none`} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/15 blur-[120px] rounded-full pointer-events-none" />

      {/* Primary Card */}
      <div className="w-full max-w-md bg-slate-900/60 border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden animate-[popIn_0.35s_cubic-bezier(0.16,1,0.3,1)_1]">
        {/* Glowing badge */}
        <div className={`absolute top-0 right-0 left-0 h-1.5 ${isVictory ? "bg-gradient-to-r from-emerald-400 to-cyan-500" : "bg-gradient-to-r from-rose-500 to-amber-500"}`} />

        {/* Header Icon / Title */}
        <div className="text-center mt-2 mb-4">
          <div className={`w-12 h-12 mx-auto rounded-2xl flex items-center justify-center border mb-2.5 ${
            isVictory 
              ? "bg-emerald-550/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.25)]" 
              : "bg-rose-500/10 text-rose-400 border-rose-500/30"
          }`}>
            <Award className="w-6 h-6" />
          </div>

          <p className="text-[9px] font-mono tracking-widest text-cyan-400 uppercase mb-0.5">
            {report.songTitle}
          </p>

          <h2 className="text-2xl font-black tracking-tight uppercase">
            {isVictory ? (
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                TRACK COMPLETE!
              </span>
            ) : (
              <span className="bg-gradient-to-r from-rose-500 to-amber-500 bg-clip-text text-transparent">
                GAME OVER
              </span>
            )}
          </h2>
          <p className="text-slate-400 text-[11px] font-mono mt-0.5">
            {isVictory ? "Survived the intense tempo rhythm!" : "Uncaught Tile! Try again to conquer it."}
          </p>
        </div>

        {/* Stars Display */}
        {renderStars()}

        {/* Score Readout Component */}
        <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-4 mb-4 text-center">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-0.5">Total Score</span>
          <span className="text-4xl font-sans font-black tracking-tight text-white">
            {report.score.toLocaleString()}
          </span>
          
          <div className="mt-2 text-[11px] font-mono text-slate-400 border-t border-slate-900/80 pt-1.5 flex justify-center gap-4">
            <span>COMBO: <strong className="text-white">{report.maxCombo}x</strong></span>
            <span>ACCURACY: <strong className="text-white">{report.perfectHits + report.goodHits}/{report.perfectHits + report.goodHits + report.misses}</strong></span>
          </div>
        </div>

        {/* Actions Button Block */}
        <div className="flex flex-col gap-2">
          <button
            id="retry-game-button"
            onClick={onRetry}
            className={`w-full py-3 rounded-xl font-bold text-xs tracking-wide flex items-center justify-center gap-1.5 cursor-pointer shadow-lg transition-all transform hover:scale-[1.01] ${
              isVictory
                ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 hover:opacity-90 shadow-emerald-500/10"
                : "bg-gradient-to-r from-rose-500 to-amber-500 text-white hover:opacity-90 shadow-rose-500/10"
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isVictory ? "PLAY AGAIN" : "TRY AGAIN"}</span>
          </button>

          <button
            id="return-menu-button"
            onClick={onGoHome}
            className="w-full py-3 rounded-xl font-semibold text-xs tracking-wide bg-slate-800/40 border border-slate-700/40 text-slate-300 hover:bg-slate-800/60 flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:scale-[1.01]"
          >
            <Home className="w-3.5 h-3.5" />
            <span>BACK TO PLAYLIST</span>
          </button>
        </div>
      </div>
    </div>
  );
}
