// NO AUTHORED LINE MAY PRINT A RAW {token} AT THE PLAYER.
//
// Authored commentary lives as data in shared/src/commentary/pack_*.ts with {p}/{team}/{zone}/{opp}/{off}
// placeholders, substituted at draw time by fillCm. fillCm deliberately leaves an UNKNOWN token untouched
// rather than blanking it — right for debugging, lethal in production: 92 authored lines carried {opp} and
// exactly one of the 24 draw sites ever supplied it, so a player watching a match was shown a literal
// "{opp}" on saves, fouls, woodwork, corners and tackles.
//
// The set of fillable tokens is READ FROM THE RENDERER, not listed here. An earlier version of this probe
// hardcoded it and immediately flagged {off} and {name} as broken — they are not, the `sub` call site
// passes both. A probe whose expectations are maintained separately from the code drifts, and a false
// alarm costs more than the bug it imitates.
//
// Run: `npx tsx tools/playtest/commentary_tokens.ts`
import { readFileSync, readdirSync } from 'node:fs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };

const main = readFileSync('client/src/main.ts', 'utf8');

// What the renderer can fill. Parsing the vars object with a brace regex does not work: the surrounding
// arguments are template literals full of ${...} and brace matching walks straight into them. Each cpickNR
// call's vars object is its last argument, so take the last brace group on the line and split on commas.
const supplied = new Set<string>(['opp']);   // defaulted for every event inside cpickNR itself
// Match the distinctive tail of a cpickNR call — `, <salt>, '<key>', { vars }` — rather than scanning by
// line. Several calls span four or five lines with the vars object on the last of them, so a line-wise scan
// silently missed them (it reported {off} and {name} unfilled when the `sub` call passes both). The vars
// object itself never contains nested braces, so this capture is safe even though the surrounding
// arguments are template literals full of ${...}.
for (const m of main.matchAll(/,\s*\d+\s*,\s*'[\w]+'\s*,\s*\{([^{}]*)\}/g)) {
  for (const part of m[1].split(',')) {
    const k = part.trim().split(':')[0].trim();
    if (/^[A-Za-z_]\w*$/.test(k)) supplied.add(k);
  }
}

const dir = 'shared/src/commentary';
const used = new Map<string, number>();
for (const f of readdirSync(dir).filter((x) => /^pack_\d+\.ts$/.test(x))) {
  for (const m of readFileSync(`${dir}/${f}`, 'utf8').matchAll(/\{(\w+)\}/g)) {
    used.set(m[1], (used.get(m[1]) ?? 0) + 1);
  }
}

console.log('=== Authored commentary placeholders ===');
console.log(`  ..   authored: ${[...used.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `{${k}}x${n}`).join(' ')}`);
console.log(`  ..   renderer supplies: ${[...supplied].sort().map((k) => `{${k}}`).join(' ')}`);
ok(used.size > 0, 'the authored packs contain placeholders to check');
ok(supplied.size > 1, 'the renderer\'s fillable tokens were parsed out of main.ts');

for (const [tok, n] of [...used.entries()].sort((a, b) => b[1] - a[1])) {
  ok(supplied.has(tok), `{${tok}} (${n} line${n === 1 ? '' : 's'}) is a token the renderer fills`);
}

// The specific regression: cpickNR must DEFAULT opp, or those 92 lines break again the moment somebody
// adds a draw site without it — which is exactly how they broke the first time.
ok(/const withOpp = \{ opp: this\.cmOpp/.test(main),
   'cpickNR defaults {opp} rather than trusting each of its 24 call sites to remember');
ok(/this\.cmOpp = e\.teamIdx === 0 \? this\.awayName : this\.homeName/.test(main),
   'cmOpp is set per event from the side that is NOT acting');

console.log(fails ? `\n✗ ${fails} problem(s) — a player would see raw braces` : '\n✓ every authored placeholder resolves');
if (fails) process.exitCode = 1;
