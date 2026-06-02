"use server";

import { revalidatePath } from "next/cache";
import type { Address } from "viem";
import {
  createClaim,
  ownerRead,
  verifierRead,
  setAccess,
  isGranted,
} from "@/lib/cdr/claims";
import { listClaims, listClaimsForVerifier } from "@/lib/store";
import { verifier, REVOCABLE_CONDITION_ADDRESS } from "@/lib/cdr/client";
import type { Audience, ClaimType, PolicyKind, ReadResult } from "@/lib/types";

// NOTE: CDR work runs on the Node runtime (the SDK is not edge-compatible).
// The `runtime = "nodejs"` segment config lives in the page files that call
// these actions — a "use server" module may only export async functions.

export async function createClaimAction(form: FormData): Promise<void> {
  const type = form.get("type") as ClaimType;
  const label = String(form.get("label") ?? "").trim();
  const value = String(form.get("value") ?? "").trim();
  const audienceRaw = String(form.get("audience") ?? "self").trim();
  const kind = (String(form.get("kind") ?? "self") as PolicyKind) || "self";

  const audience: Audience =
    audienceRaw === "self" ? "self" : (audienceRaw as `0x${string}`);
  const ttlRaw = Number(form.get("ttl"));
  const ttlSeconds = Number.isFinite(ttlRaw) && ttlRaw > 0 ? ttlRaw : undefined;

  if (!label || !value) throw new Error("label and value are required");

  await createClaim({ type, label, value, audience, kind, ttlSeconds });
  revalidatePath("/app");
}

export async function ownerReadAction(uuid: number): Promise<ReadResult> {
  return ownerRead(uuid);
}

export async function verifierReadAction(uuid: number): Promise<ReadResult> {
  return verifierRead(uuid);
}

// ── Revocable allowlist controls ─────────────────────────────────────────────

export async function grantAction(verifierAddr: string): Promise<void> {
  await setAccess(verifierAddr as Address, true);
  revalidatePath("/app");
}

export async function revokeAction(verifierAddr: string): Promise<void> {
  await setAccess(verifierAddr as Address, false);
  revalidatePath("/app");
}

export async function isGrantedAction(verifierAddr: string): Promise<boolean> {
  return isGranted(verifierAddr as Address);
}

export async function revocableEnabledAction(): Promise<boolean> {
  return Boolean(REVOCABLE_CONDITION_ADDRESS);
}

// ── Misc ─────────────────────────────────────────────────────────────────────

export async function listClaimsAction() {
  return listClaims();
}

export async function getVerifierAddressAction(): Promise<string> {
  return verifier().address;
}

export async function listDisclosedToVerifierAction() {
  return listClaimsForVerifier(verifier().address);
}
