# CryptId — demo script

A ~2-minute walkthrough for a video or live presentation. The arc: **prove a fact to one
party, and watch the chain refuse everyone else.**

## Setup (before recording)
- `cd apps/web && pnpm dev` → open http://localhost:3000
- Have a funded `WALLET_PRIVATE_KEY` (owner) and `VERIFIER_PRIVATE_KEY` in `apps/web/.env.local`.
- Start on the landing page.

---

## 1. The hook (15s)
> "To prove you're over 18 today, you hand over your whole ID — and it ends up in a database
> that leaks. CryptId flips that: prove the fact, reveal nothing else."

Scroll the landing page briefly — hero, the "Create → Disclose → Decrypt" idea, the on-chain
enforcement. Click **Launch App**.

## 2. Create an owner-only claim (20s)
On **My claims**, walk through the 3-step explainer, then:
- Type **Age over 18**, Label **Over 18**, Value **true**, leave *Disclose* unchecked.
- **Create encrypted claim** → "Encrypting + writing on-chain…".
> "That value was encrypted in my browser and written to a vault on-chain. Nobody — no server,
> no single validator — holds the plaintext."
- Click **Decrypt** → after the validators return key shares → **✅ Decrypted: true**.
> "Only I can open my own claim."

## 3. Disclose to a verifier — the heart of it (40s)
- Create another claim, this time **check "Disclose to verifier"** (note the verifier address).
- **Create** → the card shows the badge **`permanent → 0x203B…`**.
- Click **Decrypt** on it as the owner → **🔒 Locked to the verifier**.
> "I disclosed this to one specific wallet. Watch — even I, the owner, can't open it now."
- Switch to the **Verifier portal** tab.
- The same claim is there → **Decrypt as verifier** → **✅ Decrypted: true**.
> "The verifier — and only the verifier — opens exactly this one fact. The lock is enforced
> on-chain by the validator network, not by us."

## 4. The payoff (15s)
> "Same vault, two wallets: refused for everyone, opened for the one party I chose. That's
> selective disclosure as a primitive — and it's running live on Story's Confidential Data
> Rails testnet right now."

## 5. Optional: depth (20s)
> "We also designed revocable and time-bound disclosure as on-chain condition contracts —
> deployed and unit-tested. We found the current CDR precompile doesn't yet call custom read
> conditions, so they're ready for when it does. The roadmap is self-custody and mainnet."

---

## On-chain receipts (to show or link)
- Owner-only round-trip: vault `4937`
- Disclosure: vault `4938` (verifier ✅ / owner ❌)
- Condition contracts on Aeneid: TimeBound `0x6e2D615cB0A5BC59a2ceC644f7D7aB5dF5563b40`,
  Revocable `0x83c8d5650ebF8B01AE7c68D05bE008c4aa41dC2f`

## Tips
- Decryption waits on validator partials — expect a 1–2 min spinner; pre-warm a claim before
  recording so the video stays tight.
- If a read shows a denial where you expect success, it's usually still finalizing — retry.
