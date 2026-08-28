// ── Club crests — real pixel-art badges, auto-assigned per club (with a procedural SVG fallback) ──────
// The game ships a set of 64 pixel-art badges under client/public/badges/ (badge-1..64.png): the 18
// hand-drawn originals from the mikobrzu 32x32 pack + 46 generated in the same style by tools/gen_badges.py.
// crest() assigns each club a STABLE badge by hashing its name, so every club (opponents + your own) has a
// consistent pixel crest. BADGE_OVERRIDES lets you pin a specific badge to a specific club by name.
// crestSvg() is a self-contained procedural shield used as a fallback (e.g. if the PNGs are absent).

// How many badge-N.png files exist under client/public/badges/. 0 = no pack yet → use the procedural SVG
// shield. Pixelated minimal-logo crests (tools/pixelate_badges.py) with the too-real-club ones removed
// and recoloured/mixed variants added for variety (tools/vary_badges.py).
const BADGE_COUNT = 150;

function h32(s: string): number { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) || 1; }
export function crestSlug(name: string): string { return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

/** Pin a specific badge file to a specific club by slug (overrides the hash assignment). Optional. */
export const BADGE_OVERRIDES: Record<string, string> = {
  // e.g. 'northgate-city': '/badges/badge-7.png',
};

/** The badge image url for a club — a pinned override, else a stable hash pick from the 64-badge set. */
export function badgeUrl(name: string): string {
  const override = BADGE_OVERRIDES[crestSlug(name)];
  if (override) return override;
  return BADGE_COUNT > 0 ? `/badges/badge-${(h32(name) % BADGE_COUNT) + 1}.png` : '';
}

/** A club crest for `name` — a real pixel-art badge <img> (falls back to a procedural SVG shield if the
 *  image can't load, so the UI never shows a broken icon). `size` in px. */
export function crest(name: string, size = 20): string {
  if (BADGE_COUNT <= 0 && !BADGE_OVERRIDES[crestSlug(name)]) return crestSvg(name, size); // no pack yet → SVG shield
  const url = badgeUrl(name);
  // fallback (only if the PNG can't load): the procedural SVG shield, as a base64 data-URI so there are no
  // quote-escaping hazards inside the onerror handler.
  let fallback = '';
  try { fallback = 'data:image/svg+xml;base64,' + btoa(crestSvg(name, size)); } catch { /* no btoa (SSR) */ }
  const onerr = fallback ? ` onerror="this.onerror=null;this.src='${fallback}'"` : '';
  return `<img class="crest crest-img" src="${url}" width="${size}" height="${size}" alt="" loading="lazy"${onerr} />`;
}

// ── procedural SVG shield fallback ────────────────────────────────────────────────────────────────
const CREST_COLORS = ['#b3122b', '#0e2a5e', '#1f6f43', '#14141f', '#5a1030', '#b8860b', '#134e6f', '#7a1f8f', '#0b6b6b', '#144b8a', '#8a1c1c', '#2e5a1f'];
const ACCENTS = ['#f0e6c8', '#ffd24a', '#eef2ff', '#7fc7ff'];
const SHIELD = 'M2 2 H30 V19 C30 30 24 34 16 35 C8 34 2 30 2 19 Z';
function initials(name: string): string {
  const words = name.replace(/[^A-Za-z ]/g, ' ').split(/\s+/).filter((w) => w && !/^(the|a|an|fc|cf|sc|ac)$/i.test(w));
  const pick = words.length ? words : name.replace(/[^A-Za-z]/g, '').split('');
  return (pick.slice(0, 2).map((w) => (w[0] || '').toUpperCase()).join('') || '?').slice(0, 2);
}
export function crestSvg(name: string, size = 20): string {
  const h = h32(name);
  const primary = CREST_COLORS[h % CREST_COLORS.length];
  const accent = ACCENTS[(h >>> 7) % ACCENTS.length];
  const pattern = (h >>> 13) % 5;
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
    + `<text x="16" y="22" text-anchor="middle" font-family="var(--display, monospace)" font-size="12" font-weight="700" fill="#fff" stroke="#0b0b18" stroke-width="0.7" paint-order="stroke">${initials(name)}</text>`
    + `</svg>`;
}

/** The two shield colours for a club (from the SVG fallback palette) — handy for kit swatches / accents. */
export function crestColors(name: string): { primary: string; accent: string } {
  const h = h32(name);
  return { primary: CREST_COLORS[h % CREST_COLORS.length], accent: ACCENTS[(h >>> 7) % ACCENTS.length] };
}
