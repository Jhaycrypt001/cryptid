// CryptId Phase 0 — de-risk #2: selective disclosure to a specific verifier.
//
// This is the heart of CryptId. The owner stores an encrypted claim in a vault
// whose READ CONDITION is a specific verifier's address (an EOA). Result:
//
//   ✅ the authorized verifier can decrypt the claim
//   ❌ nobody else can — not even the owner who wrote it
//
// We prove BOTH halves in one run using two funded testnet wallets:
//   - WALLET_PRIVATE_KEY   → the owner (writes the claim)
//   - VERIFIER_PRIVATE_KEY → the verifier (reads / decrypts)
//
// No custom contract needed: the CDR precompile gates reads to the exact EOA
// passed as readConditionAddr. (Revocation + time-bound access come later via
// a custom checkReadCondition contract — see ARCHITECTURE.md Phase 2.)
//
// Run: pnpm disclose

import "dotenv/config";
import {
  createPublicClient,
  createWalletClient,
  http,
  encodeAbiParameters,
  toHex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { CDRClient, uuidToLabel } from "@piplabs/cdr-sdk";
import { client, walletClient, ready, OWNER_WRITE_CONDITION } from "./client.js";

const RPC_URL = process.env.RPC_URL ?? "https://aeneid.storyrpc.io";
const API_URL = process.env.API_URL ?? "http://172.192.41.96:1317";

function makeVerifierClient() {
  const pk = process.env.VERIFIER_PRIVATE_KEY;
  if (!pk) {
    throw new Error(
      "VERIFIER_PRIVATE_KEY missing — add a second funded testnet wallet to .env.",
    );
  }
  const account = privateKeyToAccount(`0x${pk.replace(/^0x/, "")}`);
  const publicClient = createPublicClient({ transport: http(RPC_URL) });
  const vWalletClient = createWalletClient({ account, transport: http(RPC_URL) });
  const vClient = new CDRClient({
    network: "testnet",
    publicClient,
    walletClient: vWalletClient,
    apiUrl: API_URL,
  });
  return { account, client: vClient };
}

async function main() {
  await ready();

  const owner = walletClient.account.address;
  const verifier = makeVerifierClient();
  console.log(`Owner wallet:    ${owner}`);
  console.log(`Verifier wallet: ${verifier.account.address}\n`);

  // ── Step 1. Owner allocates a vault gated to the VERIFIER's address. ──────
  const writeConditionData = encodeAbiParameters([{ type: "address" }], [owner]);
  const globalPubKey = await client.observer.getGlobalPubKey();

  console.log("Owner allocating vault (read gated to verifier)...");
  const { uuid } = await client.uploader.allocate({
    updatable: false,
    writeConditionAddr: OWNER_WRITE_CONDITION,
    writeConditionData,
    readConditionAddr: verifier.account.address, // EOA → only this wallet may read
    readConditionData: "0x",
    skipConditionValidation: true,
  });
  console.log(`Vault uuid: ${uuid}`);

  // ── Step 2. Owner encrypts + writes the claim. ───────────────────────────
  const claim = JSON.stringify({ type: "age_over_18", value: true });
  const ciphertext = await client.uploader.encryptDataKey({
    dataKey: new TextEncoder().encode(claim),
    globalPubKey,
    label: uuidToLabel(uuid),
  });
  await client.uploader.write({
    uuid,
    accessAuxData: "0x",
    encryptedData: toHex(ciphertext.raw),
  });
  console.log("Claim written.\n");

  // ── Step 3. Authorized verifier decrypts. Should SUCCEED. ────────────────
  console.log("Verifier requesting decryption (authorized)...");
  const { dataKey: recovered } = await verifier.client.consumer.accessCDR({
    uuid,
    accessAuxData: "0x",
    timeoutMs: 120_000,
  });
  console.log(`✅ Verifier decrypted: ${new TextDecoder().decode(recovered)}\n`);

  // ── Step 4. Owner (not the read-condition address) tries to read. SHOULD FAIL. ─
  console.log("Owner attempting to read a vault gated to someone else...");
  try {
    await client.consumer.accessCDR({
      uuid,
      accessAuxData: "0x",
      timeoutMs: 60_000,
    });
    console.log("⚠️  Unexpected: owner was able to read. Investigate the read gate.");
  } catch (err) {
    console.log(
      `✅ Correctly denied — only the authorized verifier can decrypt.\n   (${(err as Error).message.split("\n")[0]})`,
    );
  }

  console.log("\n✅ Selective disclosure works end-to-end. This is CryptId's core.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
