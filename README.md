# CryptId

**Prove it without revealing it.** Your identity, encrypted — you decide what each verifier learns.

CryptId turns every fact about you (age, KYC status, nationality, income, an API key) into an
**encrypted object you own**. You grant *one* verifier access to *one* fact; they decrypt only
that, and the lock is enforced on-chain by a decentralized validator network — not by any
company holding your data.

Built for the [CDR Hackathon](https://build.usecdr.dev) on
[Story Confidential Data Rails](https://docs.story.foundation/developers/cdr-sdk/overview).
Live on the **Aeneid testnet**.

---

## The problem

To prove you're over 18, you hand over your whole ID — and it lands in a database that
eventually leaks. You over-share, and you trust a company to keep the rest safe. They don't.

## What CryptId does

The safety-deposit-box version: you put a single fact in a box, set the lock so **only one
specific person's key** opens it, and a network of guards must *agree together* to open it —
no single guard can peek. The verifier sees a green ✅ "over 18", never your birthday or
address.

- **Encrypted claims** — each fact is encrypted client-side under the validator network's DKG
  key. No server, and no single validator, ever holds the plaintext.
- **Selective disclosure** — share one claim with one verifier's wallet. Only that address can
  ever decrypt it.
- **On-chain access control** — the read condition is enforced by validators, not a backend.
- **Composable** — claims are open on-chain objects other apps can build on.

## Live on Aeneid (verified on-chain)

Every core flow is proven end-to-end on the live testnet:

| Flow | Evidence |
|---|---|
| Encrypt → write → threshold-decrypt | vault `4937` decrypted back to plaintext ✅ |
| Disclose to a verifier | vault `4938`: verifier decrypts ✅, owner (not the gated address) refused ❌ |

Deployer/owner: `0x9dbd4FFfF70FF804c17A276186738Eb596322C30`.

---

## How it works

1. **Create** — your claim is TDH2-encrypted in the browser against the validator DKG public
   key, then written to a CDR vault on-chain. Plaintext never leaves your device.
2. **Disclose** — the vault's *read condition* is set to a verifier's address. That condition
   *is* your disclosure policy.
3. **Decrypt** — the verifier submits a read request; a **threshold** of validators each return
   a partial decryption (inside TEEs), combined locally into the claim. Anyone who doesn't
   satisfy the condition is refused on-chain.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full design and [PROGRESS.md](./PROGRESS.md)
for build status.

## What works today vs. roadmap

**Working live on Aeneid:**
- Owner-only claims, and selective disclosure to a specific verifier (EOA-gated, enforced
  on-chain).

**Designed, deployed & unit-tested, but blocked by the platform:**
- **Revocable** and **time-bound** disclosure are implemented as custom condition contracts
  (`contracts/`, 8/8 tests passing) and deployed to Aeneid — but the current CDR precompile
  **does not invoke arbitrary user-deployed read conditions** (confirmed empirically: our
  contract returns `true`, yet the CDR read still reverts). They're ready for when CDR opens
  that up. See the finding in [PROGRESS.md](./PROGRESS.md).

**Toward production:**
- Self-custody (connect your own wallet instead of a server key), a verifier request/approve
  flow, a real database, and mainnet when CDR mainnet + production-grade confidentiality ship.

> ⚠️ Aeneid is a testnet — **not** production-grade confidentiality. Don't store real secrets.

---

## Run it

Requires Node 22+, pnpm, and a funded Aeneid wallet ([faucet](https://aeneid.faucet.story.foundation/)).

### The wallet app
```bash
cd apps/web
cp .env.example .env.local      # add WALLET_PRIVATE_KEY (+ VERIFIER_PRIVATE_KEY for /verify)
pnpm install
pnpm dev                        # http://localhost:3000
```
- **My claims** (`/app`) — issue a claim; tick "Disclose to verifier" to lock it to the verifier.
- **Verifier portal** (`/verify`) — decrypt only the claims disclosed to you.

### The de-risk harness (proves the raw CDR flows)
```bash
cp .env.example .env            # WALLET_PRIVATE_KEY + VERIFIER_PRIVATE_KEY
pnpm install
pnpm secret                     # owner-only encrypt → decrypt round-trip
pnpm disclose                   # verifier decrypts ✅, owner refused ❌
```

### Condition contracts (Foundry)
```bash
cd contracts
forge build && forge test       # 8/8 passing
```

## Repository layout
```
cryptid/
├── apps/web/        Next.js wallet (landing, My claims, Verifier portal)
│   └── lib/cdr/     the only module that touches @piplabs/cdr-sdk
├── contracts/       Foundry: TimeBound + RevocableAllowlist read conditions
├── src/             de-risk harness scripts (secret / disclose / revoke)
├── ARCHITECTURE.md  full design
└── PROGRESS.md      build status + the custom-conditions finding
```

## Built with
Story L1 · Confidential Data Rails (`@piplabs/cdr-sdk`) · TDH2 threshold encryption · SGX TEEs ·
Next.js · viem · Foundry

## License
MIT
