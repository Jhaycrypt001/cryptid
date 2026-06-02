"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/app", label: "My claims" },
  { href: "/verify", label: "Verifier portal" },
];

export function AppTabs() {
  const path = usePathname();
  return (
    <div className="inline-flex rounded-full border border-edge bg-surface p-1 text-sm shadow-soft">
      {TABS.map((t) => {
        const active = path === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`rounded-full px-4 py-1.5 transition ${
              active ? "bg-accent text-white" : "text-muted hover:text-ink"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
