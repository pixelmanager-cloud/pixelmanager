// ── Audio / music — a small, source-agnostic manager ────────────────────────────────────────────
// Plays one looping music track per game CONTEXT, crossfading between them. Presentational only (never
// touches the deterministic engine). Tracks are bundled files under client/public/audio/ (drop the
// licensed chiptune-with-warmth pack there); a context with no file is a silent no-op, so the game runs
// fine before the audio assets exist. Volume/mute persist to localStorage. See docs/audio-music-design.md.

export type MusicContext =
  | 'menu' | 'scout' | 'career' | 'hub' | 'match' | 'bigmatch'
  | 'triumph' | 'tension' | 'drama' | 'international' | 'legends' | 'emotional';

// context → a PLAYLIST of bundled file urls (Vite serves client/public/ at the site root). A context with
// >1 track rotates (fresh pick each time it starts, avoiding an immediate repeat); a context with an empty
// pool is a silent no-op (used for slots whose track isn't chosen yet). Files live in client/public/audio/.
const MANIFEST: Record<MusicContext, string[]> = {
  menu: ['/audio/menu-1.ogg'],
  scout: [], // pending track choice
  career: ['/audio/career-1.ogg', '/audio/career-2.ogg', '/audio/career-3.ogg', '/audio/career-4.ogg', '/audio/career-5.ogg'],
  hub: ['/audio/hub-1.ogg'],
  match: ['/audio/match-1.ogg'],
  bigmatch: [], // pending track choice
  triumph: ['/audio/triumph-1.ogg'],
  tension: ['/audio/tension-1.ogg'],
  drama: ['/audio/drama-1.ogg', '/audio/drama-2.ogg', '/audio/drama-3.ogg'],
  international: ['/audio/international-1.ogg'],
  legends: ['/audio/legends-1.ogg'],
  emotional: [], // pending track choice
};

interface AudioSettings { volume: number; muted: boolean }
const SETTINGS_KEY = 'fm_audio';
const FADE_MS = 800;

class AudioManager {
  private settings: AudioSettings = { volume: 0.5, muted: false };
  private unlocked = false;              // browsers block audio until a user gesture
  private pending: MusicContext | null = null; // context requested before unlock
  private current: MusicContext | null = null;
  private deck: HTMLAudioElement | null = null;      // the playing loop
  private fadeTimer: number | null = null;

  constructor() {
    try { const raw = localStorage.getItem(SETTINGS_KEY); if (raw) { const s = JSON.parse(raw); this.settings = { volume: clamp01(s.volume ?? 0.5), muted: !!s.muted }; } } catch { /* defaults */ }
  }

  /** Call on the first user gesture (e.g. New Game / Continue click) so autoplay is allowed. */
  unlock(): void {
    if (this.unlocked) return;
    this.unlocked = true;
    if (this.pending) { const c = this.pending; this.pending = null; this.play(c); }
  }

  private lastIdx: Partial<Record<MusicContext, number>> = {}; // last track played per context (avoid immediate repeats)

  /** Crossfade to a loop for `context`. No-op if already playing that context, or if its playlist is empty
   *  (graceful — silent, for slots whose track isn't chosen yet). A multi-track context rotates. Safe to
   *  call on every screen change. */
  play(context: MusicContext): void {
    if (!this.unlocked) { this.pending = context; return; } // start after the first gesture
    if (this.current === context && this.deck && !this.deck.paused) return;
    const pool = MANIFEST[context];
    if (!pool || pool.length === 0) return; // no track for this context yet — leave whatever's playing
    this.current = context;
    let i = Math.floor(frac01() * pool.length);
    if (pool.length > 1 && i === this.lastIdx[context]) i = (i + 1) % pool.length; // avoid immediate repeat
    this.lastIdx[context] = i;
    const url = pool[i];
    const next = new Audio(url);
    next.loop = true;
    next.preload = 'auto';
    next.volume = 0; // fade in
    // if the file is missing / fails to load, silently give up (keeps the game running audio-less)
    next.play().then(() => this.crossfadeTo(next)).catch(() => { /* no track or autoplay blocked — silent */ });
  }

  /** Fade the old deck out and the new one in to the effective volume. */
  private crossfadeTo(next: HTMLAudioElement): void {
    const old = this.deck;
    this.deck = next;
    const target = this.effectiveVolume();
    const start = performance_now();
    if (this.fadeTimer != null) cancelAnimationFrame(this.fadeTimer);
    const step = () => {
      const t = Math.min(1, (performance_now() - start) / FADE_MS);
      try { next.volume = clamp01(target * t); } catch { /* detached */ }
      if (old) { try { old.volume = clamp01(target * (1 - t)); } catch { /* detached */ } }
      if (t < 1) { this.fadeTimer = requestAnimationFrame(step); }
      else { if (old) { try { old.pause(); } catch { /* ignore */ } } this.fadeTimer = null; }
    };
    this.fadeTimer = requestAnimationFrame(step);
  }

  /** Stop all music (fade out). */
  stop(): void {
    this.current = null;
    const d = this.deck; this.deck = null;
    if (!d) return;
    const from = d.volume, start = performance_now();
    const step = () => { const t = Math.min(1, (performance_now() - start) / FADE_MS); try { d.volume = clamp01(from * (1 - t)); } catch { /* ignore */ } if (t < 1) requestAnimationFrame(step); else { try { d.pause(); } catch { /* ignore */ } } };
    requestAnimationFrame(step);
  }

  private effectiveVolume(): number { return this.settings.muted ? 0 : this.settings.volume; }
  private applyVolume(): void { if (this.deck) { try { this.deck.volume = this.effectiveVolume(); } catch { /* ignore */ } } }
  private persist(): void { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings)); } catch { /* ignore */ } }

  getVolume(): number { return this.settings.volume; }
  isMuted(): boolean { return this.settings.muted; }
  setVolume(v: number): void { this.settings.volume = clamp01(v); this.applyVolume(); this.persist(); }
  setMuted(m: boolean): void { this.settings.muted = m; this.applyVolume(); this.persist(); }
  toggleMuted(): boolean { this.setMuted(!this.settings.muted); return this.settings.muted; }
}

function clamp01(v: number): number { return Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0)); }
// track-rotation randomness — client-only + presentational (NOT the deterministic engine), so Math.random is fine here.
function frac01(): number { return Math.random(); }
// performance.now() is a clock read — fine in the CLIENT (this is not shared/ engine code). Guarded for SSR/test.
function performance_now(): number { return typeof performance !== 'undefined' && performance.now ? performance.now() : 0; }

export const audio = new AudioManager();
