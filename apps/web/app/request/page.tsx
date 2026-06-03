"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useCdr } from "@/lib/cdr/useCdr";
import { ConnectButton } from "@/components/ConnectButton";
import { AppHeader } from "@/components/AppHeader";
import { SiteFooter } from "@/components/SiteFooter";
import type { ClaimType } from "@/lib/types";

const TYPES: { value: ClaimType; label: string }[] = [
  { value: "age_over_18", label: "Age over 18" },
  { value: "dob", label: "Date of birth" },
  { value: "nationality", label: "Nationality" },
  { value: "kyc", label: "KYC status" },
  { value: "income", label: "Income proof" },
  { value: "credential", label: "Credential" },
  { value: "apiKey", label: "API key" },
];

const inputCls =
  "w-full rounded-lg border border-edge bg-paper px-3 py-2 text-ink outline-none focus:border-accent";

export default function RequestPage() {
  const { account } = useCdr();
  const [type, setType] = useState<ClaimType>("age_over_18");
  const [note, setNote] = useState("");

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const requestUrl = account
    ? `${origin}/app?reqType=${type}&reqTo=${account}&reqNote=${encodeURIComponent(note)}`
    : "";

  return (
    <>
      <AppHeader />
      <div className="mx-auto min-h-[70vh] max-w-3xl space-y-6 px-6 py-10">
        <section>
          <h1 className="font-heading text-3xl tracking-tight text-ink">Request a claim</h1>
          <p className="mt-2 max-w-2xl text-muted">
            Ask someone to prove a fact to you. Share the link or QR; they disclose the claim
            to your wallet, and only you can decrypt it.
          </p>
          {account && <p className="mt-2 font-mono text-xs text-muted">requester {account}</p>}
        </section>

        {!account ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-edge bg-surface p-8 text-center shadow-soft">
            <p className="text-ink">Connect your wallet — the claim gets disclosed to this address.</p>
            <ConnectButton />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3 rounded-2xl border border-edge bg-surface p-5 shadow-soft">
              <label className="block text-sm">
                <span className="mb-1 block text-muted">Claim requested</span>
                <select value={type} onChange={(e) => setType(e.target.value as ClaimType)} className={inputCls}>
                  {TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-muted">Purpose (optional)</span>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Age check for entry"
                  className={inputCls}
                />
              </label>
            </div>

            <div className="space-y-3 rounded-2xl border border-edge bg-paper p-5">
              <p className="text-sm font-medium text-ink">Share this request</p>
              <div className="flex justify-center rounded-lg bg-white p-3">
                <QRCodeSVG value={requestUrl} size={140} />
              </div>
              <div className="flex items-center gap-2">
                <input readOnly value={requestUrl} className="w-full rounded-md border border-edge bg-surface px-2 py-1 font-mono text-[11px] text-muted" />
                <button
                  onClick={() => navigator.clipboard?.writeText(requestUrl)}
                  className="shrink-0 rounded-md border border-edge px-2 py-1 text-xs text-ink hover:border-accent"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-muted">
                Send this to the person you want a claim from. They open it, create the claim,
                and disclose it to you.
              </p>
            </div>
          </div>
        )}
      </div>
      <SiteFooter />
    </>
  );
}
