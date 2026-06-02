// Shared CDR client setup used by every CryptId script.
//
// Step 1. Load env vars (private key + RPC URL).
// Step 2. Build a viem publicClient (reads) + walletClient (writes).
// Step 3. Wrap them in a CDRClient pointed at Aeneid testnet.
// Step 4. Initialize the WASM crypto module before any encrypt/decrypt call.
//
// This mirrors the official cdr-skill client setup exactly — it is the
// known-good baseline we de-risk against before building anything custom.

import "dotenv/config";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { CDRClient, initWasm } from "@piplabs/cdr-sdk";

const RPC_URL = process.env.RPC_URL ?? "https://aeneid.storyrpc.io";
const API_URL = process.env.API_URL ?? "http://172.192.41.96:1317";
const PK = process.env.WALLET_PRIVATE_KEY;

if (!PK) {
  throw new Error(
    "WALLET_PRIVATE_KEY missing — copy .env.example to .env and fill it in.",
  );
}

export const account = privateKeyToAccount(`0x${PK.replace(/^0x/, "")}`);

export const RPC = RPC_URL;

export const publicClient = createPublicClient({
  transport: http(RPC_URL),
});

export const walletClient = createWalletClient({
  account,
  transport: http(RPC_URL),
});

export const client = new CDRClient({
  network: "testnet",
  publicClient,
  walletClient,
  apiUrl: API_URL,
});

// Must be awaited once before any TDH2 encrypt/decrypt operation.
// Without it, encrypt/decrypt throw opaque WASM errors.
export async function ready() {
  await initWasm();
}

// Aeneid-deployed condition contracts (from the CDR skill reference).
export const OWNER_WRITE_CONDITION =
  "0x4C9bFC96d7092b590D497A191826C3dA2277c34B" as const;
export const LICENSE_READ_CONDITION =
  "0xC0640AD4CF2CaA9914C8e5C44234359a9102f7a3" as const;
export const LICENSE_TOKEN =
  "0xFe3838BFb30B34170F00030B52eA4893d8aAC6bC" as const;
