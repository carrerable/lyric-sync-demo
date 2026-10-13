import { useEffect, useRef, useState } from 'react';
import type { Lang } from './i18n';
import { Shell } from './ui/Shell';
import { Frame } from './ui/Frame';
import { CHORUS, DURATION, WORDS } from './data/song';
import { LOW_CONFIDENCE, activeWordIndex, alignmentRate, chorusOrFallback } from './lib/lyrics';

const VIDEO_ID = '7dKB-EBO3WU'; // the example video already embedded in the case study

const T = {
  en: {
    eyebrow: 'Case study / lyric video pipeline', title: 'Lyric video pipeline: word-level alignment',
    lead: 'Every word is aligned to the audio with a confidence score. Here the playback is simulated, with no audio.',
    play: 'Play', pause: 'Pause', time: 'Time', rate: 'Alignment rate', low: 'Low-confidence words', chorus: 'Chorus window', detected: 'detected', fallback: 'fallback at 35% of the song',
    noChorus: 'Pretend the chorus was not detected', pipeline: 'Pipeline', steps: ['Read the mp3 and its embedded lyrics', 'Align every word to the audio', 'Render the 1920x1080 lyric video', 'Render the vertical Short of the chorus', 'Upload both'],
    data: 'Data over intuition', dataText: 'Each run prints its alignment ratio. Two real runs: 268 of 286 words (94%) and 243 of 302 (80%). Both were healthy, so neither needed a retry. A song with no usable chorus falls back to a window at 35% of its length instead of blocking the run.',
    legend: 'Confidence', high: '0.8 or more', mid: '0.5 to 0.8', lowL: 'under 0.5', video: 'Example video (loads from YouTube only when you press the button)', load: 'Load example video', seconds: 's',
  },
  es: {
    eyebrow: 'Caso de estudio / pipeline de lyric videos', title: 'Pipeline de lyric videos: alineación por palabra',
    lead: 'Cada palabra se alinea al audio con una puntuación de confianza. Aquí la reproducción es simulada, sin audio.',
    play: 'Reproducir', pause: 'Pausa', time: 'Tiempo', rate: 'Tasa de alineación', low: 'Palabras de baja confianza', chorus: 'Ventana del estribillo', detected: 'detectado', fallback: 'respaldo al 35% de la canción',
    noChorus: 'Simular que no se detectó el estribillo', pipeline: 'Pipeline', steps: ['Leer el mp3 y su letra incrustada', 'Alinear cada palabra con el audio', 'Renderizar el lyric video de 1920x1080', 'Renderizar el Short vertical del estribillo', 'Subir ambos'],
    data: 'Datos sobre intuición', dataText: 'Cada corrida imprime su tasa de alineación. Dos corridas reales: 268 de 286 palabras (94%) y 243 de 302 (80%). Ambas salieron sanas y ninguna necesitó reintento. Una canción sin estribillo usable cae a una ventana al 35% de su duración en vez de bloquear la corrida.',
    legend: 'Confianza', high: '0.8 o más', mid: '0.5 a 0.8', lowL: 'menos de 0.5', video: 'Video de ejemplo (se carga desde YouTube solo al pulsar el botón)', load: 'Cargar video de ejemplo', seconds: 's',
  },
};

const tone = (c: number) => (c >= 0.8 ? 'ok' : c >= LOW_CONFIDENCE ? 'warn' : 'bad');

export function Demo({ lang }: { lang: Lang }) {
  const t = T[lang];
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [noChorus, setNoChorus] = useState(false);
  const [video, setVideo] = useState(false);
  const last = useRef(0);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    last.current = performance.now();
    const tick = (now: number) => {
      const dt = (now - last.current) / 1000;
      last.current = now;
      setTime((x) => { const n = x + dt; if (n >= DURATION) { setPlaying(false); return DURATION; } return n; });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const active = activeWordIndex(WORDS, time);
  const chorus = chorusOrFallback(DURATION, noChorus ? null : CHORUS);
  const inChorus = time >= chorus.start && time < chorus.end;
  const rate = alignmentRate(WORDS);
  const lows = WORDS.filter((w) => w.confidence < LOW_CONFIDENCE);

  return (
    <Shell lang={lang} eyebrow={t.eyebrow} title={t.title} lead={t.lead}>
      <Frame tl={`${t.time} ${time.toFixed(1)}${t.seconds}`} tr={inChorus ? 'CHORUS' : ''}>
        <div className="row" style={{ marginBottom: 'var(--s-3)' }}>
          <button className="btn primary" onClick={() => { if (time >= DURATION) setTime(0); setPlaying(!playing); }}>{playing ? t.pause : t.play}</button>
          <label style={{ flex: '1 1 12rem' }}>{t.time}
            <input type="range" min={0} max={DURATION} step={0.1} value={time} onChange={(e) => { setPlaying(false); setTime(Number(e.target.value)); }} />
          </label>
        </div>
        <p data-testid="lyrics" style={{ fontFamily: 'var(--f-display)', fontWeight: 800, fontSize: 'var(--t-xl)', lineHeight: 1.5 }}>
          {WORDS.map((w, i) => (
            <span key={i} data-conf={tone(w.confidence)} style={{
              marginRight: '0.4em', display: 'inline-block', padding: '0 0.15em', borderRadius: 4,
              background: i === active ? 'var(--c-coral)' : 'transparent', color: i === active ? 'var(--c-ink)' : 'var(--fg)',
              borderBottom: `3px solid ${w.confidence < LOW_CONFIDENCE ? 'var(--bad)' : w.confidence < 0.8 ? 'var(--warn)' : 'var(--ok)'}`,
              outline: chorus.start <= w.start && w.end <= chorus.end + 0.01 ? '1px dashed var(--acc)' : 'none',
            }}>{w.word}</span>
          ))}
        </p>
        <div className="row"><span className="mono">{t.legend}</span><span className="chip ok">{t.high}</span><span className="chip warn">{t.mid}</span><span className="chip bad">{t.lowL}</span></div>
      </Frame>

      <Frame tl="STATS">
        <div className="grid">
          <div className="card"><div className="num" data-testid="rate">{Math.round(rate * 100)}%</div><div className="label">{t.rate} ({WORDS.length - lows.length}/{WORDS.length})</div></div>
          <div className="card"><div className="num">{lows.length}</div><div className="label">{t.low}</div></div>
          <div className="card"><div className="num" data-testid="chorus">{chorus.start.toFixed(1)}-{chorus.end.toFixed(1)}{t.seconds}</div><div className="label">{t.chorus}: {chorus.fallback ? t.fallback : t.detected}</div></div>
        </div>
        <button className="toggle" style={{ marginTop: 'var(--s-3)' }} aria-pressed={noChorus} onClick={() => setNoChorus(!noChorus)}>{t.noChorus}</button>
      </Frame>

      <Frame tl="PIPELINE">
        <h2>{t.pipeline}</h2>
        <ol style={{ paddingLeft: '1.25rem', margin: 0 }}>{t.steps.map((s) => <li key={s}>{s}</li>)}</ol>
      </Frame>

      <Frame tl="DATA">
        <h2>{t.data}</h2>
        <p>{t.dataText}</p>
        <p className="note">{t.video}</p>
        {video ? (
          <iframe src={`https://www.youtube-nocookie.com/embed/${VIDEO_ID}`} title="Example lyric video" loading="lazy" allow="encrypted-media; picture-in-picture" allowFullScreen style={{ width: '100%', aspectRatio: '16/9', border: 0 }} />
        ) : <button className="btn" onClick={() => setVideo(true)}>{t.load}</button>}
      </Frame>
    </Shell>
  );
}
