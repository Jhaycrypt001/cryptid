// Shared domain types for CryptId. No server-only imports here so both client
// and server components can use them.

export type ClaimType =
  | "dob"
  | "age_over_18"
  | "nationality"
  | "kyc"
  | "income"
  | "credential"
  | "apiKey";

// Who can decrypt a claim. "self" => read-gated to the owner's wallet.
// Otherwise an explicit verifier address the claim was disclosed to.
export type Audience = "self" | `0x${string}`;

// How the read condition is enforced:
//   self      — owner EOA (only the owner reads)
//   eoa       — verifier EOA (permanent disclosure, not revocable)
//   revocable — RevocableAllowlistReadCondition contract (grant/revoke)
//   timebound — TimeBoundReadCondition contract (auto-expiring window)
export type PolicyKind = "self" | "eoa" | "revocable" | "timebound";

export interface Claim {
  id: string; // local uuid for UI
  vaultUuid: number; // CDR vault id (on-chain, numeric)
  type: ClaimType;
  label: string; // human label, e.g. "Date of birth"
  audience: Audience; // read condition target
  kind: PolicyKind; // how the read gate is enforced
  expiresAt?: number; // ms epoch; set for timebound claims
  createdAt: number;
}

export interface ClaimResult {
  claim: Claim;
  allocateTx?: string;
  writeTx?: string;
}

export interface ReadResult {
  ok: boolean;
  plaintext?: string;
  readTx?: string;
  error?: string;
}
