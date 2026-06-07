/**
 * Musiqa Tiles Song and Audio Configuration
 */

export const preloadedSongs = [
  {
    id: "twinkle",
    trackName: "Twinkle Twinkle Little Star (Chimes & Beats Synth)",
    tempoBPM: 100,
    difficulty: "easy" as const,
    totalNotes: 42,
    notes: [], // Loaded dynamic synth list
    audioUrl: "synth-twinkle"
  },
  {
    id: "sami-dan",
    trackName: "Sami Dan - Tefa Yemileyen (ጠፋ የሚለየን)",
    tempoBPM: 90,
    difficulty: "medium" as const,
    totalNotes: 219,
    notes: [], // Loaded on play
    audioUrl: "/assets/musics/sami_dan_tefa_yemileyen.m4a",
    mapUrl: "/assets/musics/sami_dan_tefa_yemileyen_map.json"
  },
  {
    id: "yohana",
    trackName: "Yohana - Gelagay (ገላጋይ)",
    tempoBPM: 100,
    difficulty: "medium" as const,
    totalNotes: 483,
    notes: [], // Loaded on play
    audioUrl: "/assets/musics/yohana_gelagay.m4a",
    mapUrl: "/assets/musics/yohana_gelagay_map.json"
  },
  {
    id: "abdukiyar",
    trackName: "ዥዋዥዌ Abdukiyar",
    tempoBPM: 127,
    difficulty: "hard" as const,
    totalNotes: 552,
    notes: [], // Loaded on play
    audioUrl: "/assets/musics/zhwazhwe_abdukiyar.mp3",
    mapUrl: "/assets/musics/zhwazhwe_abdukiyar_map.json"
  }
];

export function getTwinkleNotes(): { time: number; isHold: boolean; duration: number }[] {
  const notesOfTwinkle = [
    // Twinkle, twinkle, little star
    { note: "C", beats: 1 }, { note: "C", beats: 1 }, { note: "G", beats: 1 }, { note: "G", beats: 1 },
    { note: "A", beats: 1 }, { note: "A", beats: 1 }, { note: "G", beats: 2 },
    
    // How I wonder what you are
    { note: "F", beats: 1 }, { note: "F", beats: 1 }, { note: "E", beats: 1 }, { note: "E", beats: 1 },
    { note: "D", beats: 1 }, { note: "D", beats: 1 }, { note: "C", beats: 2 },
    
    // Up above the world so high
    { note: "G", beats: 1 }, { note: "G", beats: 1 }, { note: "F", beats: 1 }, { note: "F", beats: 1 },
    { note: "E", beats: 1 }, { note: "E", beats: 1 }, { note: "D", beats: 2 },
    
    // Like a diamond in the sky
    { note: "G", beats: 1 }, { note: "G", beats: 1 }, { note: "F", beats: 1 }, { note: "F", beats: 1 },
    { note: "E", beats: 1 }, { note: "E", beats: 1 }, { note: "D", beats: 2 },
    
    // Twinkle, twinkle, little star
    { note: "C", beats: 1 }, { note: "C", beats: 1 }, { note: "G", beats: 1 }, { note: "G", beats: 1 },
    { note: "A", beats: 1 }, { note: "A", beats: 1 }, { note: "G", beats: 2 },
    
    // How I wonder what you are
    { note: "F", beats: 1 }, { note: "F", beats: 1 }, { note: "E", beats: 1 }, { note: "E", beats: 1 },
    { note: "D", beats: 1 }, { note: "D", beats: 1 }, { note: "C", beats: 2 }
  ];

  const bpm = 100;
  const beatDuration = 60 / bpm;
  let currentTime = 1.0; // Wait 1 second
  const notesList: { time: number; isHold: boolean; duration: number }[] = [];

  notesOfTwinkle.forEach((item) => {
    const isHold = item.beats > 1;
    const duration = isHold ? parseFloat((item.beats * beatDuration - 0.1).toFixed(3)) : 0;
    
    notesList.push({
      time: parseFloat(currentTime.toFixed(3)),
      isHold,
      duration
    });
    
    currentTime += item.beats * beatDuration;
  });

  return notesList;
}

/**
 * Procedural Note Generator helper
 * Used only as fallback if JSON beatmaps are unavailable
 */
export function generateFullChart(
  baseNotes: { time: number; isHold: boolean; duration: number }[],
  totalNotes: number,
  bpm: number
): { time: number; isHold: boolean; duration: number }[] {
  if (baseNotes.length >= totalNotes) {
    return [...baseNotes].sort((a, b) => a.time - b.time);
  }

  const generated = [...baseNotes];
  let lastTime = baseNotes.length > 0 ? Math.max(...baseNotes.map(n => n.time + n.duration)) : 0;
  if (lastTime < 1.0) lastTime = 1.0;

  const beatDuration = 60 / bpm;

  for (let i = generated.length; i < totalNotes; i++) {
    const patterns = [0.5, 1.0, 2.0, 0.25];
    const randPattern = patterns[Math.floor((i * 17) % patterns.length)];
    const interval = randPattern * beatDuration;
    
    const time = parseFloat((lastTime + interval).toFixed(3));
    const isHold = (i % 8 === 0);
    const duration = isHold ? parseFloat((beatDuration * (1 + (i % 2))).toFixed(3)) : 0;
    
    generated.push({ time, isHold, duration });
    lastTime = time + duration;
  }

  return generated.sort((a, b) => a.time - b.time);
}
