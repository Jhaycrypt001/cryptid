"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/app", label: "Claims" },
  { href: "/verify", label: "Verify" },
  { href: "/request", label: "Request" },
  { href: "/issue", label: "Issue" },
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
            className={`rounded-full px-3 py-1.5 transition ${
              active ? "bg-ink text-white" : "text-muted hover:text-ink"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
