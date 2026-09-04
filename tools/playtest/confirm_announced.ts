// THE DIALOG THAT DESTROYS A BLOODLINE MUST SAY WHOSE.
//
// openConfirm built its overlay out of unlabelled divs: no role, no aria-modal, nothing tying the card to
// its title or to the one sentence that names the stakes. dialogify then moves focus to the first focusable
// element, which is #cf-no — so the entire announcement a screen-reader player got for "Delete <b>the
// Wilders</b>? This bloodline is gone for good — there's no undo." was "Cancel, button". The name of the
// family about to be erased was on screen and unreadable. The client demonstrably knows ARIA (the settings
// toggles hand-write role="switch"/aria-checked/aria-label), so this was a gap, not a house style.
//
// THIS PROBE DOES NOT GREP FOR THE ATTRIBUTES. Grepping passes on `aria-labelledby="cf-titel"` and on the
// word appearing in a comment. It lifts openConfirm's real innerHTML template out of main.ts, evaluates it
// with the real delete-forever message deleteSave passes (also lifted from main.ts), and then computes the
// announcement the way a screen reader does: find the element carrying the dialog role, resolve its
// aria-labelledby/aria-describedby ids AGAINST THAT SAME RENDERED HTML, and read the text out of them.
// A typo'd id, a dropped id attribute or a role on the wrong node all leave the announcement empty.
//
// MUTATION-TESTED so the "names the bloodline" assertion cannot be vacuous: deleting `id="cf-msg"` from the
// template, pointing aria-describedby at a non-existent id, and swapping the role back to a bare div each
// turn it red; renaming the save in the fixture changes the printed announcement.
//
// Run: `npx tsx tools/playtest/confirm_announced.ts`
import { readFileSync } from 'node:fs';

let fails = 0;
const ok = (c: boolean, m: string) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) fails++; };
const src = readFileSync('client/src/main.ts', 'utf8');

console.log('=== The delete-forever confirm announces itself, and names what dies ===');

/** The body of a method, brace-matched from its signature. */
function bodyOf(signature: string): string {
  const at = src.indexOf(signature);
  if (at < 0) return '';
  let depth = 0;
  for (let i = src.indexOf('{', at); i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) return src.slice(at, i + 1); }
  }
  return '';
}

const confirmBody = bodyOf('private openConfirm(message: string, confirmLabel: string, onYes: () => void)');
ok(confirmBody.length > 0, 'openConfirm still exists (the single helper every destructive dialog goes through)');
const deleteBody = bodyOf('private deleteSave(id: string)');
ok(/this\.openConfirm\(/.test(deleteBody), 'deleting a save still goes through it');

// ── render the real thing ────────────────────────────────────────────────────────────────────────────
// The message, lifted from deleteSave and evaluated against a save with a name a human would recognise.
const msgAt = deleteBody.indexOf('this.openConfirm(`');
const msgTpl = msgAt < 0 ? '' : deleteBody.slice(msgAt + 'this.openConfirm('.length,
                                                deleteBody.indexOf('`', msgAt + 'this.openConfirm(`'.length) + 1);
const message = msgTpl ? String(new Function('save', `return ${msgTpl}`)({ name: 'the Wilders' })) : '';
console.log(`  ..   delete message: ${message}`);
ok(/Wilders/.test(message) && /undo/i.test(message), 'the delete message names the save and says there is no undo');

// The template, lifted from openConfirm and evaluated with that message.
const tplAt = confirmBody.indexOf('ov.innerHTML =');
const tplEnd = confirmBody.indexOf('`;', tplAt);
const tpl = tplAt < 0 || tplEnd < 0 ? '' : confirmBody.slice(tplAt + 'ov.innerHTML ='.length, tplEnd + 1);
const html = tpl ? String(new Function('message', 'confirmLabel', `return ${tpl}`)(message, 'Delete forever')) : '';
// If this ever renders nothing, every assertion below would be measuring an empty string.
ok(html.includes('Cancel') && html.includes('Delete forever'),
   'openConfirm\'s markup was rendered from source (both buttons are in it)');

// ── read it back the way a screen reader does ────────────────────────────────────────────────────────
/** Text content of the element carrying `id`, tags stripped, depth-matched so nesting cannot truncate it. */
function textOfId(id: string): string {
  const open = new RegExp(`<([a-z]+)([^>]*\\bid="${id}"[^>]*)>`, 'i').exec(html);
  if (!open) return '';
  const tag = open[1].toLowerCase();
  let depth = 1, i = open.index + open[0].length;
  const start = i;
  while (i < html.length && depth > 0) {
    if (html.startsWith(`<${tag}`, i)) depth++;
    else if (html.startsWith(`</${tag}`, i)) { depth--; if (!depth) break; }
    i++;
  }
  return html.slice(start, i).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

const dialogTag = /<[a-z]+[^>]*\brole="(dialog|alertdialog)"[^>]*>/i.exec(html);
ok(dialogTag !== null, 'the confirm card carries a dialog role — without one it is an anonymous stack of divs');
const tag = dialogTag?.[0] ?? '';
const role = dialogTag?.[1] ?? '(none)';
const attr = (name: string) => (new RegExp(`\\b${name}="([^"]*)"`, 'i').exec(tag)?.[1] ?? '');

ok(role === 'alertdialog',
   `it is an alertdialog, not a plain dialog: this message interrupts and demands an answer, and its ` +
   `description is announced with it (got role="${role}")`);
ok(attr('aria-modal') === 'true', 'aria-modal="true" — the page behind it is not part of this decision');

const name = attr('aria-labelledby').split(/\s+/).filter(Boolean).map(textOfId).join(' ').trim();
const desc = attr('aria-describedby').split(/\s+/).filter(Boolean).map(textOfId).join(' ').trim();
console.log(`  ..   announced as: role=${role} name="${name}" desc="${desc}"`);
// Resolution against the rendered HTML is the load-bearing step: a labelledby pointing at an id that is not
// there returns '' here and fails, exactly as a screen reader would find nothing to read.
ok(name.length > 0, 'aria-labelledby resolves to a real element in the same markup (the title is announced)');
ok(desc.length > 0, 'aria-describedby resolves to a real element in the same markup (the message is announced)');
ok(/Wilders/.test(`${name} ${desc}`), 'the announcement NAMES THE BLOODLINE about to be destroyed');
ok(/undo/i.test(`${name} ${desc}`), '...and says there is no undo');

// The announcement only ever happens because focus is moved into the overlay. If dialogify stops doing
// that, the ARIA above is correct and never spoken.
const dialogify = bodyOf('private dialogify(ov: HTMLElement, onClose?: () => void): () => void');
ok(/focusables\(\)\[0\]\?\.focus\(\)/.test(dialogify), 'dialogify still moves focus into the overlay, which is what triggers the announcement');

console.log(fails ? `\n✗ ${fails} — the delete-forever dialog does not announce what it is about to destroy`
                  : '\n✓ the confirm announces itself, and the family name is in what gets read out');
if (fails) process.exitCode = 1;
