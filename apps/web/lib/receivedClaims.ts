// Verifier inbox: claims that have been disclosed to and decrypted by this
// wallet. Stored in the verifier's browser (localStorage, keyed by their
// address) so a verifier keeps a record of what's been shared with them.

export interface ReceivedClaim {
  vaultUuid: number;
  type: string;
  label: string;
  value: string;
  issuer?: string; // present if the credential was issuer-signed
  verified?: boolean; // issuer signature checked out
  receivedAt: number;
}

const keyFor = (verifier: string) => `cryptid:received:${verifier.toLowerCase()}`;

export function listReceived(verifier: string): ReceivedClaim[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(keyFor(verifier)) ?? "[]") as ReceivedClaim[];
  } catch {
    return [];
  }
}

export function addReceived(verifier: string, claim: ReceivedClaim): void {
  const all = listReceived(verifier).filter((c) => c.vaultUuid !== claim.vaultUuid);
  all.unshift(claim);
  localStorage.setItem(keyFor(verifier), JSON.stringify(all));
}
