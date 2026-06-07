import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, X, Music, Sparkles, VolumeX, Keyboard } from "lucide-react";
import { Song, SongNote, ScoreReport } from "../types";
import { generateFullChart } from "../config/songConfig";
import { globalAudioSynth } from "../utils/audioSynth";

interface GameCanvasProps {
  song: Song;
  onGameOver: (report: ScoreReport) => void;
  onVictory: (report: ScoreReport) => void;
  onQuit: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
}

interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  scale: number;
}

export function GameCanvas({ song, onGameOver, onVictory, onQuit }: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Gameplay state
  const [isPlaying, setIsPlaying] = useState(false);
  const isPlayingRef = useRef(false);
  const [countdown, setCountdown] = useState<string | null>(null);
  const isCountdownActiveRef = useRef(false);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [currentScore, setCurrentScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [stars, setStars] = useState(0);
  const [ducks, setDucks] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const [lives, setLives] = useState(5);
  const livesRef = useRef(5);

  // Audio source tracking
  const [audioSourceType, setAudioSourceType] = useState<'synth' | 'mp3'>('mp3');

  // Statistics references (high-performance tracking)
  const perfectHitsRef = useRef(0);
  const goodHitsRef = useRef(0);
  const missesRef = useRef(0);
  const maxComboRef = useRef(0);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const ducksRef = useRef(0);

  // Active notes loop references
  const activeNotesRef = useRef<SongNote[]>([]);
  const loopIdRef = useRef<number | null>(null);

  // Lane input references (0, 1, 2, 3)
  const lanesPressedRef = useRef<boolean[]>([false, false, false, false]);
  const laneGlowRef = useRef<number[]>([0, 0, 0, 0]);
  const activePointersRef = useRef<Record<number, number>>({});

  // Particles & Floating Text lists
  const particlesRef = useRef<Particle[]>([]);
  const nextParticleIdRef = useRef(0);
  const textFeedbackRef = useRef<FloatingText[]>([]);
  const nextTextIdRef = useRef(0);

  // Constants
  const songDurationRef = useRef<number>(60);
  const fallDuration = 1.25; // Speed adjustment: time from top spawn to hit line
  const keyMap = ["d", "f", "j", "k"];

  // Initialize and load track notes
  useEffect(() => {
    // 1. Generate full chart if needed based on preloaded metadata
    const baseNotes = song.notes || [];
    const completedNotes = generateFullChart(baseNotes, song.totalNotes, song.tempoBPM);
    
    // 2. Just-In-Time Dynamic Lane assigner (strictly prevents same columns sequentially)
    let lastLane = -1;

    const tracksNotes: SongNote[] = completedNotes.map((note, index) => {
      let lane = Math.floor(Math.random() * 4);
      if (lastLane !== -1) {
        // Force lane selection to be different from previous note
        const options = [0, 1, 2, 3].filter(l => l !== lastLane);
        lane = options[Math.floor(Math.random() * options.length)];
      }
      lastLane = lane;

      return {
        ...note,
        id: `note-${index}-${note.time}-${lane}`,
        lane: lane,
        hitState: 'none'
      };
    });

    // 3. Assign interlocking visual duration
    for (let i = 0; i < tracksNotes.length; i++) {
      const currentNote = tracksNotes[i];
      if (i < tracksNotes.length - 1) {
        const nextNote = tracksNotes[i + 1];
        const gap = nextNote.time - currentNote.time;
        // Match the next start time exactly so they interlock perfectly
        currentNote.visualDuration = Math.max(0.12, gap);
      } else {
        currentNote.visualDuration = currentNote.isHold ? Math.max(0.4, currentNote.duration) : 0.4;
      }
    }

    activeNotesRef.current = tracksNotes;
    
    const lastNote = tracksNotes[tracksNotes.length - 1];
    songDurationRef.current = lastNote ? lastNote.time + (lastNote.visualDuration || lastNote.duration) + 2.0 : 60;

    // Reset statistic counters
    perfectHitsRef.current = 0;
    goodHitsRef.current = 0;
    missesRef.current = 0;
    maxComboRef.current = 0;
    scoreRef.current = 0;
    comboRef.current = 0;
    ducksRef.current = 0;

    setDucks(0);
    setCurrentScore(0);
    setCombo(0);
    setStars(0);
    setLives(5);
    livesRef.current = 5;
    isPlayingRef.current = false;
    activePointersRef.current = {};

    // Prepare audio synthesis or element
    const prepareAudio = async () => {
      await globalAudioSynth.loadAudioSource(song.audioUrl || "audio.mp3");
      setAudioSourceType(song.audioUrl === 'synth-twinkle' ? 'synth' : 'mp3');
    };
    prepareAudio();

    return () => {
      globalAudioSynth.stop();
      if (loopIdRef.current) {
        cancelAnimationFrame(loopIdRef.current);
      }
      if (countdownTimerRef.current) {
        clearTimeout(countdownTimerRef.current);
      }
    };
  }, [song]);

  // Keyboard binding effects
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlayingRef.current) return;
      const key = e.key.toLowerCase();
      const lane = keyMap.indexOf(key);
      if (lane !== -1 && !lanesPressedRef.current[lane]) {
        lanesPressedRef.current[lane] = true;
        laneGlowRef.current[lane] = 1.0;
        triggerHitTap(lane);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const lane = keyMap.indexOf(key);
      if (lane !== -1) {
        lanesPressedRef.current[lane] = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  /**
   * Action handler for a tap event in a column lane
   */
  const triggerHitTap = (lane: number) => {
    if (isCountdownActiveRef.current) return;
    const audioTime = globalAudioSynth.getElapsedTime();
    
    // Find closest unhit note in the tapped lane
    const candidatesInLane = activeNotesRef.current.filter(
      note => note.lane === lane && note.hitState === 'none'
    );
    candidatesInLane.sort((a, b) => a.time - b.time);
    const candidate = candidatesInLane[0];

    if (candidate) {
      const timeDiff = audioTime - candidate.time;
      const isEarly = timeDiff < 0;
      const absDiff = Math.abs(timeDiff);

      // Early threshold up to 0.50s (registered as low point POOR touch instead of miss)
      // Late threshold up to 0.53s (note hasn't passed off-screen bottom yet)
      const isValidTouch = isEarly ? (absDiff <= 0.50) : (absDiff <= 0.53);

      if (isValidTouch) {
        if (candidate.isHold) {
          candidate.hitState = 'holding';
          candidate.holdProgress = 0;
          registerHit(candidate, absDiff, lane);
        } else {
          candidate.hitState = 'hit';
          registerHit(candidate, absDiff, lane);
        }
      } else {
        // Tapped empty space or mashing too early
        registerMiss(null, lane, "Empty Tap");
      }
    } else {
      // Tapped completely empty column lane!
      registerMiss(null, lane, "Empty Tap");
    }
  };

  const registerHit = (note: SongNote, diff: number, lane: number) => {
    // Professional timing windows:
    // Perfect = ±50ms
    // Great = ±90ms
    // Good = ±140ms
    // Poor = >140ms and <=530ms (registered as POOR TOUCH, no life loss)
    
    let isPerfect = false;
    let isGreat = false;
    let isGood = false;
    let isPoor = false;
    let pts = 0;
    let duckAward = 0;
    let ratingText = "POOR TOUCH";
    let ratingColor = "#f59e0b"; // Neon Amber/Orange

    if (diff <= 0.050) {
      isPerfect = true;
      pts = 200;
      duckAward = 5;
      ratingText = "PERFECT!";
      ratingColor = "#22d3ee"; // Neon Cyan
    } else if (diff <= 0.090) {
      isGreat = true;
      pts = 150;
      duckAward = 3;
      ratingText = "GREAT!";
      ratingColor = "#a855f7"; // Glowing Purple
    } else if (diff <= 0.140) {
      isGood = true;
      pts = 100;
      duckAward = 1;
      ratingText = "GOOD";
      ratingColor = "#c084fc"; // Light Purple
    } else {
      isPoor = true;
      pts = 40;
      duckAward = 0;
      ratingText = "POOR TOUCH";
      ratingColor = "#f59e0b"; // Amber/Orange
    }
    
    if (isPoor) {
      comboRef.current = 0; // reset combo for poor touches but keep playing (no life deduction)
    } else {
      comboRef.current += 1;
      if (comboRef.current > maxComboRef.current) {
        maxComboRef.current = comboRef.current;
      }
    }

    const comboMultiplier = Math.min(4, 1 + Math.floor(comboRef.current / 10) * 0.5);
    scoreRef.current += Math.round(pts * comboMultiplier);
    
    ducksRef.current += duckAward;
    setDucks(ducksRef.current);

    if (isPerfect) {
      perfectHitsRef.current += 1;
    } else {
      goodHitsRef.current += 1; // Map as a regular hit index
    }

    // Spawn rating float text & particles
    triggerFloatText(ratingText, lane, ratingColor);
    spawnParticles(lane, ratingColor);
    globalAudioSynth.triggerHitSound();

    setCurrentScore(scoreRef.current);
    setCombo(comboRef.current);
    setMaxCombo(maxComboRef.current);

    // Dynamic Star level calculations
    const maxPotential = song.totalNotes * 200;
    const ratio = scoreRef.current / (maxPotential || 1);
    if (ratio >= 0.85) setStars(3);
    else if (ratio >= 0.55) setStars(2);
    else if (ratio >= 0.25) setStars(1);
    else setStars(0);
  };

  const registerMiss = (note: SongNote | null, lane: number, reason: string) => {
    if (note) {
      note.hitState = 'miss';
    }
    missesRef.current += 1;
    comboRef.current = 0;
    
    setCombo(0);
    triggerFloatText("MISS", lane, "#f43f5e");
    globalAudioSynth.triggerMissSound();

    spawnParticles(lane, "#f43f5e");
    
    livesRef.current -= 1;
    const curLives = livesRef.current;
    setLives(Math.max(0, curLives));

    if (curLives <= 0) {
      triggerFailure();
    }
  };

  /**
   * Action handler for Game Over sequence
   */
  const triggerFailure = () => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    setIsShaking(true);
    globalAudioSynth.stop();
    if (loopIdRef.current) cancelAnimationFrame(loopIdRef.current);
    
    setTimeout(() => {
      setIsShaking(false);
      onGameOver({
        score: scoreRef.current,
        maxCombo: maxComboRef.current,
        perfectHits: perfectHitsRef.current,
        goodHits: goodHitsRef.current,
        misses: missesRef.current,
        stars: stars,
        songTitle: song.trackName
      });
    }, 800);
  };

  // Canvas particle emitters
  const spawnParticles = (lane: number, color: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    const columnWidth = width / 4;
    const startX = columnWidth * lane + columnWidth / 2;
    const startY = height * 0.85; // hit row position

    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI - Math.PI; // spray upward direction
      const velocity = Math.random() * 5 + 3;
      
      particlesRef.current.push({
        id: nextParticleIdRef.current++,
        x: startX,
        y: startY,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - 1,
        color: color,
        size: Math.random() * 3 + 1.5,
        alpha: 1.0,
        life: 1.0
      });
    }
  };

  const triggerFloatText = (text: string, lane: number, color: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    const columnWidth = width / 4;
    const startX = columnWidth * lane + columnWidth / 2;
    const startY = height * 0.72;

    // Filter out previous floating ratings of same tier
    textFeedbackRef.current = textFeedbackRef.current.filter(t => t.text !== "PERFECT!" && t.text !== "GOOD");
    
    textFeedbackRef.current.push({
      id: nextTextIdRef.current++,
      text: text,
      x: startX,
      y: startY,
      color: color,
      alpha: 1.0,
      scale: 1.15
    });
  };

  const startGame = () => {
    setIsPlaying(true);
    isPlayingRef.current = true;
    
    isCountdownActiveRef.current = true;
    setCountdown("3");
    globalAudioSynth.triggerHitSound();

    if (loopIdRef.current) cancelAnimationFrame(loopIdRef.current);
    loopIdRef.current = requestAnimationFrame(gameTick);

    if (countdownTimerRef.current) {
      clearTimeout(countdownTimerRef.current);
    }

    countdownTimerRef.current = setTimeout(() => {
      setCountdown("2");
      globalAudioSynth.triggerHitSound();
      
      countdownTimerRef.current = setTimeout(() => {
        setCountdown("1");
        globalAudioSynth.triggerHitSound();
        
        countdownTimerRef.current = setTimeout(() => {
          setCountdown("GO!");
          globalAudioSynth.triggerHitSound();
          
          // Introduce a 500ms delay after the countdown ended before starting gameplay audio & scrolling
          countdownTimerRef.current = setTimeout(() => {
            isCountdownActiveRef.current = false;
            globalAudioSynth.start(song.tempoBPM, song.audioUrl);
            setCountdown(null);
          }, 500);
        }, 1000);
      }, 1000);
    }, 1000);
  };

  const togglePause = () => {
    if (isPlayingRef.current) {
      isPlayingRef.current = false;
      setIsPlaying(false);
      globalAudioSynth.stop();
      if (loopIdRef.current) cancelAnimationFrame(loopIdRef.current);
      if (countdownTimerRef.current) {
        clearTimeout(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      setCountdown(null);
      isCountdownActiveRef.current = false;
    } else {
      startGame();
    }
  };

  const handleQuitGame = () => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    globalAudioSynth.stop();
    if (loopIdRef.current) cancelAnimationFrame(loopIdRef.current);
    if (countdownTimerRef.current) {
      clearTimeout(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setCountdown(null);
    isCountdownActiveRef.current = false;
    onQuit();
  };

  // Central Game update Loop ticked on requestAnimationFrame
  const gameTick = () => {
    const canvas = canvasRef.current;
    if (!canvas || !isPlayingRef.current) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const audioTime = globalAudioSynth.getElapsedTime();

    // Check level completion victory
    if (audioTime >= songDurationRef.current) {
      isPlayingRef.current = false;
      setIsPlaying(false);
      globalAudioSynth.stop();
      onVictory({
        score: scoreRef.current,
        maxCombo: maxComboRef.current,
        perfectHits: perfectHitsRef.current,
        goodHits: goodHitsRef.current,
        misses: missesRef.current,
        stars: stars,
        songTitle: song.trackName
      });
      return;
    }

    // --- Core Spawning & Pass Failure Detection logic ---
    activeNotesRef.current.forEach(note => {
      // Miss: Note has crossed past the bottom of the screen (approx 0.53s after note.time)
      if (note.hitState === 'none' && audioTime > note.time + 0.53) {
        registerMiss(note, note.lane, "Missed");
      }

      // Check hold note click sustain
      if (note.hitState === 'holding') {
        const correspondingPressed = lanesPressedRef.current[note.lane];
        if (correspondingPressed) {
          scoreRef.current += 2;
          setCurrentScore(scoreRef.current);
          
          if (Math.random() < 0.3) {
            spawnParticles(note.lane, "#22d3ee");
          }

          const holdElapsed = audioTime - note.time;
          if (holdElapsed >= note.duration) {
            note.hitState = 'hit';
            perfectHitsRef.current += 1;
            triggerFloatText("HOLD MATCH!", note.lane, "#22d3ee");
            globalAudioSynth.triggerHitSound();
          }
        } else {
          // Released hold tile early - DOES NOT count as a miss. Just stops holding and awards partial score
          const holdElapsed = audioTime - note.time;
          note.hitState = 'hit';
          comboRef.current = 0;
          setCombo(0);
          
          const maxPotential = song.totalNotes * 200;
          
          if (holdElapsed >= note.duration * 0.70) {
            goodHitsRef.current += 1;
            triggerFloatText("GOOD RELEASE", note.lane, "#a855f7");
            scoreRef.current += 50;
          } else {
            goodHitsRef.current += 1;
            triggerFloatText("EARLY RELEASE", note.lane, "#f59e0b");
            scoreRef.current += 20;
          }
          setCurrentScore(scoreRef.current);

          const ratio = scoreRef.current / (maxPotential || 1);
          if (ratio >= 0.85) setStars(3);
          else if (ratio >= 0.55) setStars(2);
          else if (ratio >= 0.25) setStars(1);
          else setStars(0);
        }
      }
    });

    // Drawing call
    drawUniverse(ctx, canvas, audioTime);

    loopIdRef.current = requestAnimationFrame(gameTick);
  };

  const drawUniverse = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, audioTime: number) => {
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;
    ctx.clearRect(0, 0, width, height);

    const columnWidth = width / 4;
    const hitZoneY = height * 0.70; // 1/3 from the bottom screen height

    // --- 1. Draw Immersive gradient backdrop (neon deep purple bottom to aqua sky-blue top) ---
    const bgGrad = ctx.createLinearGradient(0, height, 0, 0);
    bgGrad.addColorStop(0, "#080112"); // Bottom: very deep purple/black
    bgGrad.addColorStop(0.35, "#1f004a"); // Middle-low: rich neon purple
    bgGrad.addColorStop(0.7, "#0f0124"); // Middle-high: cosmic indigo
    bgGrad.addColorStop(1, "#0369a1"); // Top: sky-blue neon horizon
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // --- 2. Vertical Lane Columns and thin crisp dividers ---
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 1.5;
    for (let c = 1; c < 4; c++) {
      ctx.beginPath();
      ctx.moveTo(c * columnWidth, 0);
      ctx.lineTo(c * columnWidth, height);
      ctx.stroke();
    }

    // Lane press highlight gradients
    for (let c = 0; c < 4; c++) {
      if (lanesPressedRef.current[c]) {
        const pressGrad = ctx.createLinearGradient(c * columnWidth, height, c * columnWidth, hitZoneY - 250);
        pressGrad.addColorStop(0, "rgba(34, 211, 238, 0.25)");
        pressGrad.addColorStop(1, "rgba(34, 211, 238, 0)");
        ctx.fillStyle = pressGrad;
        ctx.fillRect(c * columnWidth, hitZoneY - 250, columnWidth, 250 + (height - hitZoneY));
      }
    }

    // --- 3. Draw Bright Glowing Judgment Line (no circles or letter indicators) ---
    // Horizontal glow behind the line
    const glowGrad = ctx.createLinearGradient(0, hitZoneY - 16, 0, hitZoneY + 16);
    glowGrad.addColorStop(0, "rgba(34, 211, 238, 0)");
    glowGrad.addColorStop(0.5, "rgba(34, 211, 238, 0.5)");
    glowGrad.addColorStop(1, "rgba(34, 211, 238, 0)");
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, hitZoneY - 16, width, 32);

    // Bright solid boundary rule
    ctx.strokeStyle = "#22d3ee";
    ctx.lineWidth = 3.5;
    ctx.shadowColor = "#22d3ee";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(0, hitZoneY);
    ctx.lineTo(width, hitZoneY);
    ctx.stroke();
    ctx.shadowBlur = 0; // reset shadow immediately for subsequent renders

    // --- 4. DRAW CURRENT ACTIVE TILES (INTERLOCKING STANDARD & HOLD) ---
    const pxPerSecond = hitZoneY / fallDuration;

    activeNotesRef.current.forEach(note => {
      const spawnTime = note.time - fallDuration;
      
      if (audioTime < spawnTime || note.hitState === 'hit' || note.hitState === 'miss') {
        return;
      }

      // Compute visual duration for interlocking flow
      const visualDuration = note.visualDuration || 0.4;
      let noteStartTime = note.time;
      const noteEndTime = note.time + visualDuration;

      // Slice bottom dynamically if player is actively holding a sustain tile
      if (note.hitState === 'holding') {
        noteStartTime = audioTime;
      }

      // Calculate coordinates using timeline formulas
      const yBottom = hitZoneY - (noteStartTime - audioTime) * pxPerSecond;
      const yTop = hitZoneY - (noteEndTime - audioTime) * pxPerSecond;
      const computedHeight = yBottom - yTop;

      // Skip rendering if completely off screen bounds
      if (yBottom < 0 || yTop > height) {
        return;
      }

      // Lane width = 25%. Tile width = 93% of lane (Very little empty space, small margin only)
      const tileMargin = columnWidth * 0.035; // ~3.5% margin, making tile width exactly 93% of lane!
      const tileWidth = columnWidth - tileMargin * 2;
      const tileX = note.lane * columnWidth + tileMargin;

      // Adjust rendering bounds with a maximum height limit of 2.5 * tileWidth (2.5 aspect ratio) for standard tap notes
      let renderYTop = yTop;
      let renderHeight = computedHeight;

      if (!note.isHold) {
        const maxAllowedHeight = tileWidth * 2.5;
        if (computedHeight > maxAllowedHeight) {
          renderHeight = maxAllowedHeight;
          renderYTop = yBottom - renderHeight;
        }
      }

      if (!note.isHold) {
        // --- STANDARD BLACK TILE: CLASSIC HIGH-CONTRAST OBSIDIAN MAGIC TILES 3 STYLE ---
        ctx.save();
        
        // Obsidian background body
        ctx.fillStyle = "rgba(10, 10, 15, 0.98)";
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = 2;

        drawRoundRect(ctx, tileX, renderYTop, tileWidth, renderHeight, 3);
        ctx.fill();
        ctx.stroke();

        // Neon coloring accent corresponding to lanes
        const accentGrad = ctx.createLinearGradient(tileX, renderYTop, tileX + tileWidth, renderYTop);
        if (note.lane === 0) {
          accentGrad.addColorStop(0, "rgba(34, 211, 238, 0.95)"); // Neon Cyan
          accentGrad.addColorStop(1, "rgba(2, 132, 199, 0.95)");
        } else if (note.lane === 1) {
          accentGrad.addColorStop(0, "rgba(236, 72, 153, 0.95)"); // Neon Pink
          accentGrad.addColorStop(1, "rgba(147, 51, 234, 0.95)");
        } else if (note.lane === 2) {
          accentGrad.addColorStop(0, "rgba(168, 85, 247, 0.95)"); // Neon Purple
          accentGrad.addColorStop(1, "rgba(192, 38, 211, 0.95)");
        } else {
          accentGrad.addColorStop(0, "rgba(45, 212, 191, 0.95)"); // Neon Teal
          accentGrad.addColorStop(1, "rgba(13, 148, 136, 0.95)");
        }

        // Bottom hit strike line
        ctx.fillStyle = accentGrad;
        ctx.fillRect(tileX, yBottom - 6, tileWidth, 6);

        // Gloss highlight bar running down the left boundary
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tileX + 3, renderYTop + 3);
        ctx.lineTo(tileX + 3, yBottom - 3);
        ctx.stroke();

        ctx.restore();
      } else {
        // --- HOLD TILE: ELONGATED SHINING TUBULAR STRETCH ---
        ctx.save();
        
        // Translucent gradient slider trail
        const holdGrad = ctx.createLinearGradient(tileX, yTop, tileX, yBottom);
        holdGrad.addColorStop(0, "rgba(6, 182, 212, 0.98)"); // solid top
        holdGrad.addColorStop(0.5, "rgba(34, 211, 238, 0.7)");
        holdGrad.addColorStop(1, "rgba(59, 130, 246, 0.25)"); // transparent bottom

        ctx.fillStyle = holdGrad;
        ctx.strokeStyle = "#22d3ee";
        ctx.lineWidth = 2.5;

        drawRoundRect(ctx, tileX, yTop, tileWidth, computedHeight, 5);
        ctx.fill();
        ctx.stroke();

        // Central white track guidance line
        ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#22d3ee";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(tileX + tileWidth / 2, yTop);
        ctx.lineTo(tileX + tileWidth / 2, yBottom);
        ctx.stroke();

        // Target touch node anchor on bottom
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(tileX + tileWidth / 2, yBottom, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    });

    // --- 5. DRAW EMITTED PARTICLES ---
    particlesRef.current.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.04;
      p.alpha = Math.max(0, p.life);

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);

    // --- 6. DRAW FLOATING TIMING TEXT CODES ---
    textFeedbackRef.current.forEach(t => {
      t.y -= 1.6;
      t.alpha -= 0.04;
      t.scale += 0.012;

      ctx.save();
      ctx.globalAlpha = t.alpha;
      ctx.translate(t.x, t.y);
      ctx.scale(t.scale, t.scale);
      
      ctx.fillStyle = t.color;
      ctx.font = "900 24px 'Space Grotesk', sans-serif";
      ctx.textAlign = "center";
      
      ctx.shadowColor = t.color;
      ctx.shadowBlur = 8;
      
      ctx.fillText(t.text, 0, 0);
      ctx.restore();
    });
    textFeedbackRef.current = textFeedbackRef.current.filter(t => t.alpha > 0);
  };

  const drawRoundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  // Resize boundaries watcher
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;

    const handleResize = () => {
      if (!canvas || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const dpr = window.devicePixelRatio || 1;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle pointer events (multi-touch + mouse) for high performance gameplay
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas || !isPlayingRef.current) return;

    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch (err) {}

    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const columnWidth = width / 4;

    const pointerX = e.clientX - rect.left;
    const lane = Math.floor(pointerX / columnWidth);
    if (lane >= 0 && lane < 4) {
      activePointersRef.current[e.pointerId] = lane;
      lanesPressedRef.current[lane] = true;
      laneGlowRef.current[lane] = 1.0;
      triggerHitTap(lane);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (err) {}

    const lane = activePointersRef.current[e.pointerId];
    if (lane !== undefined) {
      lanesPressedRef.current[lane] = false;
      delete activePointersRef.current[e.pointerId];
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    handlePointerUp(e);
  };

  const elapsedRatio = Math.min(100, (currentScore / (song.totalNotes * 200 || 1)) * 100);

  return (
    <div 
      className={`w-screen h-screen overflow-hidden bg-[#06020c] font-sans text-white select-none relative flex flex-col ${isShaking ? "animate-[shake_0.4s_ease-in-out_infinite]" : ""}`}
      style={{ touchAction: "none" }}
    >
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translate(0px, 0px) rotate(0deg); }
          10%, 30%, 50%, 70%, 90% { transform: translate(-4px, 2px) rotate(-0.5deg); }
          20%, 40%, 60%, 80% { transform: translate(4px, -2px) rotate(0.5deg); }
        }
      `}</style>

      {/* 1. Immersive Canvas Layer */}
      <div 
        ref={containerRef}
        className="absolute inset-0 w-full h-full z-0 overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          className="block w-full h-full cursor-pointer"
        />
      </div>

      {/* 2. OVERLAID HUD INTERFACES (Z-Index 10) */}
      <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-4 md:p-6">
        
        {/* Top Floating Row */}
        <div className="flex justify-between items-start w-full">
          {/* Left-Top: Translucent Counters Group */}
          <div className="flex flex-wrap gap-2 items-center">
            {/* Ducks Container */}
            <div className="pointer-events-auto bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
              <span className="text-base select-none">🦆</span>
              <span className="text-xs font-mono font-bold text-yellow-400 tracking-wide">
                {ducks.toLocaleString()} DUCKS
              </span>
            </div>

            {/* Lives Indicator with 5 beautiful hearts */}
            <div className="pointer-events-auto bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
              <span className="text-xs text-rose-500 select-none animate-pulse">💖</span>
              <span className="text-xs font-mono font-bold text-rose-400 tracking-wide flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span 
                    key={i} 
                    className={`text-sm transition-all duration-300 ${
                      i < lives ? "text-rose-500 scale-110 filter drop-shadow-[0_0_3px_rgba(244,63,94,0.8)]" : "text-white/20 scale-90"
                    }`}
                  >
                    ♥
                  </span>
                ))}
              </span>
            </div>
          </div>

          {/* Right-Top Actions Indicator */}
          <div className="flex items-center gap-2 pointer-events-auto">
            {isPlaying && (
              <button
                id="pause-hud-control-btn"
                onClick={togglePause}
                className="p-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl hover:bg-white/10 text-slate-300 pointer-events-auto transition-all cursor-pointer"
                title="Pause Match"
              >
                <Pause className="w-4 h-4" />
              </button>
            )}
            <button
              id="exit-hud-control-btn"
              onClick={handleQuitGame}
              className="p-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl hover:bg-white/10 text-rose-300 pointer-events-auto transition-all cursor-pointer"
              title="Return to setup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center-Top Floating HUD Area */}
        <div className="absolute top-14 left-1/2 -translate-x-1/2 flex flex-col items-center w-3/4 max-w-sm">
          {/* Top Progression Bar */}
          <div className="w-full bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 flex flex-col items-center mb-1">
            {/* Star Milestones and Golden Crown */}
            <div className="w-full flex justify-between items-center px-1 mb-1.5">
              <div className="flex gap-1.5 items-center">
                {[1, 2, 3].map((starIdx) => (
                  <span 
                    key={starIdx}
                    className={`text-xs transition-all duration-300 ${
                      stars >= starIdx ? "text-yellow-400 filter drop-shadow-[0_0_5px_rgba(250,204,21,0.8)] opacity-100 scale-110" : "text-white/20"
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
              
              {/* Golden Crown */}
              <span className={`text-xs transition-all ${elapsedRatio >= 99 ? "text-yellow-400 filter drop-shadow-[0_0_4px_orange] animate-bounce" : "text-white/25"}`}>
                👑
              </span>
            </div>

            {/* Complete Horizontal Progression Line */}
            <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden relative">
              <div 
                className="h-full bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-500 shadow-[0_0_8px_#22d3ee] transition-all duration-300"
                style={{ width: `${elapsedRatio}%` }}
              />
              {/* Star ticks */}
              <div className="absolute left-[33%] top-0 bottom-0 w-[2px] bg-slate-950/40"></div>
              <div className="absolute left-[65%] top-0 bottom-0 w-[2px] bg-slate-950/40"></div>
              <div className="absolute left-[90%] top-0 bottom-0 w-[2px] bg-slate-950/40"></div>
            </div>
          </div>

          {/* Center-Top Bold Readable Score */}
          <div className="text-center mt-2 select-none">
            <h4 className="text-[10px] uppercase font-mono tracking-[0.2em] text-cyan-300/80 drop-shadow">Score</h4>
            <h1 className="text-4xl md:text-5xl font-black font-mono tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] leading-none mt-1">
              {currentScore.toLocaleString()}
            </h1>
            
            {/* Live Combo Tracker */}
            {combo > 0 && (
              <div className="mt-1.5 py-0.5 px-3 bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-transparent border border-cyan-500/20 rounded-full inline-block backdrop-blur-sm">
                <span className="text-[10px] font-bold font-mono text-cyan-400 tracking-wider">
                  {combo} COMBO
                </span>
                <span className="text-[9px] text-white/40 ml-1.5 select-none text-lowercase font-mono italic">
                  x{Math.min(4, 1 + Math.floor(combo / 10) * 0.5).toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 3. READY TO MATCH OVERLAY SCREEN (Z-Index 30) */}
      {!isPlaying && (
        <div className="absolute inset-0 bg-[#06020c]/90 backdrop-blur-md flex flex-col items-center justify-center p-6 z-30 text-center select-none pointer-events-auto">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-700/20 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-700/20 blur-[120px] rounded-full"></div>

          <div className="max-w-xs relative z-10">
            <h2 className="text-3xl font-display font-black tracking-tight text-white mb-2 uppercase italic bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              {song.trackName}
            </h2>
            <p className="text-xs font-mono text-cyan-400 mb-6 uppercase tracking-widest">
              Level Details: {song.tempoBPM} BPM • {song.totalNotes} Notes
            </p>

            <div className="bg-slate-950/50 p-4 border border-slate-900 rounded-2xl mb-8 space-y-3 font-mono text-[10px] text-slate-400 leading-normal text-left">
              <p>🎯 <span className="text-white font-bold">Standard notes:</span> Solid black blocks. Click/tap lane.</p>
              <p>⚡ <span className="text-white font-bold">Hold notes:</span> Glowing Cyan rods. Keep pressed.</p>
              <p>⚠️ <span className="text-white font-bold">Rule:</span> Tapping empty lane or letting standard note escape triggers instant fail!</p>
            </div>

            <div className="flex flex-col gap-3 min-w-[210px]">
              <button
                id="start-match-ready-screen-btn"
                onClick={startGame}
                className="py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 font-sans font-black tracking-widest text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-400/20 hover:scale-[1.01] hover:opacity-95 transition-all uppercase"
              >
                <Play className="w-3.5 h-3.5 fill-current text-slate-950 animate-bounce" />
                <span>START MATCH</span>
              </button>

              <button
                id="quit-match-ready-screen-btn"
                onClick={handleQuitGame}
                className="py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs cursor-pointer transition-all uppercase tracking-wider"
              >
                Return to setup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. COUNTDOWN OVERLAY SCENE (Z-Index 25) */}
      {countdown !== null && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-25 pointer-events-none">
          <div className="flex flex-col items-center justify-center">
            <span className="text-xs font-mono uppercase tracking-[0.3em] text-cyan-300/80 mb-2 font-bold drop-shadow text-center">
              Get Ready
            </span>
            <span 
              key={countdown} 
              className="text-8xl md:text-9xl font-black font-sans text-cyan-400 drop-shadow-[0_0_30px_rgba(34,211,238,0.9)] animate-[countdownScale_0.5s_ease-out_1] select-none text-center"
            >
              {countdown}
            </span>
          </div>
          
          <style>{`
            @keyframes countdownScale {
              0% { transform: scale(0.4); opacity: 0; }
              50% { transform: scale(1.15); opacity: 0.9; }
              100% { transform: scale(1.0); opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
