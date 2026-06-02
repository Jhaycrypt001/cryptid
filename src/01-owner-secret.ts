// CryptId Phase 0 — de-risk #1: owner-only claim round-trip.
//
// This is the foundational proof: can THIS wallet store an encrypted claim in a
// CDR vault and decrypt it back? It maps directly to a CryptId "self claim"
// (e.g. your date of birth) that only you can read.
//
//   - Allocate a vault on-chain
//   - Encrypt the claim locally with the validator-network DKG public key
//   - Write the ciphertext on-chain
//   - Read it back: only the wallet that owns the vault can decrypt
//
// Conditions:
//   - Write: OwnerWriteCondition contract (gates writes to one address).
//   - Read:  the owner's EOA. The CDR precompile treats an EOA condition as
//            "only this exact address can perform the action", so no read
//            condition contract is needed.
//
// Run: pnpm secret

import { encodeAbiParameters, toHex } from "viem";
import { uuidToLabel } from "@piplabs/cdr-sdk";
import { client, walletClient, ready, OWNER_WRITE_CONDITION } from "./client.js";

async function main() {
  // Step 1. Initialize the WASM crypto module.
  await ready();

  const owner = walletClient.account.address;
  console.log(`Owner wallet: ${owner}`);

  // Step 2. Encode the write condition payload — just the owner address.
  const writeConditionData = encodeAbiParameters([{ type: "address" }], [owner]);

  // Step 3. Fetch the DKG public key. Encryption is done locally with this key.
  const globalPubKey = await client.observer.getGlobalPubKey();

  // Step 4. Allocate the vault. `skipConditionValidation: true` because our read
  // condition is an EOA, which doesn't implement the condition contract
  // interface — the SDK's preflight would reject it. The precompile itself
  // accepts EOAs and gates the read to that exact caller.
  console.log("Allocating vault...");
  const { uuid, txHash: allocateTx } = await client.uploader.allocate({
    updatable: false,
    writeConditionAddr: OWNER_WRITE_CONDITION,
    writeConditionData,
    readConditionAddr: owner,
    readConditionData: "0x",
    skipConditionValidation: true,
  });
  console.log(`Vault uuid:  ${uuid}`);
  console.log(`Allocate tx: ${allocateTx}`);

  // Step 5. Encrypt the claim locally with TDH2. The label binds the ciphertext
  // to this specific vault.
  const claim = JSON.stringify({ type: "dob", value: "1995-04-02" });
  const dataKey = new TextEncoder().encode(claim);
  const label = uuidToLabel(uuid);
  const ciphertext = await client.uploader.encryptDataKey({
    dataKey,
    globalPubKey,
    label,
  });

  // Step 6. Write the ciphertext on-chain.
  console.log("Writing ciphertext...");
  const { txHash: writeTx } = await client.uploader.write({
    uuid,
    accessAuxData: "0x",
    encryptedData: toHex(ciphertext.raw),
  });
  console.log(`Write tx:    ${writeTx}`);

  // Step 7. accessCDR submits a read request, collects partial decryptions from
  // validators, and combines them locally into the original plaintext.
  console.log("\nRequesting decryption...");
  const { dataKey: recovered, txHash } = await client.consumer.accessCDR({
    uuid,
    accessAuxData: "0x",
    timeoutMs: 120_000,
  });

  console.log(`Read tx:     ${txHash}`);
  console.log(`Decrypted:   ${new TextDecoder().decode(recovered)}`);
  console.log("\n✅ Owner-only round-trip works. CDR is de-risked.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
