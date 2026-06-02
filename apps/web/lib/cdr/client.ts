import "server-only";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { CDRClient, initWasm } from "@piplabs/cdr-sdk";

// The ONLY module that touches @piplabs/cdr-sdk. Server-side custody: signing
// keys come from env. To move to browser self-custody later, replace the
// walletClient transport here — nothing else changes.
//
// Two configured actors so a single app instance can demo both sides of
// selective disclosure: the owner (the CryptId user) and a demo verifier.

const RPC_URL = process.env.RPC_URL ?? "https://aeneid.storyrpc.io";
const API_URL = process.env.API_URL ?? "http://172.192.41.96:1317";

// Aeneid-deployed condition contracts (from the CDR skill reference).
export const OWNER_WRITE_CONDITION =
  "0x4C9bFC96d7092b590D497A191826C3dA2277c34B" as const;
export const LICENSE_READ_CONDITION =
  "0xC0640AD4CF2CaA9914C8e5C44234359a9102f7a3" as const;

// Our own Phase 2 contracts (set after `forge script Deploy` / `pnpm revoke`).
// When unset, the UI hides that disclosure mode and falls back to EOA conditions.
export const REVOCABLE_CONDITION_ADDRESS = (process.env.REVOCABLE_CONDITION_ADDRESS ||
  undefined) as `0x${string}` | undefined;
export const TIMEBOUND_CONDITION_ADDRESS = (process.env.TIMEBOUND_CONDITION_ADDRESS ||
  undefined) as `0x${string}` | undefined;

// Minimal ABI for the RevocableAllowlistReadCondition owner controls.
export const REVOCABLE_ABI = [
  {
    type: "function",
    name: "grant",
    inputs: [{ name: "verifier", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "revoke",
    inputs: [{ name: "verifier", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "allowed",
    inputs: [
      { name: "", type: "address" },
      { name: "", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
] as const;

export const publicClient = createPublicClient({ transport: http(RPC_URL) });

function buildActor(pk: string) {
  const account = privateKeyToAccount(`0x${pk.replace(/^0x/, "")}`);
  const walletClient = createWalletClient({ account, transport: http(RPC_URL) });
  const client = new CDRClient({
    network: "testnet",
    publicClient,
    walletClient,
    apiUrl: API_URL,
  });
  return { account, address: account.address, client, walletClient };
}

let _owner: ReturnType<typeof buildActor> | null = null;
let _verifier: ReturnType<typeof buildActor> | null = null;
let _wasmReady = false;

export function owner() {
  const pk = process.env.WALLET_PRIVATE_KEY;
  if (!pk) throw new Error("WALLET_PRIVATE_KEY missing. Set it in apps/web/.env.local");
  if (!_owner) _owner = buildActor(pk);
  return _owner;
}

export function verifier() {
  const pk = process.env.VERIFIER_PRIVATE_KEY;
  if (!pk)
    throw new Error("VERIFIER_PRIVATE_KEY missing. Set it in apps/web/.env.local");
  if (!_verifier) _verifier = buildActor(pk);
  return _verifier;
}

// Idempotent WASM init — safe to await before every operation.
export async function ready() {
  if (_wasmReady) return;
  await initWasm();
  _wasmReady = true;
}
