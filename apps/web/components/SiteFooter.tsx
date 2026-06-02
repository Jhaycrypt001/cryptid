import Link from "next/link";
import { Logo } from "./Logo";

const COLS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "Product",
    links: [
      { label: "My claims", href: "/app" },
      { label: "Verifier portal", href: "/verify" },
      { label: "How it works", href: "/#how" },
    ],
  },
  {
    heading: "Developers",
    links: [
      { label: "Features", href: "/#features" },
      {
        label: "CDR SDK docs",
        href: "https://docs.story.foundation/developers/cdr-sdk/overview",
      },
      { label: "GitHub", href: "https://github.com/Jhaycrypt001/cryptid" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Story docs", href: "https://docs.story.foundation" },
      { label: "CDR hackathon", href: "https://build.usecdr.dev" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-edge bg-paper">
      <div className="mx-auto max-w-[1280px] px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr,1fr,1fr,1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              Privacy-preserving identity rails. Confidential by design, composable on Story
              Confidential Data Rails.
            </p>
          </div>
          {COLS.map((col) => (
            <div key={col.heading}>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
                {col.heading}
              </p>
              <ul className="mt-4 space-y-2.5 text-sm">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-ink/80 transition hover:text-ink">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-2 border-t border-edge pt-6 text-xs text-muted sm:flex-row">
          <p>© 2026 CryptId · Built for the CDR Hackathon</p>
          <p>Aeneid testnet · not for real secrets</p>
        </div>
      </div>
    </footer>
  );
}
