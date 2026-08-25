// Wallet sign-in (Step 1 of the web3 plan) — prove ownership of an address by
// signing a server-issued nonce. No chain, no gas, no contracts: recover the
// signer from the signature and match it to the claimed address.
// EOA signatures (injected + thirdweb in-app wallets default to EOAs) verify
// offline here; smart-account (ERC-1271) verification would add a Base RPC call.
import { randomUUID } from 'node:crypto';
import { getAddress, isAddress, recoverMessageAddress } from 'viem';

const NONCE_TTL_MS = 10 * 60 * 1000; // a sign-in nonce is good for 10 minutes
const nonces = new Map<string, { nonce: string; exp: number }>(); // key = lowercased address

/** Normalise to a lowercased key; throws if not a valid address. */
export function addrKey(address: string): string {
  if (!isAddress(address)) throw new Error('bad address');
  return address.toLowerCase();
}

/** The exact human-readable message the wallet signs (rebuilt verbatim to verify). */
function buildMessage(address: string, nonce: string): string {
  return [
    'Pixel Manager — sign in',
    '',
    `Address: ${getAddress(address)}`,
    `Nonce: ${nonce}`,
    '',
    'Signing is free and proves you own this wallet. It is not a transaction.',
  ].join('\n');
}

/** Issue a fresh nonce for an address and return the message to sign. */
export function issueNonce(address: string): string {
  const key = addrKey(address);
  const nonce = randomUUID();
  nonces.set(key, { nonce, exp: Date.now() + NONCE_TTL_MS });
  return buildMessage(address, nonce);
}

/** Verify a signature against the outstanding nonce for an address; consume it on success. */
export async function verifyAndConsume(address: string, signature: string): Promise<boolean> {
  const key = addrKey(address);
  const rec = nonces.get(key);
  if (!rec || rec.exp < Date.now()) { nonces.delete(key); return false; }
  const message = buildMessage(address, rec.nonce);
  let recovered: string;
  try { recovered = await recoverMessageAddress({ message, signature: signature as `0x${string}` }); }
  catch { return false; }
  const ok = getAddress(recovered) === getAddress(address);
  if (ok) nonces.delete(key); // single-use
  return ok;
}

/** Short display form, e.g. 0x1234…cDeF (checksummed). */
export function shortAddr(address: string): string {
  const a = getAddress(address);
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}
