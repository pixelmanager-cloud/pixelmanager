// ── Pixel-art sprite system ─────────────────────────────────────────────────
// Tiny self-contained pixel-art icons drawn as inline SVG (no external assets, so
// they work offline and inherit the theme). Each sprite is authored as a grid of
// single-char pixels + a palette; `crispEdges` keeps the blocky pixel look at any size.
// Kept deliberately small and used sparingly — a little pixel flavour, not clutter.

// Shared palette — reused across sprites for a coherent look. '.' / ' ' = transparent.
const PAL: Record<string, string> = {
  k: '#10102a', // dark outline
  d: '#33335f', // shadow stone
  s: '#6b6f9c', // stone / concrete
  S: '#9aa0d0', // light stone
  w: '#eef2ff', // white
  g: '#2fbf6e', // grass
  G: '#46e08a', // grass highlight
  y: '#ffce3a', // gold
  o: '#ff9a3c', // orange
  r: '#ff5d6c', // red
  c: '#37e6ff', // cyan
  b: '#4d8bff', // blue
  p: '#e8b48a', // skin
  n: '#7a5a3a', // brown
  m: '#ff6ab0', // pink
  l: '#c9a24a', // dark gold
  t: '#1f8f5a', // dark grass
};

/** Build an inline-SVG pixel sprite from a char grid. Rows may vary in length. */
function px(grid: string[], palette: Record<string, string> = PAL): string {
  const h = grid.length;
  const w = Math.max(...grid.map((r) => r.length));
  let rects = '';
  for (let y = 0; y < h; y++) {
    const row = grid[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      const fill = palette[ch];
      if (fill) rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${fill}"/>`;
    }
  }
  return `<svg class="px" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" preserveAspectRatio="xMidYMid meet">${rects}</svg>`;
}

// ── Sprite definitions (16×16 unless noted) ─────────────────────────────────
const SPRITES: Record<string, string[]> = {
  // 🏟️ Stadium — floodlit bowl around a green pitch
  stadium: [
    'y..............y',
    'ky............ky',
    '.k............k.',
    '.SssssssssssssS.',
    'sSSSSSSSSSSSSSSs',
    'sSgggggggggggggS',
    'sSgttttttttttggS',
    'sSgtGGGGGGGGtggS',
    'sSgtGwwwwwwGtggS',
    'sSgtGwGGGGwGtggS',
    'sSgtGwwwwwwGtggS',
    'sSgtGGGGGGGGtggS',
    'sSgggggggggggggS',
    'sSSSSSSSSSSSSSSs',
    '.dssssssssssssd.',
    '..dddddddddddd..',
  ],
  // 🏋️ Training Ground — a dumbbell
  training: [
    '................',
    '................',
    '................',
    '...kk......kk...',
    '..kSSk....kSSk..',
    '..kSSk....kSSk..',
    '..kSSkkkkkkSSk..',
    '..kSSSllllSSSk..',
    '..kSSkkkkkkSSk..',
    '..kSSk....kSSk..',
    '..kSSk....kSSk..',
    '...kk......kk...',
    '................',
    '................',
    '................',
    '................',
  ],
  // 🎓 Youth Academy — a green sprout in a pot (home-grown talent)
  youth: [
    '................',
    '................',
    '.......t........',
    '......tGt.......',
    '.....GGtGG......',
    '....GG.t.GG.....',
    '....G..t..G.....',
    '.......t........',
    '.......t........',
    '.....kkkkk......',
    '....knnnnnk.....',
    '....knSSSnk.....',
    '....knnnnnk.....',
    '.....kkkkk......',
    '................',
    '................',
  ],
  // 🔭 Scouting HQ — binoculars
  scouting: [
    '................',
    '................',
    '..kkk....kkk....',
    '.kcbck..kcbck...',
    '.kccck..kccck...',
    '.kccckkkkccck...',
    '.kSSSccccSSSk...',
    '.kSSSk..kSSSk...',
    '..kkk....kkk....',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  // 🏥 Medical Centre — a med kit / red cross
  medical: [
    '................',
    '................',
    '...kwwwwwwwwk...',
    '..kwwwwwwwwwwk..',
    '..kwwwwrrwwwwk..',
    '..kwwwwrrwwwwk..',
    '..kwrrrrrrrrwk..',
    '..kwrrrrrrrrwk..',
    '..kwwwwrrwwwwk..',
    '..kwwwwrrwwwwk..',
    '..kwwwwwwwwwwk..',
    '...kwwwwwwwwk...',
    '................',
    '................',
    '................',
    '................',
  ],
  // 📣 Commercial Dept — a stack of gold coins
  sponsor: [
    '................',
    '................',
    '................',
    '....kkkkkk......',
    '...kyllllyk.....',
    '....kkkkkk......',
    '...kyllllyk.....',
    '....kkkkkk......',
    '..kyyllllyyk....',
    '..kyllllllyk....',
    '...kkkkkkkk.....',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  // 🎉 Fan Zone — a football scarf
  fanzone: [
    '................',
    '................',
    '................',
    '..kkkkkkkkkkkk..',
    '..krrwwrrwwrrk..',
    '..krrwwrrwwrrk..',
    '..krrwwrrwwrrk..',
    '..kkkkkkkkkkkk..',
    '..k.k.k.k.k.k...',
    '..k.k.k.k.k.k...',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  // ⚽ Football
  ball: [
    '................',
    '.....kkkkkk.....',
    '...kkwwwwwwkk...',
    '..kwwwwwwwwwwk..',
    '..kwwwwkkwwwwk..',
    '.kwwwkkkkkkwwwk.',
    '.kwwwkkkkkkwwwk.',
    '.kwwwwkkkkwwwwk.',
    '.kwwkwwwwwwkwwk.',
    '.kwwkwwwwwwkwwk.',
    '..kwwwwwwwwwwk..',
    '..kwwwwwwwwwwk..',
    '...kkwwwwwwkk...',
    '.....kkkkkk.....',
    '................',
    '................',
  ],
  // 🏆 Trophy
  trophy: [
    '................',
    '..kkkkkkkkkk....',
    '..kyyyyyyyyk....',
    '.kykyyyyyykyk...',
    'kyykyyyyyykyyk..',
    'kyykyyyyyykyyk..',
    '.kykyyyyyykyk...',
    '..kyyyyyyyyk....',
    '...kyyyyyyk.....',
    '....kyyyyk......',
    '.....kyyk.......',
    '....kkyykk......',
    '...kyyyyyyk.....',
    '...kkkkkkkk.....',
    '................',
    '................',
  ],
  // 👟 Football boot
  boot: [
    '................',
    '................',
    '...kkk..........',
    '..kwwwk.........',
    '..kwwwk.........',
    '..kwwwkkkkk.....',
    '..kwwwwwwwwkk...',
    '..kwwwwwwwwwwk..',
    '..kwwwwwwwwwwwk.',
    '..kkkkkkkkkkkkk.',
    '...k.k.k.k.k.k..',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
};

/** Returns an inline pixel-art SVG for `name`, or '' if unknown. */
export function sprite(name: string): string {
  const g = SPRITES[name];
  return g ? px(g) : '';
}
