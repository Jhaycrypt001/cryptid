"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import {
  ownerReadAction,
  verifierReadAction,
  grantAction,
  revokeAction,
  isGrantedAction,
} from "@/app/actions";
import type { Claim, ReadResult } from "@/lib/types";

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

function friendlyError(raw?: string): string {
  if (!raw) return "Access denied by the on-chain condition.";
  const r = raw.toLowerCase();
  if (r.includes("revert")) return "Access denied by the on-chain read condition.";
  if (r.includes("timeout") || r.includes("timed out"))
    return "Timed out waiting for validators. Give it a moment and try again.";
  return raw;
}

export function ClaimCard({
  claim,
  as,
}: {
  claim: Claim;
  as: "owner" | "verifier";
}) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ReadResult | null>(null);

  const disclosed = claim.audience !== "self";
  const revocable = claim.kind === "revocable";
  const showControls = as === "owner" && revocable && disclosed;
  const policyLabel =
    claim.kind === "revocable"
      ? "revocable"
      : claim.kind === "timebound"
        ? "time-bound"
        : "permanent";

  // The owner can only decrypt their own (owner-only) claims. A claim disclosed
  // to a verifier is — by design — unreadable to everyone else, including the
  // owner. So don't offer a decrypt action that's guaranteed to be refused.
  const ownerLockedOut = as === "owner" && disclosed;

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
          {disclosed ? `${policyLabel} → ${short(claim.audience)}` : "owner-only"}
        </span>
      </div>

      <p className="mt-2 break-all font-mono text-xs text-muted">vault {claim.vaultUuid}</p>

      {claim.kind === "timebound" && claim.expiresAt && (
        <ExpiryBadge expiresAt={claim.expiresAt} />
      )}

      {showControls && <GrantControls verifier={claim.audience as `0x${string}`} />}

      {ownerLockedOut ? (
        <div className="mt-3 rounded-xl border border-edge bg-paper p-3 text-sm text-muted">
          🔒 Locked to the verifier{" "}
          <code className="text-ink">{short(claim.audience)}</code>. Only they can
          decrypt this. Open the{" "}
          <Link href="/verify" className="text-accent hover:underline">
            Verifier portal
          </Link>
          .
        </div>
      ) : (
        <>
          <button
            onClick={() =>
              start(async () => {
                setResult(
                  as === "owner"
                    ? await ownerReadAction(claim.vaultUuid)
                    : await verifierReadAction(claim.vaultUuid),
                );
              })
            }
            disabled={pending}
            className="mt-3 rounded-full border border-edge px-3 py-1.5 text-sm text-ink transition hover:border-accent disabled:opacity-50"
          >
            {pending
              ? "Decrypting… (validators are returning key shares)"
              : as === "owner"
                ? "Decrypt"
                : "Decrypt as verifier"}
          </button>

          {result && (
            <div className="mt-3 text-sm">
              {result.ok ? (
                <p className="text-emerald-600">
                  ✅ Decrypted:{" "}
                  <span className="font-mono text-ink">{result.plaintext}</span>
                </p>
              ) : (
                <p className="text-amber-700">🔒 {friendlyError(result.error)}</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function GrantControls({ verifier }: { verifier: `0x${string}` }) {
  const [granted, setGranted] = useState<boolean | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    isGrantedAction(verifier).then(setGranted);
  }, [verifier]);

  const toggle = (allow: boolean) =>
    start(async () => {
      if (allow) await grantAction(verifier);
      else await revokeAction(verifier);
      setGranted(allow);
    });

  return (
    <div className="mt-3 flex items-center gap-2 rounded-xl border border-edge bg-paper p-2 text-sm">
      <span
        className={`rounded-full px-2 py-0.5 text-xs ${
          granted == null
            ? "bg-surface text-muted"
            : granted
              ? "bg-emerald-100 text-emerald-700"
              : "bg-red-100 text-red-700"
        }`}
      >
        {granted == null ? "checking…" : granted ? "access: granted" : "access: revoked"}
      </span>
      <div className="ml-auto flex gap-1.5">
        <button
          onClick={() => toggle(true)}
          disabled={pending || granted === true}
          className="rounded-full border border-edge px-2.5 py-1 text-xs text-ink transition hover:border-emerald-500 disabled:opacity-40"
        >
          Grant
        </button>
        <button
          onClick={() => toggle(false)}
          disabled={pending || granted === false}
          className="rounded-full border border-edge px-2.5 py-1 text-xs text-ink transition hover:border-red-500 disabled:opacity-40"
        >
          Revoke
        </button>
      </div>
    </div>
  );
}

function ExpiryBadge({ expiresAt }: { expiresAt: number }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = expiresAt - now;
  const expired = remaining <= 0;
  const label = expired
    ? "expired (reads now revert)"
    : `expires in ${formatRemaining(remaining)}`;

  return (
    <span
      className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs ${
        expired ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
      }`}
    >
      ⏳ {label}
    </span>
  );
}

function formatRemaining(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
