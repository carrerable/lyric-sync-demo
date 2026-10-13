import { render, screen } from '@testing-library/react';
import { CHORUS, DURATION, WORDS } from '../data/song';
import { activeWordIndex, alignmentRate, chorusOrFallback } from '../lib/lyrics';
import { Demo } from '../Demo';

test('hay 40 palabras y 4 con confianza baja', () => {
  expect(WORDS).toHaveLength(40);
  expect(WORDS.filter((w) => w.confidence < 0.5)).toHaveLength(4);
});

test('palabra activa segun el segundo', () => {
  const w = WORDS[5];
  expect(activeWordIndex(WORDS, w.start + 0.01)).toBe(5);
  expect(activeWordIndex(WORDS, 0)).toBe(-1);
  expect(activeWordIndex(WORDS, DURATION)).toBe(-1);
});

test('tasa de alineacion', () => {
  expect(alignmentRate(WORDS)).toBe(36 / 40);
  expect(alignmentRate([])).toBe(0);
});

test('respaldo al 35% cuando no hay estribillo', () => {
  const r = chorusOrFallback(100, null);
  expect(r.fallback).toBe(true);
  expect(r.start).toBe(35);
  expect(r.end - r.start).toBeGreaterThanOrEqual(8);
  expect(r.end - r.start).toBeLessThanOrEqual(45);
});

test('un estribillo detectado se limita a 8-45 s', () => {
  expect(chorusOrFallback(200, { start: 10, end: 12 })).toEqual({ start: 10, end: 18, fallback: false });
  expect(chorusOrFallback(200, { start: 10, end: 90 }).end).toBe(55);
  expect(CHORUS).not.toBeNull();
});

test('la interfaz muestra la tasa y no carga el video hasta pulsar', () => {
  render(<Demo lang="en" />);
  expect(screen.getByTestId('rate')).toHaveTextContent('90%');
  expect(document.querySelector('iframe')).toBeNull();
});
