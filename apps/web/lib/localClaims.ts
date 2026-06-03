// Per-owner claim metadata, stored in the browser (localStorage). In self-
// custody there's no server holding your data — the encrypted payload lives in
// the CDR vault on-chain, and this lightweight metadata stays on your device.
// Keyed by owner address so different connected wallets see their own claims.

import type { Claim } from "./types";

const keyFor = (owner: string) => `cryptid:claims:${owner.toLowerCase()}`;

export function listClaims(owner: string): Claim[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(keyFor(owner)) ?? "[]") as Claim[];
  } catch {
    return [];
  }
}

export function addClaim(owner: string, claim: Claim): void {
  const all = listClaims(owner);
  all.unshift(claim);
  localStorage.setItem(keyFor(owner), JSON.stringify(all));
}

export function removeClaim(owner: string, id: string): void {
  const all = listClaims(owner).filter((c) => c.id !== id);
  localStorage.setItem(keyFor(owner), JSON.stringify(all));
}
