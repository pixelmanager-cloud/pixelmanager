// Client wallet layer (web3 Steps 1–2) — thirdweb v5, vanilla (no React).
// Connect an account (email in-app wallet or injected browser wallet), sign the
// server's sign-in nonce, and claim faucet tokens. The account we return is the
// raw thirdweb Account so it can both sign messages (Step 1) and send txs (Step 2).
import { createThirdwebClient, getContract, sendTransaction, prepareContractCall, type ThirdwebClient } from 'thirdweb';
import { inAppWallet, createWallet, type Account } from 'thirdweb/wallets';
import { preAuthenticate } from 'thirdweb/wallets/in-app';
import { claimTo } from 'thirdweb/extensions/erc20';
import { baseSepolia } from 'thirdweb/chains';

const clientId = (import.meta as any).env?.VITE_THIRDWEB_CLIENT_ID ?? '';
const TOKEN_ADDRESS = ((import.meta as any).env?.VITE_TOKEN_ADDRESS ?? '0x63EF99E736080519b2D8171FEa2bb3346a4Debd7') as `0x${string}`;
const NFT_ADDRESS = ((import.meta as any).env?.VITE_NFT_ADDRESS ?? '') as string; // set after PlayerNFT is deployed
export const walletConfigured = () => !!clientId;
export const nftConfigured = () => !!NFT_ADDRESS;

let _client: ThirdwebClient | null = null;
function client(): ThirdwebClient {
  if (!clientId) throw new Error('Wallet sign-in is not configured (set VITE_THIRDWEB_CLIENT_ID).');
  return (_client ??= createThirdwebClient({ clientId }));
}

/** Step 1 of email sign-in: send a one-time code to the address. */
export async function sendEmailCode(email: string): Promise<void> {
  await preAuthenticate({ client: client(), strategy: 'email', email });
}

/** Step 2 of email sign-in: connect with the emailed code → a signing account. */
export async function connectEmail(email: string, verificationCode: string): Promise<Account> {
  const wallet = inAppWallet();
  return wallet.connect({ client: client(), strategy: 'email', email, verificationCode });
}

/** Connect an injected browser wallet (MetaMask by default) → a signing account. */
export async function connectInjected(): Promise<Account> {
  const wallet = createWallet('io.metamask');
  return wallet.connect({ client: client() });
}

export const signMessage = (account: Account, message: string) => account.signMessage({ message });

/** Resume a previously-connected email/in-app wallet in this browser (no code re-entry). */
export async function autoConnectInApp(): Promise<Account | null> {
  try { return await inAppWallet().autoConnect({ client: client() }); } catch { return null; }
}

/** Mint a star PlayerNFT to the account (free testnet mint; costs gas). */
export async function mintPlayer(account: Account): Promise<string> {
  if (!NFT_ADDRESS) throw new Error('PlayerNFT is not configured (set VITE_NFT_ADDRESS).');
  const contract = getContract({ client: client(), chain: baseSepolia, address: NFT_ADDRESS as `0x${string}` });
  const tx = prepareContractCall({ contract, method: 'function mint() returns (uint256)' });
  const res = await sendTransaction({ transaction: tx, account });
  return res.transactionHash;
}

/** Faucet claim: pull `quantity` whole tokens from the Token Drop to the account. */
export async function claimTokens(account: Account, quantity = '1000'): Promise<string> {
  const contract = getContract({ client: client(), chain: baseSepolia, address: TOKEN_ADDRESS });
  const tx = claimTo({ contract, to: account.address, quantity });
  const res = await sendTransaction({ transaction: tx, account });
  return res.transactionHash;
}

export type { Account };
