export interface LyricWord { word: string; start: number; end: number; confidence: number }
export interface Window { start: number; end: number }
export interface ChorusResult extends Window { fallback: boolean }

export const LOW_CONFIDENCE = 0.5;

/** Share of words aligned with usable confidence (>= 0.5), between 0 and 1. */
export function alignmentRate(words: LyricWord[]): number {
  if (words.length === 0) return 0;
  return words.filter((w) => w.confidence >= LOW_CONFIDENCE).length / words.length;
}

/** Index of the word sung at second `t`, or -1 in the gaps. */
export function activeWordIndex(words: LyricWord[], t: number): number {
  return words.findIndex((w) => t >= w.start && t < w.end);
}

const MIN_CHORUS = 8;
const MAX_CHORUS = 45;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/**
 * The chorus window, clamped to 8-45 s. With no detected chorus (null),
 * fall back to a window that starts at 35% of the song, so a Short is never blocked.
 */
export function chorusOrFallback(duration: number, chorus: Window | null): ChorusResult {
  if (chorus) {
    const len = clamp(chorus.end - chorus.start, MIN_CHORUS, MAX_CHORUS);
    return { start: chorus.start, end: chorus.start + len, fallback: false };
  }
  const start = duration * 0.35;
  const len = clamp(duration * 0.2, MIN_CHORUS, MAX_CHORUS);
  return { start, end: Math.min(duration, start + len), fallback: true };
}
