import "server-only";
import { encodeAbiParameters, toHex, type Address } from "viem";
import { uuidToLabel } from "@piplabs/cdr-sdk";
import {
  owner,
  verifier,
  ready,
  publicClient,
  OWNER_WRITE_CONDITION,
  REVOCABLE_CONDITION_ADDRESS,
  TIMEBOUND_CONDITION_ADDRESS,
  REVOCABLE_ABI,
} from "./client";
import { addClaim } from "../store";
import type { Audience, Claim, ClaimType, PolicyKind, ReadResult } from "../types";

// Create an encrypted claim and store it in a CDR vault.
//   self      → read gated to the owner EOA
//   eoa       → read gated to the verifier EOA (permanent)
//   revocable → read gated to RevocableAllowlistReadCondition (grant/revoke)
export async function createClaim(input: {
  type: ClaimType;
  label: string;
  value: string; // plaintext claim value (kept < ~1024 bytes for inline CDR)
  audience: Audience;
  kind: PolicyKind;
  ttlSeconds?: number; // for timebound: how long access stays open
}): Promise<Claim> {
  await ready();
  const { client, address: ownerAddr } = owner();

  const writeConditionData = encodeAbiParameters([{ type: "address" }], [ownerAddr]);

  // Resolve the read condition from the policy kind.
  let readConditionAddr: Address;
  let readConditionData: `0x${string}` = "0x";
  let skipConditionValidation = true; // EOA conditions have no code
  let expiresAt: number | undefined;

  if (input.kind === "self") {
    readConditionAddr = ownerAddr;
  } else if (input.kind === "eoa") {
    readConditionAddr = input.audience as Address;
  } else if (input.kind === "revocable") {
    if (!REVOCABLE_CONDITION_ADDRESS) {
      throw new Error("REVOCABLE_CONDITION_ADDRESS not set. Deploy the contract first.");
    }
    readConditionAddr = REVOCABLE_CONDITION_ADDRESS;
    // The contract checks allowed[claimOwner][caller]; encode the owner.
    readConditionData = encodeAbiParameters([{ type: "address" }], [ownerAddr]);
    skipConditionValidation = false; // real contract: let preflight run
  } else {
    // timebound
    if (!TIMEBOUND_CONDITION_ADDRESS) {
      throw new Error("TIMEBOUND_CONDITION_ADDRESS not set. Deploy the contract first.");
    }
    const notBefore = Math.floor(Date.now() / 1000);
    const notAfter = notBefore + (input.ttlSeconds ?? 3600);
    readConditionAddr = TIMEBOUND_CONDITION_ADDRESS;
    // conditionData = abi.encode(verifier, notBefore, notAfter)
    readConditionData = encodeAbiParameters(
      [{ type: "address" }, { type: "uint64" }, { type: "uint64" }],
      [input.audience as Address, BigInt(notBefore), BigInt(notAfter)],
    );
    skipConditionValidation = false;
    expiresAt = notAfter * 1000;
  }

  const { uuid } = await client.uploader.allocate({
    updatable: false,
    writeConditionAddr: OWNER_WRITE_CONDITION,
    writeConditionData,
    readConditionAddr,
    readConditionData,
    skipConditionValidation,
  });

  // Encrypt locally against the DKG key, then write ciphertext on-chain.
  const globalPubKey = await client.observer.getGlobalPubKey();
  const payload = JSON.stringify({ type: input.type, value: input.value });
  const ciphertext = await client.uploader.encryptDataKey({
    dataKey: new TextEncoder().encode(payload),
    globalPubKey,
    label: uuidToLabel(uuid),
  });
  await client.uploader.write({
    uuid,
    accessAuxData: "0x",
    encryptedData: toHex(ciphertext.raw),
  });

  const claim: Claim = {
    id: crypto.randomUUID(),
    vaultUuid: uuid,
    type: input.type,
    label: input.label,
    audience: input.audience,
    kind: input.kind,
    expiresAt,
    createdAt: Date.now(),
  };
  await addClaim(claim);
  return claim;
}

// Decrypt a vault as a given actor. accessCDR sends a read tx; the precompile
// enforces the read condition. Wrong actor (or revoked access) => the read reverts.
async function read(actor: "owner" | "verifier", vaultUuid: number): Promise<ReadResult> {
  await ready();
  const { client } = actor === "owner" ? owner() : verifier();
  try {
    const { dataKey, txHash } = await client.consumer.accessCDR({
      uuid: vaultUuid,
      accessAuxData: "0x",
      timeoutMs: 120_000,
    });
    return { ok: true, plaintext: new TextDecoder().decode(dataKey), readTx: txHash };
  } catch (err) {
    return { ok: false, error: (err as Error).message.split("\n")[0] };
  }
}

export const ownerRead = (uuid: number) => read("owner", uuid);
export const verifierRead = (uuid: number) => read("verifier", uuid);

// ── Revocable allowlist controls (owner-only) ────────────────────────────────

function requireRevocable(): Address {
  if (!REVOCABLE_CONDITION_ADDRESS) {
    throw new Error("REVOCABLE_CONDITION_ADDRESS not set. Deploy the contract first.");
  }
  return REVOCABLE_CONDITION_ADDRESS;
}

// Grant or revoke a verifier on the owner's allowlist. Affects every revocable
// claim the owner has disclosed to that verifier.
export async function setAccess(verifierAddr: Address, allow: boolean): Promise<string> {
  const address = requireRevocable();
  const { walletClient } = owner();
  const hash = await walletClient.writeContract({
    address,
    abi: REVOCABLE_ABI,
    functionName: allow ? "grant" : "revoke",
    args: [verifierAddr],
    chain: null,
  });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

// Whether the owner currently allows a verifier (for UI state).
export async function isGranted(verifierAddr: Address): Promise<boolean> {
  if (!REVOCABLE_CONDITION_ADDRESS) return false;
  const { address: ownerAddr } = owner();
  return publicClient.readContract({
    address: REVOCABLE_CONDITION_ADDRESS,
    abi: REVOCABLE_ABI,
    functionName: "allowed",
    args: [ownerAddr, verifierAddr],
  });
}
