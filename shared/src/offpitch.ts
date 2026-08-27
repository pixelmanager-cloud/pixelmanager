// ── Off-pitch life — fame, endorsements, reputation, risky lifestyle & earned boots ───────────────
// The be-a-pro layer around the matches: how marketable the player is, what he's known for, the deals
// that brings, the temptations that come with money, and the signature boots he earns along the way.
// Fully deterministic (hash-seeded, derived from the career log — no rng, no wall-clock, no storage), so
// it replays identically and never touches the development engine, graduation or `career_sim`.

function hash32(...nums: number[]): number {
  let h = 2166136261 >>> 0;
  for (const n of nums) { h ^= (n >>> 0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
const frac = (h: number, n: number) => (((h >>> (n & 15)) ^ (h >>> ((n + 7) & 15))) % 1000) / 1000;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export interface Endorsement { brand: string; category: string; tier: 'Local' | 'National' | 'Global'; payout: number; obligation: string }
export interface SignatureBoot { id: string; name: string; edge: string; unlock: string }
export interface OffPitch {
  image: { score: number; tier: string };
  reputation: { score: number; label: string; edge: 'clean' | 'edgy' };
  endorsements: Endorsement[];
  boots: { owned: SignatureBoot[]; next: { boot: SignatureBoot; progress: number; target: number } | null };
  temptation: { kind: string; title: string; blurb: string } | null;
}

// Brand pools split by image — a clean reputation courts wholesome family brands; an edgy one draws the
// louder, higher-paying (and more demanding) labels. Deterministic flavour, not real companies.
const CLEAN_BRANDS: { brand: string; category: string; obligation: string }[] = [
  { brand: 'Meridian Sportswear', category: 'Kit & apparel', obligation: 'Wear the brand for every media day.' },
  { brand: 'Puravita', category: 'Energy drink', obligation: 'Keep your fitness meter respectable — they market your engine.' },
  { brand: 'Northbank', category: 'Bank', obligation: 'No controversy — a squeaky-clean image is the whole deal.' },
  { brand: 'Auroria Watches', category: 'Timepieces', obligation: 'Turn up on time, every time (they hate a late arrival).' },
  { brand: 'Homestead Foods', category: 'Groceries', obligation: 'Family-friendly appearances at community events.' },
];
const EDGY_BRANDS: { brand: string; category: string; obligation: string }[] = [
  { brand: 'Riot Energy', category: 'Energy drink', obligation: 'Stay in the headlines — they want noise, not silence.' },
  { brand: 'Vandal Streetwear', category: 'Fashion', obligation: 'Court the cameras; a little controversy is on-brand.' },
  { brand: 'Nitro Motors', category: 'Sports cars', obligation: 'Be seen living large — the flashier the better.' },
  { brand: 'Kingpin Casino', category: 'Betting', obligation: 'A gambling tie-up — fans and press may not love it.' },
  { brand: 'Blaze Audio', category: 'Headphones', obligation: 'Loud launches, louder personality.' },
];

// Signature boots — EARNED through play (never bought). Each carries a small OFF-PITCH perk (flavour /
// income / image), so unlocking them never alters on-pitch development or calibration.
export const BOOT_CATALOG: (SignatureBoot & { needCaps?: number; needBigWin?: boolean; needScore?: number; needImage?: number })[] = [
  { id: 'first-eleven', name: 'The First XI', edge: 'The boots he broke into the senior side in — a keepsake.', unlock: 'Reach the first team', needScore: 60 },
  { id: 'derby-day', name: 'Derby Day', edge: 'Worn the night he rose to a big occasion — a small confidence keepsake.', unlock: 'Win a big-game moment', needBigWin: true },
  { id: 'cap-pride', name: 'National Pride', edge: 'Gold-flash boots stitched after his first cap — a marketability boost.', unlock: 'Earn an international cap', needCaps: 1 },
  { id: 'century', name: 'The Century', edge: 'Commemorative boots for a landmark career score — draws the sponsors.', unlock: 'Career score 900+', needScore: 900 },
  { id: 'signature', name: 'The Signature', edge: 'His OWN signature line — the mark of a genuine icon.', unlock: 'Global icon status (image 80+)', needImage: 80 },
];

export function computeOffPitch(input: {
  careerScore: number; caps: number; seed: number; turn: number;
  tags: Record<string, number>; bigWins: number; flair: number;
}): OffPitch {
  const { careerScore, caps, seed, turn, tags, bigWins, flair } = input;
  // IMAGE (marketability 0-100): the size of his spotlight — score, caps, big moments, and natural flair.
  const imageScore = clamp(Math.round(careerScore / 12 + caps * 4 + bigWins * 2 + flair * 1.5), 0, 100);
  const imageTier = imageScore >= 80 ? 'Global icon' : imageScore >= 60 ? 'Household name' : imageScore >= 40 ? 'Rising name' : imageScore >= 20 ? 'Known locally' : 'Unknown quantity';

  // REPUTATION (professional ↔ controversial): what he's KNOWN for, read from his style over the career.
  const pro = (tags.teamwork ?? 0) + (tags.leadership ?? 0) + (tags.composure ?? 0);
  const edgy = (tags.aggression ?? 0) + (tags.flair ?? 0) * 0.5;
  const repScore = Math.round((100 * (pro - edgy)) / (pro + edgy + 1));
  const edge: 'clean' | 'edgy' = repScore < -8 ? 'edgy' : 'clean';
  const repLabel = repScore >= 40 ? 'Model professional' : repScore >= 12 ? 'Respected pro' : repScore >= -8 ? 'Grounded' : repScore >= -40 ? 'Divisive figure' : 'Firebrand';

  // ENDORSEMENTS (item 5): count + tier scale with image; the pool matches his reputation; each carries an
  // obligation/trade-off. Seeded pick, stable per career.
  const count = imageScore >= 70 ? 3 : imageScore >= 45 ? 2 : imageScore >= 22 ? 1 : 0;
  const pool = edge === 'edgy' ? EDGY_BRANDS : CLEAN_BRANDS;
  const tier: Endorsement['tier'] = imageScore >= 75 ? 'Global' : imageScore >= 45 ? 'National' : 'Local';
  const tierMult = tier === 'Global' ? 6 : tier === 'National' ? 3 : 1;
  const endorsements: Endorsement[] = [];
  const used = new Set<number>();
  for (let i = 0; i < count; i++) {
    let pi = hash32(seed, 4100 + i) % pool.length;
    while (used.has(pi) && used.size < pool.length) pi = (pi + 1) % pool.length;
    used.add(pi);
    const b = pool[pi];
    const payout = Math.round((120 + (imageScore * 6)) * tierMult * (0.8 + frac(hash32(seed, 4200 + i), 1) * 0.5));
    endorsements.push({ brand: b.brand, category: b.category, tier, payout, obligation: b.obligation });
  }

  // BOOTS (item 7): collectibles unlocked by milestones — owned = conditions met; next = the closest unmet.
  const met = (b: typeof BOOT_CATALOG[number]) =>
    (b.needCaps == null || caps >= b.needCaps) && (b.needBigWin == null || bigWins > 0) &&
    (b.needScore == null || careerScore >= b.needScore) && (b.needImage == null || imageScore >= b.needImage);
  const owned = BOOT_CATALOG.filter(met).map(({ id, name, edge: e, unlock }) => ({ id, name, edge: e, unlock }));
  const nextBoot = BOOT_CATALOG.find((b) => !met(b));
  let next: OffPitch['boots']['next'] = null;
  if (nextBoot) {
    const target = nextBoot.needScore ?? (nextBoot.needCaps != null ? nextBoot.needCaps : nextBoot.needImage ?? 1);
    const progress = nextBoot.needScore != null ? careerScore : nextBoot.needCaps != null ? caps : nextBoot.needImage != null ? imageScore : (bigWins > 0 ? 1 : 0);
    next = { boot: { id: nextBoot.id, name: nextBoot.name, edge: nextBoot.edge, unlock: nextBoot.unlock }, progress: Math.min(progress, target), target };
  }

  // RISKY LIFESTYLE (item 6): an occasional temptation beat — edgier players are courted more often. Seeded,
  // presentational (the real choice rides the career's life-event card play); a moral-hazard flavour layer.
  const tGate = hash32(seed, 5300 + turn) % 100;
  const tempted = tGate < (edge === 'edgy' ? 26 : 12);
  const TEMPT = [
    { kind: 'gamble', title: 'The card game', blurb: 'A high-stakes card game in the players’ lounge — a week’s wages on the table. Easy money, or a story you don’t want written.' },
    { kind: 'bribe', title: 'A quiet word', blurb: 'A stranger offers a fat envelope to "take it easy" in a dead-rubber game. No one would ever know… except you.' },
    { kind: 'nightlife', title: 'One more night out', blurb: 'The lads want a big night before a huge week. Fun and bonding — or a back-page photo and a heavy-legged performance.' },
    { kind: 'invest', title: 'A can’t-miss tip', blurb: 'A mate swears a risky investment is a sure thing. Double your money, or learn an expensive lesson about "sure things".' },
  ];
  const temptation = tempted ? TEMPT[hash32(seed, 5400 + turn) % TEMPT.length] : null;

  return {
    image: { score: imageScore, tier: imageTier },
    reputation: { score: repScore, label: repLabel, edge },
    endorsements, boots: { owned, next }, temptation,
  };
}
