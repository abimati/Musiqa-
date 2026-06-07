import { useState } from "react";
import { Play, Volume2, Music, AlertTriangle } from "lucide-react";
import { Song } from "../types";
import { preloadedSongs, getTwinkleNotes } from "../config/songConfig";

interface SongSelectionProps {
  onSelectSong: (song: Song) => void;
}

export function SongSelection({ onSelectSong }: SongSelectionProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Helper to resolve color style for difficulty badges
  const getDiffBadgeColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "medium":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "hard":
        return "bg-purple-500/10 text-purple-400 border-purple-500/30";
      case "expert":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/30";
    }
  };

  /**
   * Loads first-level chart notes
   */
  const handlePlaySong = async (song: Song) => {
    setLoading(song.id);
    setErrorMsg(null);
    try {
      if (song.id === "twinkle") {
        const twinkleNotes = getTwinkleNotes();
        const loadedSong: Song = {
          ...song,
          notes: twinkleNotes,
          totalNotes: twinkleNotes.length
        };
        onSelectSong(loadedSong);
        return;
      }

      if (song.mapUrl) {
        const response = await fetch(song.mapUrl);
        if (!response.ok) {
          throw new Error(`Failed to load song map from server: ${response.statusText}`);
        }
        const fullData = await response.json();
        
        // Populate the notes list
        const loadedSong: Song = {
          ...song,
          notes: fullData.notes || [],
          totalNotes: fullData.totalNotes || (fullData.notes ? fullData.notes.length : song.totalNotes),
          tempoBPM: fullData.tempoBPM || song.tempoBPM,
          difficulty: fullData.difficulty || song.difficulty
        };
        onSelectSong(loadedSong);
      } else {
        onSelectSong(song);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Error loading song: ${err.message || 'Check audio file pathways'}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div 
      id="song-selection-menu"
      className="flex flex-col min-h-screen bg-[#06020c] font-sans text-white select-none overflow-x-hidden relative justify-center"
    >
      {/* Background ambient lights conforming to Artistic Flair specifications */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[50%] bg-purple-700/15 blur-[140px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[50%] bg-cyan-700/15 blur-[140px] rounded-full pointer-events-none"></div>

      {/* Main Content Centered Card */}
      <div className="w-full max-w-xl mx-auto px-4 py-8 md:py-12 flex flex-col justify-start relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-10">
          <h1 
            className="text-4xl md:text-5xl font-display font-black tracking-tight bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent filter drop-shadow-[0_2px_15px_rgba(34,211,238,0.25)] uppercase italic"
          >
            Musiqa Tiles
          </h1>
          <p className="text-[10px] tracking-[0.3em] font-bold text-cyan-400/60 uppercase mt-2 font-mono">
            Rhythm Engine v2.4 • SELECT TRACK
          </p>
        </div>

        {/* Display Alert Messages */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-bounce">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold">Play Check Warning:</span> {errorMsg}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between font-mono text-xs text-slate-400 px-1 mb-1">
            <span>PRELOADED ETHIOPIAN DISCOGRAPHY</span>
            <span>{preloadedSongs.length} TRACKS</span>
          </div>

          <div className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
            {preloadedSongs.map((song, idx) => {
              const isHovered = hoveredIndex === idx;
              const isLoading = loading === song.id;

              return (
                <div
                  key={song.id}
                  className={`relative bg-slate-950/45 hover:bg-slate-900/60 border border-slate-900 rounded-2xl p-4 cursor-pointer transition-all duration-300 transform ${
                    isHovered ? "scale-[1.01] border-cyan-500/50 shadow-[0_4px_20px_rgba(34,211,238,0.1)] bg-slate-900/30" : ""
                  }`}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => handlePlaySong(song as any)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all ${
                        isHovered
                          ? "bg-gradient-to-br from-cyan-400 to-indigo-500 text-slate-950 border-cyan-300 shadow-md"
                          : "bg-slate-950 text-cyan-400 border-slate-900"
                      }`}>
                        {isHovered && !isLoading ? (
                          <Volume2 className="w-5 h-5 animate-pulse" />
                        ) : isLoading ? (
                          <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Music className="w-5 h-5" />
                        )}
                      </div>

                      <div>
                        <h3 className="font-sans font-bold text-sm tracking-tight text-white line-clamp-1">
                          {song.trackName}
                        </h3>
                        <div className="flex items-center gap-3 mt-1.5 font-mono text-[10px] text-slate-400">
                          <span>{song.tempoBPM} BPM</span>
                          <span className="text-slate-800">•</span>
                          <span>{song.totalNotes} Steps</span>
                        </div>
                      </div>
                    </div>

                    {/* Difficulty badge and launch buttons */}
                    <div className="flex flex-col items-end gap-2.5 flex-shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold font-mono tracking-wider uppercase border ${getDiffBadgeColor(song.difficulty)}`}>
                        {song.difficulty}
                      </span>

                      <button
                        disabled={isLoading}
                        className={`p-2 rounded-xl transition-all ${
                          isHovered
                            ? "bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/20 hover:scale-105"
                            : "bg-cyan-950/20 border border-cyan-900/40 text-cyan-400 hover:bg-cyan-950/40"
                        } flex items-center gap-1 cursor-pointer`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlaySong(song as any);
                        }}
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span className="text-[9px] font-sans font-black uppercase py-0.5 px-0.5">PLAY</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Desktop mapping instruction footnote */}
        <div className="mt-8 bg-black/45 border border-slate-900 rounded-xl p-3.5 text-center">
          <p className="text-[10px] text-slate-500 leading-normal font-mono uppercase tracking-wide">
            Desktop Support: Keyboard keys <span className="text-cyan-400 font-bold">D</span> • <span className="text-cyan-400 font-bold">F</span> • <span className="text-cyan-400 font-bold font-mono">J</span> • <span className="text-cyan-400 font-bold font-mono">K</span>
            <br />
            Mobile support: Tap horizontal lane columns inside portrait viewport
          </p>
        </div>

      </div>
    </div>
  );
}
