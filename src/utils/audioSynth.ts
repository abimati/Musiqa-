/**
 * Dynamic Web Audio Synthesizer for Musiqa Tiles
 * 
 * Provides interactive playhead timing for soundtracks
 * and real-time audio pop feedback for hits and misses.
 */

export class AudioSynthEngine {
  private ctx: AudioContext | null = null;
  private bpm: number = 120;
  private isPlaying: boolean = false;
  private startTime: number = 0;
  private accumElapsedTime: number = 0;
  
  // Audio element mode
  private audioElement: HTMLAudioElement | null = null;
  private activeOscillators: { osc: OscillatorNode, stopTime: number }[] = [];
  private lastReturnedTime: number = 0;

  constructor() {
    // Lazy loaded context to satisfy browser gesture constraints
  }

  private initCtx() {
    if (!this.ctx) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioCtx();
      } catch (e) {
        console.warn("Web Audio API not supported or blocked in this environment:", e);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  /**
   * Set up audio source using a standard local audio file or URL.
   */
  public async loadAudioSource(url: string): Promise<boolean> {
    this.initCtx();
    this.accumElapsedTime = 0; // Reset play offset for new tracks
    this.lastReturnedTime = 0;

    // Clear previous scheduled melody oscillators
    this.clearScheduledOscillators();

    if (!url) {
      return false;
    }

    if (url === 'synth-twinkle') {
      this.audioElement = null;
      return true;
    }

    try {
      if (this.audioElement) {
        this.audioElement.pause();
        this.audioElement.src = '';
      }
      this.audioElement = new Audio(url);
      this.audioElement.crossOrigin = "anonymous";
      return true;
    } catch (err) {
      console.warn("Failed to load audio file:", err);
      return false;
    }
  }

  public start(bpm: number, url?: string) {
    this.initCtx();
    this.bpm = bpm;
    this.isPlaying = true;
    this.startTime = this.ctx ? this.ctx.currentTime : (performance.now() / 1000);

    // Dynamic procedural chimes and beats mode
    if (url === 'synth-twinkle' || (this.audioElement === null && url === undefined)) {
      this.scheduleTwinkleMelody();
      return;
    }

    if (this.audioElement) {
      this.audioElement.currentTime = this.accumElapsedTime;
      this.audioElement.play().catch(e => {
        console.warn("Audio element failed to play. Make sure user interacted first:", e);
      });
    }
  }

  private clearScheduledOscillators() {
    this.activeOscillators.forEach(item => {
      try {
        item.osc.stop();
      } catch (e) {}
    });
    this.activeOscillators = [];
  }

  private scheduleTwinkleMelody() {
    if (!this.ctx) return;
    this.initCtx();
    this.clearScheduledOscillators();

    const now = this.ctx.currentTime;
    
    const notesOfTwinkle = [
      "C", "C", "G", "G", "A", "A", "G",
      "F", "F", "E", "E", "D", "D", "C",
      "G", "G", "F", "F", "E", "E", "D",
      "G", "G", "F", "F", "E", "E", "D",
      "C", "C", "G", "G", "A", "A", "G",
      "F", "F", "E", "E", "D", "D", "C"
    ];
    
    const beatsOfTwinkle = [
      1, 1, 1, 1, 1, 1, 2,
      1, 1, 1, 1, 1, 1, 2,
      1, 1, 1, 1, 1, 1, 2,
      1, 1, 1, 1, 1, 1, 2,
      1, 1, 1, 1, 1, 1, 2,
      1, 1, 1, 1, 1, 1, 2
    ];

    const freqMap: Record<string, number> = {
      "C": 261.63,
      "D": 293.66,
      "E": 329.63,
      "F": 349.23,
      "G": 392.00,
      "A": 440.00
    };

    const beatDuration = 60 / this.bpm;
    let accumulatedTime = 1.0; // Wait 1 second before starting

    for (let i = 0; i < notesOfTwinkle.length; i++) {
      const noteName = notesOfTwinkle[i];
      const beats = beatsOfTwinkle[i];
      const freq = freqMap[noteName];
      const noteTime = now + accumulatedTime;
      const duration = beats * beatDuration;

      // 1. Warm retro-style triangle chime note
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.0, noteTime);
      gain.gain.linearRampToValueAtTime(0.25, noteTime + 0.03); // Attack
      gain.gain.setValueAtTime(0.25, noteTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + duration - 0.02); // Sustain/Release

      osc.start(noteTime);
      const stopTime = noteTime + duration;
      osc.stop(stopTime);

      this.activeOscillators.push({ osc, stopTime });

      // 2. Add retro backing Kick beat
      this.synthKickAtTime(noteTime);
      if (beats === 2) {
        this.synthKickAtTime(noteTime + beatDuration);
      }

      // 3. Add Hi-Hat rhythm particle sparks
      this.synthHiHatAtTime(noteTime + (beatDuration * 0.5));

      accumulatedTime += duration;
    }
  }

  private synthKickAtTime(time: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.12);

    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    osc.start(time);
    osc.stop(time + 0.13);

    this.activeOscillators.push({ osc, stopTime: time + 0.13 });
  }

  private synthHiHatAtTime(time: number) {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 0.04; // 40ms noise
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(12000, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.06, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);

    noiseNode.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noiseNode.start(time);
    noiseNode.stop(time + 0.04);
  }

  // --- INTERACTIVE ACTIONS SOUND EFFECTS ---

  /**
   * Sound effect when a note is successfully hit
   */
  public triggerHitSound() {
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);

      gain.gain.setValueAtTime(0.15, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.005, now + idx * 0.04 + 0.12);

      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.13);
    });
  }

  /**
   * Sound effect when a note is missed or long hold fails
   */
  public triggerMissSound() {
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.linearRampToValueAtTime(60, now + 0.25);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.25);

    osc.start(now);
    osc.stop(now + 0.26);
  }

  public getElapsedTime(): number {
    let t = 0;
    if (!this.isPlaying) {
      t = this.accumElapsedTime;
    } else if (this.audioElement && this.audioElement.src && !this.audioElement.src.includes('synth-twinkle') && !this.audioElement.paused) {
      t = this.audioElement.currentTime;
    } else {
      const currentSegment = this.ctx 
        ? (this.ctx.currentTime - this.startTime) 
         : ((performance.now() / 1000) - this.startTime);
      t = this.accumElapsedTime + currentSegment;
    }

    if (t < this.lastReturnedTime) {
      return this.lastReturnedTime;
    }
    this.lastReturnedTime = t;
    return t;
  }

  public stop() {
    if (this.isPlaying) {
      if (this.ctx) {
        this.accumElapsedTime += (this.ctx.currentTime - this.startTime);
      } else {
        this.accumElapsedTime += ((performance.now() / 1000) - this.startTime);
      }
    }
    this.isPlaying = false;
    this.clearScheduledOscillators();

    if (this.audioElement) {
      this.audioElement.pause();
    }
  }
}

export const globalAudioSynth = new AudioSynthEngine();
