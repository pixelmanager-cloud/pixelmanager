// Client wallet layer (web3 Step 1) — thirdweb v5, vanilla (no React).
// Two ways to get an account: an email in-app wallet (no extension, great
// onboarding) or an injected browser wallet (MetaMask/Coinbase/Rabby). Either way
// we end up with an `account` that can `signMessage`, which is all Step 1 needs —
// no chain, no gas. The target chain (Base) only matters once we send txs (Step 2+).
import { createThirdwebClient, type ThirdwebClient } from 'thirdweb';
import { inAppWallet, createWallet } from 'thirdweb/wallets';
import { preAuthenticate } from 'thirdweb/wallets/in-app';

export interface ConnectedAccount { address: string; signMessage: (msg: string) => Promise<string> }

const clientId = (import.meta as any).env?.VITE_THIRDWEB_CLIENT_ID ?? '';
export const walletConfigured = () => !!clientId;

let _client: ThirdwebClient | null = null;
function client(): ThirdwebClient {
  if (!clientId) throw new Error('Wallet sign-in is not configured (set VITE_THIRDWEB_CLIENT_ID).');
  return (_client ??= createThirdwebClient({ clientId }));
}

const wrap = (account: { address: string; signMessage: (a: { message: string }) => Promise<string> }): ConnectedAccount =>
  ({ address: account.address, signMessage: (message) => account.signMessage({ message }) });

/** Step 1 of email sign-in: send a one-time code to the address. */
export async function sendEmailCode(email: string): Promise<void> {
  await preAuthenticate({ client: client(), strategy: 'email', email });
}

/** Step 2 of email sign-in: connect with the emailed code → a signing account. */
export async function connectEmail(email: string, verificationCode: string): Promise<ConnectedAccount> {
  const wallet = inAppWallet();
  const account = await wallet.connect({ client: client(), strategy: 'email', email, verificationCode });
  return wrap(account);
}

/** Connect an injected browser wallet (MetaMask by default) → a signing account. */
export async function connectInjected(): Promise<ConnectedAccount> {
  const wallet = createWallet('io.metamask');
  const account = await wallet.connect({ client: client() });
  return wrap(account);
}
