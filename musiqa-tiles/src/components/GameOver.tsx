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
      className="flex flex-col items-center justify-center min-h-screen bg-[#0a0514] text-white select-none px-6 py-8 relative overflow-hidden"
    >
      {/* Background radial lights conforming to Artistic Flair specifications */}
      <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] ${isVictory ? "bg-emerald-600/15" : "bg-rose-600/15"} blur-[120px] rounded-full pointer-events-none`} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/15 blur-[120px] rounded-full pointer-events-none" />

      {/* Primary Card */}
      <div className="w-full max-w-md bg-white/[0.03] border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-md relative overflow-hidden">
        {/* Glowing badge */}
        <div className={`absolute top-0 right-0 left-0 h-1.5 ${isVictory ? "bg-gradient-to-r from-emerald-400 to-cyan-500" : "bg-gradient-to-r from-rose-500 to-amber-500"}`} />

        {/* Header Icon / Title */}
        <div className="text-center mt-2 mb-6">
          <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center border mb-3 ${
            isVictory 
              ? "bg-emerald-550/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.35)]" 
              : "bg-rose-500/10 text-rose-400 border-rose-500/30"
          }`}>
            <Award className="w-8 h-8" />
          </div>

          <p className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase mb-1">
            {report.songTitle}
          </p>

          <h2 className="text-3xl font-black tracking-tight uppercase">
            {isVictory ? (
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent filter drop-shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                TRACK COMPLETE!
              </span>
            ) : (
              <span className="bg-gradient-to-r from-rose-500 to-amber-500 bg-clip-text text-transparent filter drop-shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                GAME OVER
              </span>
            )}
          </h2>
          <p className="text-slate-400 text-xs font-mono mt-1">
            {isVictory ? "You survived the intense tempo rhythm!" : "Uncaught Tile! Practice leads to perfection."}
          </p>
        </div>

        {/* Stars Display */}
        {renderStars()}

        {/* Score Readout Component */}
        <div className="bg-slate-950/70 border border-slate-800/50 rounded-2xl p-5 mb-6 text-center shadow-inner">
          <span className="text-xs font-mono text-slate-500 uppercase tracking-widest block mb-1">Total Score</span>
          <span className="text-5xl font-sans font-black tracking-tight text-white filter drop-shadow-[0_2px_8px_rgba(255,255,255,0.1)]">
            {report.score.toLocaleString()}
          </span>
        </div>

        {/* Mini stats breakdown */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {/* Max combo */}
          <div className="bg-slate-950/45 border border-slate-800/40 rounded-xl p-3 flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-mono uppercase block">Max Combo</span>
              <span className="text-sm font-sans font-bold text-white">{report.maxCombo}x</span>
            </div>
          </div>

          {/* Hit Ratio / Perfects */}
          <div className="bg-slate-950/45 border border-slate-800/40 rounded-xl p-3 flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-mono uppercase block">Accuracy Hits</span>
              <span className="text-sm font-sans font-bold text-white">
                {report.perfectHits + report.goodHits} / {report.perfectHits + report.goodHits + report.misses}
              </span>
            </div>
          </div>
        </div>

        {/* Details report ledger */}
        <div className="space-y-2 border-t border-slate-800/60 pt-4 mb-8 font-mono text-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span>Perfect Hits (Double Points)</span>
            <span className="font-bold text-cyan-400">{report.perfectHits}</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Good Hits (Standard Points)</span>
            <span className="font-bold text-indigo-400">{report.goodHits}</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Misses (Triggers game over)</span>
            <span className="font-bold text-rose-500">{report.misses}</span>
          </div>
        </div>

        {/* Actions Button Block */}
        <div className="flex flex-col gap-3">
          <button
            id="retry-game-button"
            onClick={onRetry}
            className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all transform hover:scale-[1.01] ${
              isVictory
                ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 hover:opacity-90 shadow-emerald-500/10"
                : "bg-gradient-to-r from-rose-500 to-amber-500 text-white hover:opacity-90 shadow-rose-500/10"
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isVictory ? "PLAY AGAIN" : "TRY AGAIN"}</span>
          </button>

          <button
            id="return-menu-button"
            onClick={onGoHome}
            className="w-full py-3.5 rounded-xl font-semibold text-sm tracking-wide bg-slate-800/60 border border-slate-700/60 text-slate-300 hover:bg-slate-800 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01]"
          >
            <Home className="w-4 h-4" />
            <span>BACK TO PLAYLIST</span>
          </button>
        </div>
      </div>
    </div>
  );
}
