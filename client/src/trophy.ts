// ── Silverware images (client/public/trophies) — one per award type ──
// trophyImg() returns an <img> that hides itself if the file is missing, so callers can keep an emoji
// fallback behind it. Keys match tools/rd_trophies.py.
export type TrophyKey = 'league' | 'cup' | 'continental' | 'worldfinals' | 'promotion' | 'goldenboot'
  | 'goldenglove' | 'playeroftheseason' | 'youngplayer' | 'topscorer' | 'dynasty' | 'runnerup';

export function trophyUrl(key: TrophyKey): string { return `/trophies/trophy-${key}.png`; }

export function trophyImg(key: TrophyKey, size = 40, cls = ''): string {
  return `<img class="trophy-img${cls ? ' ' + cls : ''}" src="${trophyUrl(key)}" width="${size}" height="${size}" alt="" loading="lazy" style="image-rendering:pixelated;vertical-align:middle" onerror="this.onerror=null;this.style.display='none'" />`;
}
