import type { LyricWord, Window } from '../lib/lyrics';

// Original fictional lyrics written for this demo (40 words). No real song, no audio.
const LINES: Array<{ text: string; chorus: boolean }> = [
  { text: 'Lights are fading slow', chorus: false },
  { text: 'Keep walking through the glow', chorus: false },
  { text: 'Every step a little spark', chorus: false },
  { text: 'Dancing in the dark', chorus: false },
  { text: 'Hold on hold on we are gold', chorus: true },
  { text: 'Never letting go', chorus: true },
  { text: 'Hold on hold on we are gold', chorus: true },
  { text: 'Let the whole world know', chorus: true },
];

// Indexes of the words the aligner was unsure about (confidence under 0.5).
const LOW = new Map<number, number>([[3, 0.38], [11, 0.44], [24, 0.31], [33, 0.47]]);

function build(): { words: LyricWord[]; chorus: Window | null; duration: number } {
  const words: LyricWord[] = [];
  let t = 4;
  let chorusStart = -1;
  let chorusEnd = 0;
  for (const line of LINES) {
    if (line.chorus && chorusStart < 0) chorusStart = t;
    for (const raw of line.text.split(' ')) {
      const i = words.length;
      const conf = LOW.get(i) ?? Math.round((0.82 + ((i * 7) % 15) / 100) * 100) / 100;
      words.push({ word: raw, start: Math.round(t * 100) / 100, end: Math.round((t + 0.42) * 100) / 100, confidence: conf });
      t += 0.5;
    }
    if (line.chorus) chorusEnd = t;
    t += 0.9; // pause between lines
  }
  return { words, chorus: { start: chorusStart, end: chorusEnd }, duration: Math.ceil(t + 6) };
}

const song = build();
export const WORDS: LyricWord[] = song.words;
/** Chorus window; null means "not detected" (try the toggle in the demo). */
export const CHORUS: Window | null = song.chorus;
export const DURATION = song.duration;
