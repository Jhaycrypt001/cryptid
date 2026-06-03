// Issuer-signed credentials (EIP-712). A trusted issuer signs a typed message
// binding {subject, claimType, value, issuedAt}. The signature travels inside
// the encrypted claim payload, so the verifier (after decrypting) can confirm
// the value was attested by that issuer — not just self-asserted.

import { recoverTypedDataAddress, type Address, type WalletClient } from "viem";

const domain = { name: "CryptId", version: "1" } as const;

const types = {
  Credential: [
    { name: "subject", type: "address" },
    { name: "claimType", type: "string" },
    { name: "value", type: "string" },
    { name: "issuedAt", type: "uint256" },
  ],
} as const;

export interface SignedCredential {
  subject: Address;
  claimType: string;
  value: string;
  issuedAt: number; // unix seconds
  issuer: Address;
  sig: `0x${string}`;
}

export async function signCredential(
  walletClient: WalletClient,
  p: { subject: Address; claimType: string; value: string },
): Promise<SignedCredential> {
  const account = walletClient.account!;
  const issuedAt = Math.floor(Date.now() / 1000);
  const sig = await walletClient.signTypedData({
    account,
    domain,
    types,
    primaryType: "Credential",
    message: {
      subject: p.subject,
      claimType: p.claimType,
      value: p.value,
      issuedAt: BigInt(issuedAt),
    },
  });
  return { subject: p.subject, claimType: p.claimType, value: p.value, issuedAt, issuer: account.address, sig };
}

export async function verifyCredential(c: SignedCredential): Promise<boolean> {
  try {
    const signer = await recoverTypedDataAddress({
      domain,
      types,
      primaryType: "Credential",
      message: {
        subject: c.subject,
        claimType: c.claimType,
        value: c.value,
        issuedAt: BigInt(c.issuedAt),
      },
      signature: c.sig,
    });
    return signer.toLowerCase() === c.issuer.toLowerCase();
  } catch {
    return false;
  }
}

// Base64 helpers for passing a signed credential in a URL.
export function encodeCredential(c: SignedCredential): string {
  return btoa(JSON.stringify(c));
}
export function decodeCredential(s: string): SignedCredential | null {
  try {
    return JSON.parse(atob(s)) as SignedCredential;
  } catch {
    return null;
  }
}
