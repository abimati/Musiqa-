/**
 * Types for Musiqa Tiles Rhythm Game
 */

export interface RawNote {
  time: number;
  isHold: boolean;
  duration: number;
}

export interface SongNote extends RawNote {
  id: string; // unique note id
  lane: number; // 0, 1, 2, 3
  isSpawned?: boolean;
  hitState?: 'none' | 'hit' | 'miss' | 'holding';
  holdProgress?: number; // duration completed
  visualDuration?: number; // interlocking chain visual duration
}

export interface Song {
  id: string;
  trackName: string;
  tempoBPM: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  totalNotes: number;
  notes: RawNote[];
  audioUrl?: string;
  mapUrl?: string;
}

export type ScreenState = 'loading' | 'menu' | 'playing' | 'gameover' | 'victory';

export interface ScoreReport {
  score: number;
  maxCombo: number;
  perfectHits: number;
  goodHits: number;
  misses: number;
  stars: number; // 0 to 3 index / meter
  songTitle: string;
}
