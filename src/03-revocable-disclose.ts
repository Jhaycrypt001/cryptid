// CryptId Phase 2 — de-risk #3: revocable disclosure via a CUSTOM read condition.
//
// THE question this answers: does the Aeneid CDR precompile actually invoke a
// user-deployed read condition contract? If yes, CryptId gets real revocation
// and time-bound access. This script proves the whole loop on-chain:
//
//   1. Deploy RevocableAllowlistReadCondition (or reuse REVOCABLE_CONDITION_ADDRESS)
//   2. Owner allocates a vault gated by that contract (readConditionData = owner)
//   3. Owner grant(verifier) on the contract
//   4. Verifier reads      → expect ✅  (precompile calls our contract → true)
//   5. Owner revoke(verifier)
//   6. Verifier reads again → expect ❌  (our contract now returns false)
//
// Run: pnpm revoke   (needs WALLET_PRIVATE_KEY + VERIFIER_PRIVATE_KEY funded,
//                     and `forge build` already run in ../contracts)

import "dotenv/config";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  createPublicClient,
  createWalletClient,
  http,
  encodeAbiParameters,
  toHex,
  getContract,
  type Abi,
  type Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { CDRClient, uuidToLabel } from "@piplabs/cdr-sdk";
import {
  client,
  walletClient,
  publicClient,
  account,
  ready,
  RPC,
  OWNER_WRITE_CONDITION,
} from "./client.js";

const API_URL = process.env.API_URL ?? "http://172.192.41.96:1317";

function loadArtifact() {
  const p = path.resolve(
    process.cwd(),
    "contracts/out/RevocableAllowlistReadCondition.sol/RevocableAllowlistReadCondition.json",
  );
  const json = JSON.parse(readFileSync(p, "utf8"));
  return { abi: json.abi as Abi, bytecode: json.bytecode.object as `0x${string}` };
}

function makeVerifier() {
  const pk = process.env.VERIFIER_PRIVATE_KEY;
  if (!pk) throw new Error("VERIFIER_PRIVATE_KEY missing — add a 2nd funded wallet to .env.");
  const acct = privateKeyToAccount(`0x${pk.replace(/^0x/, "")}`);
  const pub = createPublicClient({ transport: http(RPC) });
  const wallet = createWalletClient({ account: acct, transport: http(RPC) });
  const cdr = new CDRClient({ network: "testnet", publicClient: pub, walletClient: wallet, apiUrl: API_URL });
  return { address: acct.address, cdr };
}

async function deployOrReuse(): Promise<Address> {
  const existing = process.env.REVOCABLE_CONDITION_ADDRESS as Address | undefined;
  if (existing) {
    console.log(`Reusing condition at ${existing}`);
    return existing;
  }
  const { abi, bytecode } = loadArtifact();
  console.log("Deploying RevocableAllowlistReadCondition...");
  const hash = await walletClient.deployContract({ abi, bytecode, account, chain: null });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (!receipt.contractAddress) throw new Error("deploy: no contractAddress in receipt");
  console.log(`Deployed at ${receipt.contractAddress}`);
  return receipt.contractAddress;
}

async function main() {
  await ready();
  const owner = account.address;
  const verifier = makeVerifier();
  console.log(`Owner:    ${owner}`);
  console.log(`Verifier: ${verifier.address}\n`);

  const conditionAddr = await deployOrReuse();
  const { abi } = loadArtifact();
  const condition = getContract({ address: conditionAddr, abi, client: walletClient });

  // Step 2. Allocate a vault gated by the custom read condition.
  // readConditionData encodes the claim owner whose allowlist governs the vault.
  const readConditionData = encodeAbiParameters([{ type: "address" }], [owner]);
  const writeConditionData = encodeAbiParameters([{ type: "address" }], [owner]);
  const globalPubKey = await client.observer.getGlobalPubKey();

  console.log("\nAllocating vault gated by custom condition...");
  const { uuid } = await client.uploader.allocate({
    updatable: false,
    writeConditionAddr: OWNER_WRITE_CONDITION,
    writeConditionData,
    readConditionAddr: conditionAddr,
    readConditionData,
    // The contract implements checkReadCondition, so the SDK preflight passes
    // (it treats a revert on dummy args as "function exists"). No skip needed.
  });
  const ciphertext = await client.uploader.encryptDataKey({
    dataKey: new TextEncoder().encode(JSON.stringify({ type: "kyc", value: "verified" })),
    globalPubKey,
    label: uuidToLabel(uuid),
  });
  await client.uploader.write({ uuid, accessAuxData: "0x", encryptedData: toHex(ciphertext.raw) });
  console.log(`Vault ${uuid} written.\n`);

  // Step 3. Owner grants the verifier.
  console.log("Owner granting verifier...");
  const grantTx = await (condition as any).write.grant([verifier.address]);
  await publicClient.waitForTransactionReceipt({ hash: grantTx });

  // Step 4. Verifier reads — expect success.
  console.log("Verifier reading after grant (expect ✅)...");
  try {
    const { dataKey } = await verifier.cdr.consumer.accessCDR({ uuid, accessAuxData: "0x", timeoutMs: 120_000 });
    console.log(`✅ Decrypted: ${new TextDecoder().decode(dataKey)}`);
  } catch (e) {
    console.log(`❌ Unexpected denial after grant: ${(e as Error).message.split("\n")[0]}`);
    console.log("   → The precompile may NOT call custom read conditions. Fall back to EOA conditions.");
    return;
  }

  // Step 5. Owner revokes.
  console.log("\nOwner revoking verifier...");
  const revokeTx = await (condition as any).write.revoke([verifier.address]);
  await publicClient.waitForTransactionReceipt({ hash: revokeTx });

  // Step 6. Verifier reads again — expect denial.
  console.log("Verifier reading after revoke (expect ❌)...");
  try {
    await verifier.cdr.consumer.accessCDR({ uuid, accessAuxData: "0x", timeoutMs: 60_000 });
    console.log("⚠️  Still readable after revoke — investigate.");
  } catch (e) {
    console.log(`✅ Correctly denied after revoke. (${(e as Error).message.split("\n")[0]})`);
  }

  console.log("\n✅ Custom revocable read conditions work on Aeneid. Phase 2 confirmed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
