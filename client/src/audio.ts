// ── Audio / music — a small, source-agnostic manager ────────────────────────────────────────────
// Plays one looping music track per game CONTEXT, crossfading between them. Presentational only (never
// touches the deterministic engine). Tracks are bundled files under client/public/audio/ (drop the
// licensed chiptune-with-warmth pack there); a context with no file is a silent no-op, so the game runs
// fine before the audio assets exist. Volume/mute persist to localStorage. See docs/audio-music-design.md.

export type MusicContext = 'menu' | 'career' | 'match' | 'triumph' | 'emotional';

// context → bundled file url (Vite serves client/public/ at the site root). Add files to enable a context.
const MANIFEST: Record<MusicContext, string> = {
  menu: '/audio/menu.ogg',
  career: '/audio/career.ogg',
  match: '/audio/match.ogg',
  triumph: '/audio/triumph.ogg',
  emotional: '/audio/emotional.ogg',
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

  /** Crossfade to the loop for `context`. No-op if already playing it, if muted-silent is fine, or if the
   *  context has no bundled track (graceful — silent). Safe to call on every screen change. */
  play(context: MusicContext): void {
    if (!this.unlocked) { this.pending = context; return; } // start after the first gesture
    if (this.current === context && this.deck && !this.deck.paused) return;
    this.current = context;
    const url = MANIFEST[context];
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
// performance.now() is a clock read — fine in the CLIENT (this is not shared/ engine code). Guarded for SSR/test.
function performance_now(): number { return typeof performance !== 'undefined' && performance.now ? performance.now() : 0; }

export const audio = new AudioManager();
