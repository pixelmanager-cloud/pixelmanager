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
  scout: ['/audio/scout-1.ogg'],
  career: ['/audio/career-1.ogg', '/audio/career-2.ogg', '/audio/career-3.ogg', '/audio/career-4.ogg', '/audio/career-5.ogg'],
  hub: ['/audio/hub-1.ogg'],
  match: ['/audio/match-1.ogg'],
  bigmatch: ['/audio/bigmatch-1.ogg'],
  triumph: ['/audio/triumph-1.ogg'],
  tension: ['/audio/tension-1.ogg'],
  drama: ['/audio/drama-1.ogg', '/audio/drama-2.ogg', '/audio/drama-3.ogg'],
  international: ['/audio/international-1.ogg'],
  legends: ['/audio/legends-1.ogg'],
  emotional: ['/audio/emotional-1.ogg'],
};

interface AudioSettings { volume: number; muted: boolean; sfxVolume: number; sfxMuted: boolean }
const SETTINGS_KEY = 'fm_audio';
const FADE_MS = 800;

// A named reward CHIME is a tiny chiptune arpeggio — a soft square-wave phrase, synthesised in the Web
// Audio graph (no sample files). Deliberately gentle + reserved for big commitment/celebration beats, NOT
// routine clicks. {f: Hz, t: start offset s, d: duration s, type?: waveform}.
type ChimeNote = { f: number; t: number; d: number; type?: OscillatorType };
const CHIMES: Record<string, ChimeNote[]> = {
  confirm:     [{ f: 523.25, t: 0, d: 0.08, type: 'triangle' }, { f: 783.99, t: 0.07, d: 0.13, type: 'triangle' }],
  success:     [{ f: 523.25, t: 0, d: 0.09 }, { f: 659.25, t: 0.08, d: 0.09 }, { f: 783.99, t: 0.16, d: 0.18 }],
  triumph:     [{ f: 523.25, t: 0, d: 0.1 }, { f: 659.25, t: 0.09, d: 0.1 }, { f: 783.99, t: 0.18, d: 0.1 }, { f: 1046.5, t: 0.27, d: 0.3 }],
  achievement: [{ f: 783.99, t: 0, d: 0.08, type: 'triangle' }, { f: 1046.5, t: 0.07, d: 0.08, type: 'triangle' }, { f: 1318.5, t: 0.14, d: 0.22, type: 'triangle' }],
};

class AudioManager {
  private settings: AudioSettings = { volume: 0.5, muted: false, sfxVolume: 0.6, sfxMuted: false };
  private unlocked = false;              // browsers block audio until a user gesture
  private pending: MusicContext | null = null; // context requested before unlock
  private current: MusicContext | null = null;
  /** Monotonic request id — the LATEST play() wins, whatever order the loads happen to resolve in. */
  private reqSeq = 0;
  private deck: HTMLAudioElement | null = null;      // the playing loop
  private tracked: HTMLAudioElement[] = [];          // every element we've started (so none can linger/overlap)
  private fadeTimer: number | null = null;
  private actx: AudioContext | null = null;          // lazily-created, shared by all chimes

  constructor() {
    try { const raw = localStorage.getItem(SETTINGS_KEY); if (raw) { const s = JSON.parse(raw); this.settings = { volume: clamp01(s.volume ?? 0.5), muted: !!s.muted, sfxVolume: clamp01(s.sfxVolume ?? 0.6), sfxMuted: !!s.sfxMuted }; } } catch { /* defaults */ }
  }

  private ensureCtx(): AudioContext | null {
    try { if (!this.actx) { const Ctor = (window.AudioContext || (window as any).webkitAudioContext); if (!Ctor) return null; this.actx = new Ctor(); } if (this.actx.state === 'suspended') this.actx.resume().catch(() => {}); return this.actx; } catch { return null; }
  }

  /** Play a named reward chime (see CHIMES). No-op if SFX is muted, before the first gesture, or if the
   *  chime name is unknown. Presentational only — never touches the engine. */
  chime(name: keyof typeof CHIMES | string): void {
    if (this.settings.sfxMuted || !this.unlocked) return;
    const seq = CHIMES[name]; if (!seq) return;
    const ctx = this.ensureCtx(); if (!ctx) return;
    const now = ctx.currentTime, master = this.settings.sfxVolume;
    for (const n of seq) {
      try {
        const osc = ctx.createOscillator(), g = ctx.createGain();
        osc.type = n.type ?? 'square'; osc.frequency.value = n.f;
        const start = now + n.t, end = start + n.d;
        g.gain.setValueAtTime(0.0001, start);
        g.gain.linearRampToValueAtTime(clamp01(master * 0.22), start + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, end);
        osc.connect(g); g.connect(ctx.destination);
        osc.start(start); osc.stop(end + 0.03);
      } catch { /* a node failed — skip this note */ }
    }
  }

  getSfxVolume(): number { return this.settings.sfxVolume; }
  isSfxMuted(): boolean { return this.settings.sfxMuted; }
  setSfxVolume(v: number): void { this.settings.sfxVolume = clamp01(v); this.persist(); }
  setSfxMuted(m: boolean): void { this.settings.sfxMuted = m; this.persist(); }
  toggleSfxMuted(): boolean { this.setSfxMuted(!this.settings.sfxMuted); return this.settings.sfxMuted; }

  /** Call on the first user gesture (e.g. New Game / Continue click) so autoplay is allowed. */
  unlock(): void {
    if (this.unlocked) return;
    this.unlocked = true;
    if (this.pending) { const c = this.pending; this.pending = null; this.play(c); }
  }

  private lastIdx: Partial<Record<MusicContext, number>> = {}; // last track played per context (avoid immediate repeats)

  /** A short one-shot cue played OVER the current music, without changing context.
   *
   *  `triumph` was being requested as a looping context and then immediately superseded by the season
   *  screen's own `play('hub')` in the same tick, so the victory theme was loaded, faded in and killed
   *  within one JavaScript tick — every trophy in the game was scored with the office ambient loop. It is
   *  also 3.65 seconds long against 37-188s for every other file: a fanfare, not a bed. Looping it would
   *  have replaced silence with a jingle repeating until the player changed screens.
   */
  sting(context: MusicContext): void {
    if (!this.unlocked || this.settings.muted) return;
    const pool = MANIFEST[context];
    if (!pool || pool.length === 0) return;
    try {
      const a = new Audio(pool[Math.floor(frac01() * pool.length)]);
      a.loop = false;
      a.volume = this.effectiveVolume();
      a.addEventListener('ended', () => { try { a.pause(); } catch { /* done */ } });
      void a.play().catch(() => { /* silent, like every other load here */ });
    } catch { /* never let a cue break a celebration */ }
  }

  /** Crossfade to a loop for `context`. No-op if already playing that context, or if its playlist is empty
   *  (graceful — silent, for slots whose track isn't chosen yet). A multi-track context rotates. Safe to
   *  call on every screen change. */
  play(context: MusicContext): void {
    if (!this.unlocked) { this.pending = context; return; } // start after the first gesture
    if (this.current === context && this.deck && !this.deck.paused) return;
    const pool = MANIFEST[context];
    if (!pool || pool.length === 0) return; // no track for this context yet — leave whatever's playing
    // ORDER-AUTHORITATIVE. This committed `this.current` before the load was known to succeed and let
    // whichever element's play() promise RESOLVED LAST win the crossfade — so the winner was decided by
    // file size and cache state, not by call order. A 240KB cue requested first lost to a 7.6MB loop
    // requested second; a failed load left `current` naming a context that was not playing, and the
    // early-return above then suppressed every attempt to correct it for the rest of the session.
    const req = ++this.reqSeq;
    this.current = context;
    let i = Math.floor(frac01() * pool.length);
    if (pool.length > 1 && i === this.lastIdx[context]) i = (i + 1) % pool.length; // avoid immediate repeat
    this.lastIdx[context] = i;
    const url = pool[i];
    const next = new Audio(url);
    next.loop = true;
    next.preload = 'auto';
    next.volume = 0; // fade in
    this.tracked.push(next);
    // if the file is missing / fails to load, silently give up (keeps the game running audio-less)
    next.play()
      .then(() => {
        if (req !== this.reqSeq) { try { next.pause(); } catch { /* already gone */ } this.tracked = this.tracked.filter((a) => a !== next); return; }
        this.crossfadeTo(next);
      })
      .catch(() => {
        this.tracked = this.tracked.filter((a) => a !== next);
        // Do not strand `current` on a context that never started, or the guard above locks it in for good.
        if (req === this.reqSeq) this.current = null;
      });
  }

  /** Fade the new deck in and EVERY other tracked element out — so rapid screen changes can never leave two
   *  tracks overlapping (only `next` survives the fade; all others are paused + dropped). */
  private crossfadeTo(next: HTMLAudioElement): void {
    this.deck = next;
    const others = this.tracked.filter((a) => a !== next).map((a) => ({ a, from: a.volume }));
    const target = this.effectiveVolume();
    const start = performance_now();
    if (this.fadeTimer != null) cancelAnimationFrame(this.fadeTimer);
    const step = () => {
      const t = Math.min(1, (performance_now() - start) / FADE_MS);
      try { next.volume = clamp01(target * t); } catch { /* detached */ }
      for (const o of others) { try { o.a.volume = clamp01(o.from * (1 - t)); } catch { /* detached */ } }
      if (t < 1) { this.fadeTimer = requestAnimationFrame(step); }
      else { for (const o of others) { try { o.a.pause(); o.a.currentTime = 0; } catch { /* ignore */ } } this.tracked = [next]; this.fadeTimer = null; }
    };
    this.fadeTimer = requestAnimationFrame(step);
  }

  /** Stop all music (fade out). */
  stop(): void {
    this.current = null;
    const all = this.tracked.slice(); this.tracked = []; this.deck = null;
    if (!all.length) return;
    const froms = all.map((a) => a.volume), start = performance_now();
    const step = () => { const t = Math.min(1, (performance_now() - start) / FADE_MS); all.forEach((d, i) => { try { d.volume = clamp01(froms[i] * (1 - t)); } catch { /* ignore */ } }); if (t < 1) requestAnimationFrame(step); else all.forEach((d) => { try { d.pause(); d.currentTime = 0; } catch { /* ignore */ } }); };
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
