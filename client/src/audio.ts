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
  // THREE TRACKS, BECAUSE A MATCH IS NINE REAL MINUTES. The clock advances 10 game-seconds per real second
  // at 1x (engine TICK_SEC 0.5, accum +10/s), so a 90-minute fixture takes ~540s — and a single 74-second
  // loop repeated 7.3 times inside one match, with no rotation, since the avoid-immediate-repeat branch
  // only runs when a pool has more than one entry. Matches are the most repeated activity in the game.
  // The pool is 355.7s in all — 73.6s / 148.0s / 134.1s, measured from each Ogg's last granulepos and
  // sample rate — but it does NOT play as a sequence. play() picks ONE entry per fixture and sets
  // loop = true, and the only thing that enters the 'match' context is showScreen('match'), called once as
  // the match starts. So three tracks cut the CHANCE of drawing the 73.6s one to a third (and never twice
  // running, via that same branch); they do not remove in-fixture repetition, which is still 7.3, 3.6 or
  // 4.0 loops of one track per fixture. Whether the deck should advance mid-fixture is open — F-221 (§101).
  // 'bigmatch' never sees this pool: cup and World-Finals ties crossfade onto it straight after
  // showScreen('match'), and it is one 70.7s track — 7.6 loops per tie, on the highest-stakes matches.
  // Both additions were picked on measurement rather than name — long, and flat enough (6 dB range) not to
  // swell over the commentary the player is reading. match-3 is the pack's purpose-built LOOP variant.
  match: ['/audio/match-1.ogg', '/audio/match-2.ogg', '/audio/match-3.ogg'],
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
  /** The pause-and-trim the in-flight fade would have run at t===1, so cancelling it does not leak the deck. */
  private fadeCleanup: (() => void) | null = null;
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
  //  ON THE SFX BUS, which is what it is. This gated on the MUSIC mute and mixed at the MUSIC volume, so
  //  "Mute sound effects" — whose own settings copy promises it covers "the reward chimes on big
  //  moments" — left the trophy fanfare playing, and "Mute music", which promises only to "silence the
  //  soundtrack", silenced it. Both switches did the opposite of what they say. Its sibling chime() has
  //  always been on the SFX bus, and the two fire together on every celebration, so one of them obeyed
  //  the player and the other did not.
  //
  //  Deliberately NOT pushed onto `tracked`: that list is what the crossfade pauses, and being killed
  //  by the next screen's crossfade is the exact bug the note above records fixing.
  sting(context: MusicContext): void {
    if (!this.unlocked || this.settings.sfxMuted) return;
    const pool = MANIFEST[context];
    if (!pool || pool.length === 0) return;
    try {
      const a = new Audio(pool[Math.floor(frac01() * pool.length)]);
      a.loop = false;
      // The mute check is the guard at the top of this method, which has already returned. Keeping a second
      // `sfxMuted ? 0 : …` here read as a belt-and-braces safety and was in fact an unreachable branch —
      // the kind of check that cannot fail, and that makes the next reader think there are two mute gates.
      a.volume = clamp01(this.settings.sfxVolume);
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
    // SETTLE THE FADE ALREADY IN FLIGHT BEFORE STARTING A NEW ONE. The comment above promises that "rapid
    // screen changes can never leave two tracks overlapping (only `next` survives the fade; all others are
    // paused + dropped)" — but the pause-and-trim lives ONLY in the fade's own t===1 branch, and cancelling
    // the frame throws away the closure that would have run it. So a screen change made during an 800ms fade
    // left the outgoing track playing, and back-to-back changes stacked live HTMLAudioElements in `tracked`
    // that nothing paused until some later fade happened to run to completion. Overlapping audio is exactly
    // what the comment says cannot happen.
    //
    // This runs FIRST — before `deck` is reassigned and before `others` is captured — so the settled state is
    // what the new fade reads. Doing it after would let the old cleanup's `tracked = [its next]` land on top
    // of the new fade's bookkeeping.
    // AND CANCELLED WITH THE CANCELLER THAT MATCHES ITS SCHEDULER. The fade below steps on setTimeout, so
    // cancelAnimationFrame here would be a silent no-op: the superseded fade would keep stepping, and its
    // t===1 branch would fire the NEW fade's cleanup, null the NEW fade's handle and overwrite `tracked`
    // with its own dead deck — re-creating the very overlap this block exists to prevent.
    if (this.fadeTimer != null) { clearTimeout(this.fadeTimer); this.fadeTimer = null; this.fadeCleanup?.(); }
    this.fadeCleanup = null;
    this.deck = next;
    const others = this.tracked.filter((a) => a !== next).map((a) => ({ a, from: a.volume }));
    // The same pause-and-trim the t===1 branch runs, kept reachable so an interrupted fade still performs it.
    this.fadeCleanup = () => {
      for (const o of others) { try { o.a.pause(); o.a.currentTime = 0; } catch { /* ignore */ } }
      this.tracked = this.tracked.filter((a) => a === next || !others.some((o) => o.a === a));
    };
    const start = performance_now();
    // THE LEVEL IS READ EVERY FRAME, NOT SNAPSHOTTED ONCE. This captured `const target = this.effectiveVolume()`
    // before the loop and then wrote `next.volume = target * t` on each of the ~48 frames of the 800ms fade.
    // `this.deck` is already `next` by this point, so the element the fade drives is the exact element
    // applyVolume() writes: a mute or volume change made during the fade was applied and then stomped on the
    // very next frame, and the final frame (t === 1) left the element parked on the stale snapshot for good.
    // The mute button lives in the HUD that calls play() on every showScreen(), so hitting the speaker icon
    // just after a screen change unmuted into silence — the glyph flipped, the music stayed at 0 until some
    // later screen happened to start a new fade. Probed headlessly against this file: unmute 32ms into the
    // fade ended the deck at 0.000 instead of 0.500; the slider dragged to 100% mid-fade ended at 0.500
    // instead of 1.000. The departing tracks keep their captured `from` — they are on the way out, and
    // ramping them against a live level would make a mid-fade change audible in a track being discarded.
    // STEPPED BY A TIMER, NOT BY A FRAME. requestAnimationFrame does not fire AT ALL in a hidden window —
    // main.ts already knows this and moves the match clock onto a timer when the tab goes away (PT-1409) —
    // but HTMLAudioElement keeps playing regardless, which is the whole point of letting a match run in the
    // background. The pause-and-trim that keeps the promise above lives ONLY in the t===1 branch below, so
    // hiding the window inside the 800ms fade froze the ramp where it stood and left the outgoing loop AND
    // the incoming one playing, unpaused and still in `tracked`, until the player came back: tab away just
    // after kick-off and hub-1.ogg ran over the match track for the whole nine-minute fixture. Background
    // timers are throttled to about a second, but they DO fire, so the fade finishes and the cleanup runs.
    const step = () => {
      const t = Math.min(1, (performance_now() - start) / FADE_MS);
      try { next.volume = clamp01(this.effectiveVolume() * t); } catch { /* detached */ }
      for (const o of others) { try { o.a.volume = clamp01(o.from * (1 - t)); } catch { /* detached */ } }
      if (t < 1) { this.fadeTimer = setTimeout(step, 16); }
      else { this.fadeCleanup?.(); this.fadeCleanup = null; this.tracked = [next]; this.fadeTimer = null; this.applyVolume(); }
    };
    this.fadeTimer = setTimeout(step, 16);
  }

  /** Stop all music (fade out). */
  stop(): void {
    this.current = null;
    const all = this.tracked.slice(); this.tracked = []; this.deck = null;
    if (!all.length) return;
    const froms = all.map((a) => a.volume), start = performance_now();
    // Timer, not frame, for the reason spelled out in crossfadeTo: a frame never arrives in a hidden
    // window, and the pause lives only in this fade's own t===1 branch, so the tracks would never stop.
    const step = () => { const t = Math.min(1, (performance_now() - start) / FADE_MS); all.forEach((d, i) => { try { d.volume = clamp01(froms[i] * (1 - t)); } catch { /* ignore */ } }); if (t < 1) setTimeout(step, 16); else all.forEach((d) => { try { d.pause(); d.currentTime = 0; } catch { /* ignore */ } }); };
    setTimeout(step, 16);
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
