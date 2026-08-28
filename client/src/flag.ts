// ── Fictional-nation flags (client/public/flags), one per nation in shared NATIONS ──
// flagImg() returns an <img> that hides itself if the file is missing.
export function flagSlug(nation: string): string { return nation.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

export function flagUrl(nation: string): string { return `/flags/flag-${flagSlug(nation)}.png`; }

/** An <img> for a nation flag; self-hides on load error. `size` in px (kept 3:2-ish via width only). */
export function flagImg(nation: string, size = 20, cls = ''): string {
  return `<img class="flag${cls ? ' ' + cls : ''}" src="${flagUrl(nation)}" width="${size}" height="${size}" alt="" loading="lazy" style="image-rendering:pixelated;vertical-align:middle;border-radius:2px" onerror="this.onerror=null;this.style.display='none'" />`;
}
