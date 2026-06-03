// Client-side CDR: the user's own wallet (MetaMask) signs every operation and
// encryption/decryption happens in the browser. This is the self-custody core.
// No env keys, no server signing. The Story-API is reached via the same-origin
// /api/story proxy to avoid browser CORS.

import {
  createPublicClient,
  http,
  encodeAbiParameters,
  toHex,
  type Address,
  type WalletClient,
} from "viem";
import { CDRClient, initWasm, uuidToLabel } from "@piplabs/cdr-sdk";
import { aeneid } from "../chain";
import type { Audience, ClaimType } from "../types";
import type { SignedCredential } from "../credential";

export const OWNER_WRITE_CONDITION =
  "0x4C9bFC96d7092b590D497A191826C3dA2277c34B" as const;
const RPC = "https://aeneid.storyrpc.io";

let wasmReady = false;
export async function ensureWasm() {
  if (!wasmReady) {
    await initWasm();
    wasmReady = true;
  }
}

// Build a CDR client from wagmi's viem wallet client (the connected wallet
// signs every tx). The Aeneid read client + the same-origin Story-API proxy
// are wired in here.
export function buildClient(walletClient: WalletClient): CDRClient {
  const publicClient = createPublicClient({ chain: aeneid, transport: http(RPC) });
  return new CDRClient({
    network: "testnet",
    publicClient,
    walletClient,
    apiUrl: `${window.location.origin}/api/story`,
  });
}

// Allocate + encrypt + write a claim. Two wallet signatures (allocate, write).
// Returns the on-chain vault id. readConditionAddr is the owner (self) or the
// verifier address the claim is disclosed to.
export async function createClaimOnChain(
  client: CDRClient,
  account: Address,
  input: { type: ClaimType; value: string; audience: Audience; credential?: SignedCredential },
): Promise<number> {
  await ensureWasm();
  const readConditionAddr = (
    input.audience === "self" ? account : input.audience
  ) as Address;

  const { uuid } = await client.uploader.allocate({
    updatable: false,
    writeConditionAddr: OWNER_WRITE_CONDITION,
    writeConditionData: encodeAbiParameters([{ type: "address" }], [account]),
    readConditionAddr,
    readConditionData: "0x",
    skipConditionValidation: true,
  });

  // The encrypted payload carries the value and, when present, the issuer's
  // signature so a verifier can confirm it on decrypt.
  const payload: Record<string, unknown> = { type: input.type, value: input.value };
  if (input.credential) {
    payload.subject = input.credential.subject;
    payload.issuer = input.credential.issuer;
    payload.issuedAt = input.credential.issuedAt;
    payload.sig = input.credential.sig;
  }

  const globalPubKey = await client.observer.getGlobalPubKey();
  const ciphertext = await client.uploader.encryptDataKey({
    dataKey: new TextEncoder().encode(JSON.stringify(payload)),
    globalPubKey,
    label: uuidToLabel(uuid),
  });
  await client.uploader.write({
    uuid,
    accessAuxData: "0x",
    encryptedData: toHex(ciphertext.raw),
  });
  return uuid;
}

export interface ReadOutcome {
  ok: boolean;
  plaintext?: string;
  error?: string;
}

// Submit a read request (one wallet signature) and combine validator partials.
export async function readVault(client: CDRClient, uuid: number): Promise<ReadOutcome> {
  await ensureWasm();
  try {
    const { dataKey } = await client.consumer.accessCDR({
      uuid,
      accessAuxData: "0x",
      timeoutMs: 120_000,
    });
    return { ok: true, plaintext: new TextDecoder().decode(dataKey) };
  } catch (e) {
    return { ok: false, error: (e as Error).message.split("\n")[0] };
  }
}
