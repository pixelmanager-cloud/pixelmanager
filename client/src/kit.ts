// Recolorable kit (jersey) templates. The PNGs in /kits are 2-tone: base = magenta rgb(255,0,255),
// accent = cyan rgb(0,255,255) (see tools/rd_kits.py). At render time we swap those sentinels to a club's
// actual two colours on an offscreen canvas and hand back a data-URL, so one template dresses any club in
// its own identity. Deterministic template pick per club name (same hashing idea as crest()).
import { KITS } from './kit-manifest';

// FNV-1a-ish string hash → stable template choice per club.
function h32(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** Which kit template a club uses (stable per name). Returns the file path under /kits. */
export function kitTemplate(clubName: string): string {
  if (!KITS.length) return '';
  return `/kits/${KITS[h32(clubName) % KITS.length]}`;
}

function hexToRgb(hex: string): [number, number, number] {
  const m = hex.replace('#', '');
  const n = parseInt(m.length === 3 ? m.split('').map((c) => c + c).join('') : m, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const cache = new Map<string, string>();

/** Recolor a template to (primary, secondary) and return a PNG data-URL. Cached per (template,colours).
 *  primary/secondary accept '#rrggbb' or [r,g,b]. Falls back to the raw template URL if canvas is unavailable. */
export async function recolorKit(
  templateUrl: string,
  primary: string | [number, number, number],
  secondary: string | [number, number, number],
): Promise<string> {
  const p = Array.isArray(primary) ? primary : hexToRgb(primary);
  const s = Array.isArray(secondary) ? secondary : hexToRgb(secondary);
  const ck = `${templateUrl}|${p.join(',')}|${s.join(',')}`;
  const hit = cache.get(ck);
  if (hit) return hit;
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = templateUrl;
    });
    const cv = document.createElement('canvas');
    cv.width = img.width; cv.height = img.height;
    const ctx = cv.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, cv.width, cv.height);
    const d = data.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 110) continue;
      // base sentinel (255,0,255) → primary, everything else opaque → secondary
      const isBase = d[i] > 200 && d[i + 1] < 80 && d[i + 2] > 200;
      const c = isBase ? p : s;
      d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2];
    }
    ctx.putImageData(data, 0, 0);
    const url = cv.toDataURL('image/png');
    cache.set(ck, url);
    return url;
  } catch {
    return templateUrl; // graceful fallback (e.g. no DOM/canvas)
  }
}
