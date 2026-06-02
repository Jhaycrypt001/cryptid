# CryptId — Architecture

**Confidential, composable identity rails.** A self-sovereign identity wallet where every
fact about you (age, nationality, KYC status, medical record, income proof, API credential)
is an **encrypted, programmable on-chain object** you own. You grant verifiers *scoped,
conditional, revocable* access to individual claims — they learn only what they need, the
raw data is never exposed, and access is enforced on-chain.

Built on **Story Confidential Data Rails (CDR)** — `@piplabs/cdr-sdk` v0.2.1, Aeneid testnet.

---

## 1. The core idea (one sentence)

> Selective disclosure as a primitive: each identity claim is a CDR vault; the **Read
> Condition** *is* the disclosure policy; verifiers decrypt only what you authorize, only
> while you authorize it.

This maps directly onto CDR's model — we are not bending the primitive, we are using it for
exactly what it was designed for. Every CryptId feature is "a vault + a condition."

### Why this wins
Hits **four** of the hackathon's target buckets at once:
- Identity app with programmable privacy ✅ (the core)
- Data marketplace / subscription access ✅ (sell verified credentials, paid verification)
- Private AI agent with encrypted memory ✅ (the optional "CryptId Agent")
- Confidential coordination ✅ (multi-party / delegated verification)

---

## 2. How CDR maps to CryptId

| CryptId concept            | CDR primitive                                              |
|----------------------------|------------------------------------------------------------|
| An identity claim          | A **vault** (small secret via `uploadCDR`, or file via `uploadFile`) |
| "Who can see this claim"   | The vault's **Read Condition**                             |
| "Who can update this claim"| The vault's **Write Condition** (`ownerOnly` for self-issued) |
| Issuer-signed credential   | Large doc: AES-encrypt → IPFS, wrap AES key in CDR vault    |
| Verifier requests access   | `consumer` submits read request → validated against condition → threshold partials |
| Time-limited disclosure    | Custom condition contract: `TimeBoundReadCondition`        |
| One-time / N-time access   | Custom condition contract: `QuotaReadCondition`            |
| Paid verification          | `conditions.tokenGate()` or `PaymentReadCondition`         |
| Revocation                 | `RevocableAllowlistCondition` (owner flips a mapping)      |
| Licensed credential resale | IP-gated flow (`LicenseReadCondition`, license token)      |

---

## 3. System layers

```
┌──────────────────────────────────────────────────────────────────────┐
│  CLIENT — CryptId Wallet (Next.js + React, runs encryption in-browser) │
│  • Claim composer / vault manager      • Disclosure request inbox       │
│  • Verifier portal (request + decrypt) • QR / deep-link disclosure flow │
└───────────────┬────────────────────────────────────────┬───────────────┘
                │  @piplabs/cdr-sdk (uploader/observer/consumer)           │
                ▼                                          ▼
┌──────────────────────────────┐        ┌────────────────────────────────┐
│  STORY L1 (Aeneid testnet)    │        │  OFF-CHAIN STORAGE              │
│  • CDR vault registry          │        │  • IPFS / Arweave: AES-        │
│  • CryptId condition contracts │        │    encrypted credential docs   │
│    - TimeBoundReadCondition    │        │  (ciphertext only; keys live   │
│    - QuotaReadCondition        │        │   in CDR vaults)               │
│    - RevocableAllowlistCond.   │        └────────────────────────────────┘
│    - PaymentReadCondition      │
│  • (opt) Issuer registry / SBT │
└───────────────┬────────────────┘
                │  read request + on-chain condition check
                ▼
┌──────────────────────────────────────────────────────────────────────┐
│  CDR VALIDATOR NETWORK  (provided by Story — you do NOT build this)     │
│  • DKG global public key (encrypt against)                              │
│  • Threshold partial decryptions inside SGX TEEs                        │
│  • No single validator ever holds the full key                          │
└──────────────────────────────────────────────────────────────────────┘
```

**Trust boundary:** plaintext exists only in the user's browser (encrypt) and the authorized
verifier's browser (combine partials → decrypt). Everything in between is ciphertext +
threshold key material. You build the top box and the condition contracts; CDR provides the
bottom box.

---

## 4. Components you build

### 4.1 CryptId Wallet (client)
- **Claim Composer** — issue a self-claim or import an issuer-signed credential; pick a
  disclosure policy (condition) per claim; calls `uploader.allocate()` then encrypts
  client-side against the DKG key and writes the vault.
- **Vault Manager** — list owned vaults, see current Read Condition, edit/revoke.
- **Disclosure Inbox** — incoming verifier requests; approve = set/extend condition.
- **Verifier Portal** — a verifier enters/scans a claim reference, submits a read request
  via `consumer`, collects threshold partials, decrypts client-side, shows the result.

### 4.2 Condition contracts (Solidity, deployed to Aeneid) — Phase 2

> **Reality check (confirmed from the CDR skill ref).** On Aeneid only **two** condition
> contracts are deployed: `OwnerWriteCondition` (`0x4C9b…c34B`) and `LicenseReadCondition`
> (`0xC064…f7a3`). Crucially, the **CDR precompile accepts a plain EOA** as a condition and
> gates the action to that exact address. So CryptId's *backbone needs no custom contracts*:
>
> - **Owner-only claim** → `readConditionAddr = owner EOA`.
> - **Disclose to verifier V** → `readConditionAddr = V's EOA` (only V can decrypt).
> - **Paid / token-gated** → `LicenseReadCondition` + a license token (marketplace angle, free).
>
> Custom condition contracts below are a **Phase 2 enhancement** for revoke + expiry. They
> must implement `checkReadCondition(...)`. **Unconfirmed:** whether the Aeneid precompile
> will call an arbitrary user-deployed read condition (the SDK preflight staticcalls
> `checkReadCondition`, which is a strong signal it will — but verify before depending on it).

Each implements the CDR Read condition interface (`abi.encode(...)` as `readConditionData`):

- `RevocableAllowlistCondition` — owner-controlled `mapping(owner => mapping(verifier => bool))`;
  instant revoke. **The revocation "money shot."**
- `TimeBoundReadCondition` — `(verifier, notBefore, notAfter)`, pure check on `block.timestamp`;
  access auto-expires. (Stateless — lowest risk custom contract, good first one to try.)
- `QuotaReadCondition` — `(verifier, maxReads)`; one-time or N-time disclosure.
- `PaymentReadCondition` — verifier must have paid a fee (or hold a token) to decrypt.

### 4.3 Issuer flow (optional, strong demo)
A trusted issuer (mock KYC provider) signs a credential, AES-encrypts the doc to IPFS, wraps
the AES key in a CDR vault whose Write Condition is the issuer and Read Condition is the
subject. Subject re-shares to verifiers by adjusting the condition. (Uses the
`uploadFile`/`downloadFile` flow.)

### 4.4 CryptId Agent (optional stretch)
An AI agent with a CDR-encrypted memory vault. The user grants the agent a scoped, revocable
Read Condition over specific claims so it can act on the user's behalf (e.g. "prove I'm over
18 to this dapp") without ever seeing unrelated data. Showcases the "private AI agent with
encrypted memory" bucket.

---

## 5. Key flows (sequences)

### A. Create a claim
```
User → Wallet: enter claim (e.g. "DOB = 1995-04-02"), choose policy "Allowlist: revocable"
Wallet → CDR: uploader.allocate({ updatable, writeConditionAddr=owner,
                                   readConditionAddr=RevocableAllowlistCondition, ... })
Wallet → CDR: fetch DKG global public key
Wallet (browser): TDH2-encrypt claim locally
Wallet → CDR: write ciphertext to vault on-chain
```

### B. Verifier reads a claim (selective disclosure)
```
Verifier → Wallet: request access to claim X
User → ConditionContract: add verifier to allowlist (or approve time-bound grant)
Verifier → CDR consumer: submit read request for vault X
CDR: on-chain condition check passes → validators return TEE partial decryptions
Verifier (browser): combine partials → recover plaintext claim → display
User → ConditionContract: revoke (optional) — future reads now fail
```

### C. Paid / marketplace verification
```
Verifier pays fee to PaymentReadCondition (or acquires gate token)
Verifier submits read request → condition checks payment → threshold decrypt
Revenue routed to claim owner / issuer
```

---

## 6. Tech stack

- **Frontend:** Next.js 14 (App Router) + React + TypeScript + Tailwind / shadcn-ui
- **Wallet / chain:** `viem` + `wagmi`, Aeneid testnet RPC
- **CDR:** `@piplabs/cdr-sdk` (uploader, observer, consumer)
- **Contracts:** Solidity + Foundry, deployed to Aeneid
- **Storage:** IPFS (web3.storage / Pinata) for encrypted docs
- **(opt) Agent:** Claude API + the CDR skill (`jacob-tucker/cdr-skill`)

---

## 7. Repository structure

```
cryptid/
├── ARCHITECTURE.md            ← this file
├── README.md
├── apps/
│   └── web/                   ← Next.js CryptId wallet + verifier portal
│       ├── app/
│       │   ├── claims/        ← composer, vault manager
│       │   ├── inbox/         ← disclosure requests
│       │   └── verify/        ← verifier portal
│       ├── components/
│       └── lib/cdr/           ← thin wrappers over @piplabs/cdr-sdk
│           ├── client.ts      ← configured uploader/observer/consumer
│           ├── claims.ts      ← createClaim / readClaim / revoke
│           └── conditions.ts  ← encode condition data for each contract
├── contracts/                 ← Foundry project
│   ├── src/
│   │   ├── TimeBoundReadCondition.sol
│   │   ├── QuotaReadCondition.sol
│   │   ├── RevocableAllowlistCondition.sol
│   │   └── PaymentReadCondition.sol
│   ├── script/Deploy.s.sol
│   └── test/
├── packages/
│   └── shared/                ← TS types: Claim, Policy, VaultRef, DisclosureRequest
└── docs/
    └── demo-script.md
```

---

## 8. Data model

```ts
type ClaimType = "dob" | "nationality" | "kyc" | "income" | "medical" | "credential" | "apiKey";

interface Claim {
  id: string;            // local id
  vaultId: string;       // CDR vault ref (on-chain)
  type: ClaimType;
  label: string;
  policy: Policy;        // which condition contract + params
  storage: "onchain" | "ipfs";  // small secret vs file
  ipfsCid?: string;      // if storage === "ipfs"
  createdAt: number;
}

type Policy =
  | { kind: "ownerOnly" }
  | { kind: "allowlist"; condition: Address; verifiers: Address[] }   // revocable
  | { kind: "timeBound"; condition: Address; verifier: Address; notBefore: number; notAfter: number }
  | { kind: "quota"; condition: Address; verifier: Address; maxReads: number }
  | { kind: "payment"; condition: Address; token: Address; price: bigint }
  | { kind: "ipGated"; condition: Address; licenseToken: Address; ipId: Address };

interface DisclosureRequest {
  claimId: string;
  verifier: Address;
  purpose: string;
  requestedPolicy: Policy;
  status: "pending" | "granted" | "denied" | "revoked";
}
```

---

## 9. MVP cut for the hackathon (deadline June 5 — ~4 days)

**Must ship (the demo):**
1. Wallet connect (Aeneid) + create a claim → vault via `uploadCDR` with `ownerOnly`.
2. `RevocableAllowlistCondition` deployed; grant + revoke a verifier from the UI.
3. Verifier portal: read a granted claim via `consumer`, decrypt client-side, show it; then
   show that **after revoke the same read fails**. ← this contrast is the money shot.
4. One end-to-end story: "Prove I'm over 18 to a bar's dapp, then revoke it."

**Should ship if time:**
5. `TimeBoundReadCondition` (auto-expiry) — visually compelling.
6. IPFS file flow for a "credential PDF" via `uploadFile`/`downloadFile`.

**Stretch / wow:**
7. `PaymentReadCondition` marketplace angle, or the CryptId Agent with scoped memory.

**Cut for now:** issuer registry/SBTs, multi-party coordination, mainnet, ZK add-ons.

---

## 10. Build order (suggested)

1. **Day 1** — Scaffold monorepo; get `@piplabs/cdr-sdk` talking to Aeneid; reproduce the
   docs' on-chain-secret example (allocate → encrypt → write → read). De-risk the SDK first.
2. **Day 2** — `RevocableAllowlistCondition` + deploy; wire `conditions.custom()` /
   `readConditionData` encoding; grant/revoke from a script.
3. **Day 3** — Wallet UI (composer + vault manager + verifier portal); full grant→read→revoke
   loop in the browser.
4. **Day 4** — `TimeBoundReadCondition`, polish, record demo, write README + submission.

**First de-risking task:** stand up the SDK and run the docs' three example flows verbatim
before building any UI. The threshold-decrypt round-trip working on Aeneid is the only real
unknown — prove it on Day 1.

### Phase 0 status (done)
The repo root currently holds the de-risk harness (mirrors the official cdr-skill setup):
- `src/client.ts` — known-good CDRClient setup + Aeneid condition addresses.
- `src/01-owner-secret.ts` (`pnpm secret`) — owner-only claim round-trip.
- `src/02-disclose-to-verifier.ts` (`pnpm disclose`) — selective disclosure: authorized
  verifier decrypts ✅, everyone else (incl. owner) is denied ❌. Needs a 2nd funded wallet.

`pnpm install` + `tsc --noEmit` both pass — the SDK API surface is confirmed. The only
remaining unknown is the live threshold round-trip, which needs a funded Aeneid wallet.

### Phase 1 status (done — needs live keys to demo)
`apps/web` — Next.js 14 wallet, server-side custody, CDR isolated in `lib/cdr/`:
- `lib/cdr/client.ts` — server-only CDRClient with two actors (owner + demo verifier).
- `lib/cdr/claims.ts` — `createClaim` (self / disclose-to-verifier), `ownerRead`, `verifierRead`.
- `lib/store.ts` — file-backed claim *metadata* store (plaintext never stored).
- `app/page.tsx` (My claims), `app/verify/page.tsx` (Verifier portal), `app/actions.ts`.

`pnpm build` ✅ (WASM SDK kept external via `serverComponentsExternalPackages`), boots ✅,
serves both routes ✅, degrades gracefully with no env. Confirmed real SDK quirk: vault
`uuid` is a **number**, not a string. Next: add live keys + demo, then Phase 2 contracts.

---

## 11. References
- CDR SDK overview: https://docs.story.foundation/developers/cdr-sdk/overview
- CDR announcement / architecture: https://www.story.foundation/blog/confidential-data-rails
- CDR skill (AI-agent examples): https://github.com/jacob-tucker/cdr-skill
- Hackathon: https://build.usecdr.dev
