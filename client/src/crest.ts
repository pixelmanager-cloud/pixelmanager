// ── Club crests — deterministic procedural badges (with a drop-in override for real art) ─────────────
// Every club gets a distinct shield crest generated from its name, so clubs have visual identity even
// before any image assets exist. When you add real badge PNGs later, drop them in client/public/badges/
// and register them in BADGE_OVERRIDES (slug → url) — crest() returns the image instead, no other change.
// Presentational only; deterministic (same name → same crest).

/** Deep, saturated "football club" shield colours. */
const CREST_COLORS = [
  '#b3122b', '#0e2a5e', '#1f6f43', '#14141f', '#5a1030', '#b8860b',
  '#134e6f', '#7a1f8f', '#0b6b6b', '#144b8a', '#8a1c1c', '#2e5a1f',
];
/** Stripe / sash / text accent colours (cream, gold, white, sky). */
const ACCENTS = ['#f0e6c8', '#ffd24a', '#eef2ff', '#7fc7ff'];

function h32(s: string): number { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) || 1; }
export function crestSlug(name: string): string { return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

/** Real-badge overrides: slug → image url under client/public/. Empty until art is added; when populated,
 *  crest() returns an <img> for that club instead of the procedural shield. */
export const BADGE_OVERRIDES: Record<string, string> = {
  // e.g. 'northgate-city': '/badges/northgate-city.png',
};

const SHIELD = 'M2 2 H30 V19 C30 30 24 34 16 35 C8 34 2 30 2 19 Z';

/** Up to two initials from a club name (skips a leading article), for the crest emblem. */
function initials(name: string): string {
  const words = name.replace(/[^A-Za-z ]/g, ' ').split(/\s+/).filter((w) => w && !/^(the|a|an|fc|cf|sc|ac)$/i.test(w));
  const pick = words.length ? words : name.replace(/[^A-Za-z]/g, '').split('');
  return (pick.slice(0, 2).map((w) => (w[0] || '').toUpperCase()).join('') || '?').slice(0, 2);
}

/** An inline-SVG shield crest for `name` (or a real badge <img> if one is registered). `size` in px. */
export function crest(name: string, size = 20): string {
  const url = BADGE_OVERRIDES[crestSlug(name)];
  if (url) return `<img class="crest crest-img" src="${url}" width="${size}" height="${size}" alt="" />`;
  const h = h32(name);
  const primary = CREST_COLORS[h % CREST_COLORS.length];
  const accent = ACCENTS[(h >>> 7) % ACCENTS.length];
  const pattern = (h >>> 13) % 5; // 0 solid · 1 vertical stripe · 2 diagonal sash · 3 band · 4 chevron
  const cid = 'cr' + h.toString(36);
  let overlay = '';
  if (pattern === 1) overlay = `<rect x="13" y="0" width="6" height="36" fill="${accent}"/>`;
  else if (pattern === 2) overlay = `<rect x="-8" y="15" width="56" height="7" transform="rotate(-40 16 18)" fill="${accent}"/>`;
  else if (pattern === 3) overlay = `<rect x="0" y="13" width="32" height="7" fill="${accent}"/>`;
  else if (pattern === 4) overlay = `<path d="M2 9 L16 19 L30 9 L30 15 L16 25 L2 15 Z" fill="${accent}"/>`;
  const w = size, hgt = Math.round(size * 36 / 32);
  return `<svg class="crest" viewBox="0 0 32 36" width="${w}" height="${hgt}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">`
    + `<defs><clipPath id="${cid}"><path d="${SHIELD}"/></clipPath></defs>`
    + `<path d="${SHIELD}" fill="${primary}"/>`
    + `<g clip-path="url(#${cid})">${overlay}</g>`
    + `<path d="${SHIELD}" fill="none" stroke="#0b0b18" stroke-width="2"/>`
    + `<text x="16" y="22" text-anchor="middle" font-family="var(--display, monospace)" font-size="12" font-weight="700" fill="#fff" stroke="#0b0b18" stroke-width="0.7" paint-order="stroke" style="letter-spacing:-0.5px">${initials(name)}</text>`
    + `</svg>`;
}

/** The two crest colours for a club — handy for kit swatches or accenting a club's row. */
export function crestColors(name: string): { primary: string; accent: string } {
  const url = BADGE_OVERRIDES[crestSlug(name)];
  const h = h32(name);
  return { primary: url ? '#888' : CREST_COLORS[h % CREST_COLORS.length], accent: ACCENTS[(h >>> 7) % ACCENTS.length] };
}
