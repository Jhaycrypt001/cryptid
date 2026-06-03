# CryptId — Progress

Ticked after each phase ships. See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full design
and [README.md](./README.md) for run steps.

---

## ✅ Phase 0 — CDR SDK de-risk harness
- [x] Mirror the official cdr-skill client setup (`src/client.ts`)
- [x] Owner-only claim round-trip (`pnpm secret`)
- [x] Selective disclosure to a verifier (`pnpm disclose`)
- [x] `pnpm install` + `tsc --noEmit` pass — SDK API confirmed real
- [x] **Live threshold round-trip CONFIRMED on Aeneid** (`pnpm secret`, vault 4937 decrypted ✅)

## ✅ Phase 1 — CryptId wallet (`apps/web`)
- [x] Next.js 14 + Tailwind scaffold, builds & boots green
- [x] CDR isolated in `lib/cdr/` (server-side custody, swappable signer)
- [x] Issue encrypted claim (self / disclose-to-verifier)
- [x] Owner dashboard — decrypt your own claims
- [x] Verifier portal — decrypt only disclosed claims
- [x] WASM SDK bundles (kept external); graceful no-key state
- [x] **Selective disclosure CONFIRMED live** (`pnpm disclose`, vault 4938: verifier ✅, owner ❌)

## ✅ Phase 1.5 — Landing page + white/black redesign
- [x] Light theme across the whole app (paper #F2F2EE / ink #192837 / accent #7342E2)
- [x] Helvetica Now Display headings + Inter body (font @imports verified in built CSS)
- [x] Framer Motion fade-ups + Lucide icons added
- [x] Video-backed hero: navbar, mobile slide-in sheet, inline-icon heading, CTA
- [x] Light-rethemed dashboard, verifier portal, create form, claim cards, tabs
- [x] `tsc` + `build` green; `/` static, `/app` + `/verify` dynamic
- [x] Replaced hero video with a pure CSS/Motion animated background (no external asset)
- [x] Long-form landing rebuilt to the reference structure: eyebrow labels, numbered
      capability rows + monochrome diagrams, black process section w/ code, stats grid,
      bordered ecosystem grid, privacy + developer sections, closing CTA, multi-column footer
- [x] Black/white CTA treatment (ink primary buttons, accent used sparingly)
- [ ] Wire the real GitHub repo link (currently a placeholder)

## 🟡 Phase 2 — Custom condition contracts (Foundry) — built & deployed; not callable on Aeneid
- [x] `IReadCondition` interface (exact `checkReadCondition` shape from the SDK)
- [x] `TimeBoundReadCondition` (stateless — auto-expiring access)
- [x] `RevocableAllowlistReadCondition` (grant/revoke — the "money shot")
- [x] `forge build` + `forge test` green (8/8 passing)
- [x] `Deploy.s.sol` deploy script
- [x] **Deployed to Aeneid (2026-06-01):** TimeBound `0x6e2D615cB0A5BC59a2ceC644f7D7aB5dF5563b40`,
      Revocable `0x83c8d5650ebF8B01AE7c68D05bE008c4aa41dC2f` — bytecode verified, wired into `.env.local`
- [x] `pnpm revoke` harness: deploy → allocate → grant → read ✅ → revoke → read ❌
- [x] Wire grant/revoke into the wallet UI (revocable-disclosure claims + Grant/Revoke
      buttons with live granted-status; auto-hides when the contract isn't configured)
- [x] Time-bound disclosure wired into the wallet UI (duration picker + live expiry
      countdown on the claim card; auto-hides when the contract isn't configured)
- [x] **Confirmed live (negative result):** Aeneid's CDR precompile does NOT call arbitrary
      custom read conditions. Our contract returns `true` (verified via `cast call` after grant),
      yet the CDR read reverts (vault 4939). Only EOA + pre-deployed `LicenseReadCondition` work.
      → Revocable/time-bound disabled in `.env.local`; demo uses working EOA disclosure. Contracts
      remain as a ready design pending CDR support for custom conditions.

## ✅ Phase 2.5 — Newbie-proof UX
- [x] Plain-language "Create → Disclose → Decrypt" explainer on the dashboard
- [x] Owner's disclosed claims show "🔒 Locked to verifier … open Verifier portal" (no failing button)
- [x] Human-readable denial / timeout messages (no raw "reverted")
- [x] Production tone ("verifier", not "demo verifier")

## ✅ Phase 3 — Self-custody (the real product)
- [x] **Browser CDR proven** — SDK + WASM run client-side; user's MetaMask signs
      allocate/write/read (verified live, vault 4970 round-trip)
- [x] **Connect Wallet** — WalletProvider + ConnectButton, Aeneid auto-add/switch
- [x] No server custody — removed env-key server actions/client/store; CDR runs in-browser
- [x] Disclose to **any** wallet address (not a fixed verifier)
- [x] **Shareable link + QR**; link-driven verifier portal (connect → decrypt)
- [x] Claims stored client-side (localStorage, per owner address)
- [x] `/api/story` proxy for browser CORS; landing stays light (SDK code-split)
- [x] **Production wallet connect** — wagmi + RainbowKit (MetaMask, injected, and
      WalletConnect QR for any/mobile wallet); bridges wagmi's viem client into CDR
- [x] **Verifier request flow** (`/request`) — verifier asks for a claim via link/QR;
      dashboard pre-fills the form to disclose back
- [x] **Verifiable-credentials triangle** (inspired by Polygon ID / EAS / Disco):
      - Issuer (`/issue`) signs a credential (EIP-712, no gas) → import link/QR
      - Holder imports → signature embedded in the encrypted vault payload
      - Verifier decrypts → signature verified → "Issued & verified / issuer 0x…" badge
- [x] **Verifier inbox** — decrypted claims saved to "Shared with me" (per-verifier localStorage)
- [ ] Verify the new flows in-browser (your test) ⟵ next
- [ ] Persistent/indexed store (optional), mainnet when CDR mainnet ships

## ⬜ Submission polish
- [ ] Demo video + writeup; commit the self-custody refactor
- [ ] Encrypted-file claims (credential PDF via `uploadFile` → IPFS)
- [ ] Paid / token-gated verification (`LicenseReadCondition`) marketplace angle
- [ ] CryptId Agent with scoped encrypted memory
- [ ] Demo video + submission writeup
