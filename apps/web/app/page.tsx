import Link from "next/link";
import {
  ArrowRightCircle,
  ShieldCheck,
  DatabaseZap,
  KeyRound,
  Clock,
} from "lucide-react";
import { LandingHero } from "@/components/LandingHero";
import { SiteFooter } from "@/components/SiteFooter";

const MAX = "mx-auto max-w-[1280px] px-6";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-5 font-mono text-xs uppercase tracking-[0.22em] text-muted">
      {children}
    </p>
  );
}

const HERO_STATS = [
  { v: "$7B", l: "Decentralized identity market, 2026" },
  { v: "0", l: "Plaintext bytes stored off your device" },
  { v: "n-of-m", l: "Validators required to decrypt" },
  { v: "4", l: "Composable disclosure policies" },
];

const CAPABILITIES = [
  {
    n: "01",
    title: "Encrypted Claims",
    body: "Your DOB, KYC status, or API key is encrypted client-side under the validator DKG key and written to a vault. No server, and no single validator, ever holds the plaintext.",
    diagram: <RadarDiagram />,
  },
  {
    n: "02",
    title: "Selective Disclosure",
    body: "Disclose one fact to one verifier. They decrypt that claim and nothing else: your age, never your birthday; your KYC status, never your passport.",
    diagram: <NodesDiagram />,
  },
  {
    n: "03",
    title: "On-chain Access Control",
    body: "Every read runs through a condition the chain enforces: an address, a license token, an allowlist, or a time window. Change the policy, change who can read.",
    diagram: <BarsDiagram />,
  },
  {
    n: "04",
    title: "Revocable & Time-bound",
    body: "Grant a verifier today, revoke them tomorrow, or let access expire on its own. Custom condition contracts make privacy programmable.",
    diagram: <ToggleDiagram />,
  },
];

const STEPS = [
  {
    n: "01",
    title: "Encrypt locally",
    body: "Fetch the DKG public key and TDH2-encrypt your claim in the browser. Plaintext never leaves your device.",
  },
  {
    n: "02",
    title: "Bind a read condition",
    body: "Allocate a vault and attach a read condition: an EOA, a license token, or a revocable allowlist contract.",
  },
  {
    n: "03",
    title: "Disclose & decrypt",
    body: "An authorized verifier submits a read request; a threshold of validators return partial decryptions, combined locally into the claim.",
  },
];

const NUMBERS = [
  { v: "$7B", l: "Decentralized identity market, 2026" },
  { v: "0", l: "Plaintext ever stored off your device" },
  { v: "n-of-m", l: "Validator threshold to decrypt" },
  { v: "4", l: "Self · permanent · revocable · time-bound" },
];

const ECOSYSTEM = [
  { name: "Story L1", role: "Settlement" },
  { name: "Confidential Data Rails", role: "Encryption" },
  { name: "TDH2", role: "Threshold scheme" },
  { name: "SGX TEEs", role: "Validator compute" },
  { name: "viem", role: "Client" },
  { name: "Next.js", role: "App" },
  { name: "Foundry", role: "Conditions" },
  { name: "IPFS", role: "File storage" },
];

const EXPOSURE = [
  {
    icon: ShieldCheck,
    title: "Client-side encryption",
    body: "Plaintext is created and decrypted only in the browser.",
  },
  {
    icon: DatabaseZap,
    title: "No plaintext storage",
    body: "Vaults hold ciphertext; metadata holds no secrets.",
  },
  {
    icon: KeyRound,
    title: "On-chain conditions",
    body: "Reads are gated by contracts the chain enforces.",
  },
  {
    icon: Clock,
    title: "Revocable access",
    body: "Grant, revoke, or expire disclosure at any time.",
  },
];

export default function Landing() {
  return (
    <>
      <LandingHero />

      {/* Hero stats strip */}
      <section className={`${MAX} border-t border-edge py-10`}>
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {HERO_STATS.map((s) => (
            <div key={s.l}>
              <p className="font-heading text-2xl text-ink sm:text-3xl">{s.v}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Capabilities */}
      <section id="features" className={`${MAX} py-24`}>
        <Eyebrow>Protocol capabilities</Eyebrow>
        <h2 className="max-w-2xl font-heading text-3xl leading-tight tracking-tight text-ink sm:text-4xl">
          Identity governs access. Conditions govern terms.
        </h2>

        <div className="mt-12">
          {CAPABILITIES.map((c) => (
            <div
              key={c.n}
              className="grid items-center gap-8 border-t border-edge py-10 md:grid-cols-[1fr,220px]"
            >
              <div className="max-w-xl">
                <span className="font-mono text-xs text-accent">{c.n}</span>
                <h3 className="mt-2 font-heading text-2xl text-ink">{c.title}</h3>
                <p className="mt-3 leading-relaxed text-muted">{c.body}</p>
              </div>
              <div className="flex items-center justify-start md:justify-end">
                {c.diagram}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Process — black section */}
      <section className="bg-ink text-white">
        <div className={`${MAX} py-24`}>
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <p className="mb-5 font-mono text-xs uppercase tracking-[0.22em] text-white/50">
                Process
              </p>
              <h2 className="font-heading text-3xl leading-tight tracking-tight sm:text-4xl">
                Three steps.
                <br />
                Zero plaintext exposed.
              </h2>
              <div className="mt-10">
                {STEPS.map((s) => (
                  <div key={s.n} className="border-t border-white/10 py-6">
                    <div className="flex gap-4">
                      <span className="font-mono text-xs text-white/40">{s.n}</span>
                      <div>
                        <h3 className="font-medium">{s.title}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-white/60">
                          {s.body}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-black/40">
              <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <span className="ml-2 font-mono text-xs text-white/40">disclose.ts</span>
              </div>
              <pre className="whitespace-pre-wrap break-words px-4 py-5 text-[13px] leading-relaxed">
                <code className="font-mono text-white/80">
                  <span className="text-white/40">{"// Encrypt a claim and gate it\n"}</span>
                  <span className="text-white/40">{"// to one verifier address.\n\n"}</span>
                  <span className="text-violet-300">const</span>
                  {" pk = "}
                  <span className="text-violet-300">await</span>
                  {" observer."}
                  <span className="text-sky-300">getGlobalPubKey</span>
                  {"();\n\n"}
                  <span className="text-violet-300">const</span>
                  {" { uuid } = "}
                  <span className="text-violet-300">await</span>
                  {" uploader."}
                  <span className="text-sky-300">allocate</span>
                  {"({\n"}
                  {"  readConditionAddr: "}
                  <span className="text-emerald-300">verifier</span>
                  {",\n});\n\n"}
                  <span className="text-violet-300">await</span>
                  {" uploader."}
                  <span className="text-sky-300">write</span>
                  {"({ uuid, encryptedData });"}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Numbers that matter */}
      <section className={`${MAX} py-24`}>
        <Eyebrow>Market context</Eyebrow>
        <h2 className="font-heading text-3xl tracking-tight text-ink sm:text-4xl">
          The numbers that matter.
        </h2>
        <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-edge bg-edge sm:grid-cols-2">
          {NUMBERS.map((n) => (
            <div key={n.l} className="bg-surface p-8">
              <p className="font-heading text-4xl text-ink sm:text-5xl">{n.v}</p>
              <p className="mt-2 text-sm text-muted">{n.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Ecosystem */}
      <section className={`${MAX} py-24`}>
        <Eyebrow>Ecosystem</Eyebrow>
        <h2 className="max-w-2xl font-heading text-3xl tracking-tight text-ink sm:text-4xl">
          Built on Story. Powered by the ecosystem.
        </h2>
        <p className="mt-3 max-w-xl text-muted">
          Every component integrates natively with Story&apos;s Confidential Data Rails.
        </p>
        <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-edge bg-edge sm:grid-cols-2 lg:grid-cols-4">
          {ECOSYSTEM.map((e) => (
            <div key={e.name} className="bg-surface p-6">
              <p className="font-medium text-ink">{e.name}</p>
              <p className="mt-1 font-mono text-xs uppercase tracking-wider text-muted">
                {e.role}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Identity without exposure */}
      <section className={`${MAX} py-24`}>
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <Eyebrow>Privacy &amp; compliance</Eyebrow>
            <h2 className="font-heading text-3xl tracking-tight text-ink sm:text-4xl">
              Identity without exposure.
            </h2>
            <p className="mt-4 max-w-md leading-relaxed text-muted">
              CryptId is designed from the ground up around threshold encryption. Proving a
              fact never means revealing the data behind it.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["Client-side", "Threshold", "Revocable", "Composable"].map((p) => (
                <span
                  key={p}
                  className="rounded-full border border-edge bg-surface px-3 py-1 text-xs text-ink"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
          <div className="grid gap-px overflow-hidden rounded-2xl border border-edge bg-edge sm:grid-cols-2">
            {EXPOSURE.map((f) => (
              <div key={f.title} className="bg-surface p-6">
                <f.icon className="h-5 w-5 text-accent" strokeWidth={1.6} />
                <h3 className="mt-3 font-medium text-ink">{f.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Composable by design */}
      <section className={`${MAX} py-24`}>
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <Eyebrow>Developers</Eyebrow>
            <h2 className="font-heading text-3xl tracking-tight text-ink sm:text-4xl">
              Composable by design.
            </h2>
            <p className="mt-4 max-w-md leading-relaxed text-muted">
              Every claim is an open, composable on-chain object. Condition contracts are
              swappable, so disclosure policy is just code you deploy.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["TypeScript SDK", "Aeneid-ready", "Solidity conditions", "Threshold decrypt"].map(
                (t) => (
                  <span
                    key={t}
                    className="rounded-full border border-edge bg-surface px-3 py-1 text-xs text-ink"
                  >
                    {t}
                  </span>
                ),
              )}
            </div>
          </div>
          <div className="min-w-0 overflow-hidden rounded-2xl border border-edge bg-[#0f1620]">
            <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
              <span className="ml-2 font-mono text-xs text-white/40">
                RevocableReadCondition.sol
              </span>
            </div>
            <pre className="whitespace-pre-wrap break-words px-4 py-5 text-[13px] leading-relaxed">
              <code className="font-mono text-white/80">
                <span className="text-white/40">{"// Owner-controlled, instantly revocable\n\n"}</span>
                <span className="text-violet-300">function</span>{" "}
                <span className="text-sky-300">checkReadCondition</span>
                {"(\n"}
                {"  address caller,\n"}
                {"  bytes calldata data\n"}
                {") external view "}
                <span className="text-violet-300">returns</span>
                {" (bool) {\n"}
                {"  address owner = "}
                <span className="text-sky-300">abi.decode</span>
                {"(data,(address));\n"}
                {"  "}
                <span className="text-violet-300">return</span>
                {" allowed[owner][caller];\n"}
                {"}"}
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className={`${MAX} py-24`}>
        <div className="grid items-center gap-10 rounded-3xl border border-edge bg-surface p-10 shadow-soft lg:grid-cols-2 lg:p-14">
          <div>
            <h2 className="font-heading text-4xl leading-tight tracking-tight text-ink">
              Ready to own your identity?
            </h2>
            <p className="mt-4 max-w-md text-muted">
              The first identity layer where you decide what each verifier learns, and can
              take it back. Live on Aeneid testnet.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <Link
                href="/app"
                className="inline-flex items-center gap-3 rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-ink/90"
              >
                Launch App
                <ArrowRightCircle size={20} />
              </Link>
              <a
                href="https://github.com/Jhaycrypt001/cryptid"
                className="inline-flex items-center gap-2 text-sm font-medium text-ink/80 transition hover:text-ink"
              >
                View on GitHub
                <ArrowRightCircle size={16} />
              </a>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <WireCube />
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}

/* ── Minimal monochrome diagrams ─────────────────────────────────────────── */

const stroke = { stroke: "#192837", strokeWidth: 1.4, fill: "none" } as const;

function RadarDiagram() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" aria-hidden>
      <circle cx="60" cy="60" r="44" {...stroke} opacity={0.35} />
      <circle cx="60" cy="60" r="26" {...stroke} opacity={0.5} />
      <line x1="60" y1="8" x2="60" y2="112" {...stroke} opacity={0.2} />
      <line x1="8" y1="60" x2="112" y2="60" {...stroke} opacity={0.2} />
      <circle cx="84" cy="44" r="4" fill="#7342E2" />
    </svg>
  );
}

function NodesDiagram() {
  return (
    <svg width="140" height="120" viewBox="0 0 140 120" aria-hidden>
      <circle cx="24" cy="60" r="8" fill="#192837" />
      <line x1="32" y1="60" x2="92" y2="30" {...stroke} opacity={0.4} />
      <line x1="32" y1="60" x2="92" y2="90" {...stroke} opacity={0.2} />
      <circle cx="100" cy="30" r="6" fill="#7342E2" />
      <circle cx="100" cy="90" r="6" {...stroke} opacity={0.4} />
    </svg>
  );
}

function BarsDiagram() {
  const bars = [28, 46, 64, 84];
  return (
    <svg width="140" height="120" viewBox="0 0 140 120" aria-hidden>
      {bars.map((h, i) => (
        <rect
          key={i}
          x={14 + i * 32}
          y={104 - h}
          width="18"
          height={h}
          rx="2"
          fill={i === bars.length - 1 ? "#7342E2" : "#192837"}
          opacity={i === bars.length - 1 ? 1 : 0.3 + i * 0.15}
        />
      ))}
    </svg>
  );
}

function ToggleDiagram() {
  return (
    <svg width="130" height="120" viewBox="0 0 130 120" aria-hidden>
      <rect x="20" y="38" width="90" height="34" rx="17" {...stroke} opacity={0.4} />
      <circle cx="90" cy="55" r="12" fill="#7342E2" />
      <line x1="20" y1="92" x2="110" y2="92" {...stroke} opacity={0.2} />
      <line x1="20" y1="22" x2="70" y2="22" {...stroke} opacity={0.2} />
    </svg>
  );
}

function WireCube() {
  return (
    <svg width="220" height="220" viewBox="0 0 220 220" aria-hidden>
      <g {...stroke} opacity={0.4}>
        <path d="M60 70 L110 45 L160 70 L110 95 Z" />
        <path d="M60 70 L60 150 L110 175 L110 95" />
        <path d="M160 70 L160 150 L110 175" />
        <line x1="110" y1="95" x2="110" y2="175" />
      </g>
      <g {...stroke} opacity={0.15}>
        <line x1="60" y1="70" x2="110" y2="175" />
        <line x1="160" y1="70" x2="110" y2="175" />
      </g>
      <circle cx="110" cy="45" r="4" fill="#7342E2" />
      <circle cx="160" cy="150" r="3" fill="#192837" />
    </svg>
  );
}
