"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import type { Address } from "viem";
import type { CDRClient } from "@piplabs/cdr-sdk";
import { readVault, type ReadOutcome } from "@/lib/cdr/browser";
import { removeClaim } from "@/lib/localClaims";
import type { Claim } from "@/lib/types";

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

function friendly(raw?: string): string {
  if (!raw) return "Access denied by the on-chain condition.";
  const r = raw.toLowerCase();
  if (r.includes("revert")) return "Access denied by the on-chain read condition.";
  if (r.includes("timeout") || r.includes("timed out"))
    return "Timed out waiting for validators. Give it a moment and try again.";
  return raw;
}

export function ClaimCard({
  claim,
  client,
  owner,
  onRemoved,
}: {
  claim: Claim;
  client: CDRClient;
  owner: Address;
  onRemoved: () => void;
}) {
  const [result, setResult] = useState<ReadOutcome | null>(null);
  const [busy, setBusy] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const disclosed = claim.audience !== "self";
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const shareUrl = `${origin}/verify?v=${claim.vaultUuid}&l=${encodeURIComponent(
    claim.label,
  )}&t=${claim.type}`;

  async function decrypt() {
    setBusy(true);
    setResult(await readVault(client, claim.vaultUuid));
    setBusy(false);
  }

  return (
    <div className="rounded-2xl border border-edge bg-surface p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-ink">{claim.label}</p>
          <p className="text-xs text-muted">{claim.type}</p>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            disclosed ? "bg-accent/10 text-accent" : "bg-paper text-muted"
          }`}
        >
          {disclosed ? `disclosed → ${short(claim.audience)}` : "owner-only"}
        </span>
      </div>

      <p className="mt-2 break-all font-mono text-xs text-muted">vault {claim.vaultUuid}</p>

      {disclosed ? (
        <div className="mt-3">
          <button
            onClick={() => setShowShare((s) => !s)}
            className="rounded-full bg-ink px-3 py-1.5 text-sm font-medium text-white transition hover:bg-ink/90"
          >
            {showShare ? "Hide share" : "Share with verifier"}
          </button>
          {showShare && (
            <div className="mt-3 space-y-3 rounded-xl border border-edge bg-paper p-3">
              <div className="flex justify-center rounded-lg bg-white p-3">
                <QRCodeSVG value={shareUrl} size={132} />
              </div>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={shareUrl}
                  className="w-full rounded-md border border-edge bg-surface px-2 py-1 font-mono text-[11px] text-muted"
                />
                <button
                  onClick={() => navigator.clipboard?.writeText(shareUrl)}
                  className="shrink-0 rounded-md border border-edge px-2 py-1 text-xs text-ink hover:border-accent"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-muted">
                Send this to {short(claim.audience)}. They open it, connect their wallet, and
                decrypt. Only their address can.
              </p>
            </div>
          )}
        </div>
      ) : (
        <>
          <button
            onClick={decrypt}
            disabled={busy}
            className="mt-3 rounded-full border border-edge px-3 py-1.5 text-sm text-ink transition hover:border-accent disabled:opacity-50"
          >
            {busy ? "Decrypting… (approve read in wallet)" : "Decrypt"}
          </button>
          {result && (
            <div className="mt-3 text-sm">
              {result.ok ? (
                <p className="text-emerald-600">
                  ✅ Decrypted: <span className="font-mono text-ink">{result.plaintext}</span>
                </p>
              ) : (
                <p className="text-amber-700">🔒 {friendly(result.error)}</p>
              )}
            </div>
          )}
        </>
      )}

      <button
        onClick={() => {
          removeClaim(owner, claim.id);
          onRemoved();
        }}
        className="mt-3 block text-xs text-muted hover:text-red-600"
      >
        Forget this claim
      </button>
    </div>
  );
}
