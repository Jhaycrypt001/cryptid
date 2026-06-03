"use client";

import { useEffect, useState } from "react";
import { useCdr } from "@/lib/cdr/useCdr";
import { ConnectButton } from "@/components/ConnectButton";
import { AppHeader } from "@/components/AppHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { readVault } from "@/lib/cdr/browser";
import { verifyCredential } from "@/lib/credential";
import { addReceived, listReceived, type ReceivedClaim } from "@/lib/receivedClaims";

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

function friendly(raw?: string): string {
  if (!raw) return "Access denied by the on-chain condition.";
  const r = raw.toLowerCase();
  if (r.includes("revert")) return "Not disclosed to your wallet (the on-chain condition refused the read).";
  if (r.includes("timeout") || r.includes("timed out"))
    return "Timed out waiting for validators. Give it a moment and try again.";
  return raw;
}

interface ClaimRef {
  v: number;
  l: string;
  t: string;
}
interface DecryptResult {
  ok: boolean;
  value?: string;
  issuer?: string;
  verified?: boolean;
  error?: string;
}

export default function VerifyPage() {
  const { account, client } = useCdr();
  const [ref, setRef] = useState<ClaimRef | null>(null);
  const [vaultInput, setVaultInput] = useState("");
  const [result, setResult] = useState<DecryptResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [received, setReceived] = useState<ReceivedClaim[]>([]);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const v = p.get("v");
    if (v) {
      setRef({
        v: Number(v),
        l: p.get("l") ? decodeURIComponent(p.get("l")!) : `Vault ${v}`,
        t: p.get("t") ?? "claim",
      });
    }
  }, []);

  useEffect(() => {
    setReceived(account ? listReceived(account) : []);
  }, [account]);

  const targetVault = ref?.v ?? (vaultInput.trim() ? Number(vaultInput.trim()) : null);

  async function decrypt() {
    if (!client || targetVault == null || Number.isNaN(targetVault) || !account) return;
    setBusy(true);
    const r = await readVault(client, targetVault);
    if (r.ok && r.plaintext) {
      let parsed: { type?: string; value?: string; subject?: string; issuer?: string; issuedAt?: number; sig?: string } = {};
      try {
        parsed = JSON.parse(r.plaintext);
      } catch {
        parsed = { value: r.plaintext };
      }
      const claimType = parsed.type ?? ref?.t ?? "claim";
      let verified = false;
      if (parsed.issuer && parsed.sig && parsed.subject && parsed.issuedAt) {
        verified = await verifyCredential({
          subject: parsed.subject as `0x${string}`,
          claimType,
          value: parsed.value ?? "",
          issuedAt: parsed.issuedAt,
          issuer: parsed.issuer as `0x${string}`,
          sig: parsed.sig as `0x${string}`,
        });
      }
      setResult({ ok: true, value: parsed.value, issuer: parsed.issuer, verified });
      addReceived(account, {
        vaultUuid: targetVault,
        type: claimType,
        label: ref?.l ?? `Vault ${targetVault}`,
        value: parsed.value ?? "",
        issuer: parsed.issuer,
        verified,
        receivedAt: Date.now(),
      });
      setReceived(listReceived(account));
    } else {
      setResult({ ok: false, error: r.error });
    }
    setBusy(false);
  }

  return (
    <>
      <AppHeader />
      <div className="mx-auto min-h-[70vh] max-w-3xl space-y-6 px-6 py-10">
        <section>
          <h1 className="font-heading text-3xl tracking-tight text-ink">Verifier portal</h1>
          <p className="mt-2 max-w-2xl text-muted">
            Open a disclosure link and connect your wallet to decrypt a claim shared with you.
            You can only open claims disclosed to your address. The condition is enforced
            on-chain.
          </p>
          {account && <p className="mt-2 font-mono text-xs text-muted">verifier {account}</p>}
        </section>

        {!account || !client ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-edge bg-surface p-8 text-center shadow-soft">
            <p className="text-ink">Connect your wallet to verify a claim.</p>
            <ConnectButton />
            <p className="text-xs text-muted">
              No wallet installed? The connect dialog also shows a QR code you can scan with a
              mobile wallet.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-edge bg-surface p-5 shadow-soft">
              {ref ? (
                <div>
                  <p className="font-medium text-ink">{ref.l}</p>
                  <p className="text-xs text-muted">{ref.t}</p>
                  <p className="mt-2 font-mono text-xs text-muted">vault {ref.v}</p>
                </div>
              ) : (
                <label className="block text-sm">
                  <span className="mb-1 block text-muted">
                    No link detected. Enter a vault id to decrypt:
                  </span>
                  <input
                    value={vaultInput}
                    onChange={(e) => setVaultInput(e.target.value)}
                    placeholder="e.g. 4938"
                    className="w-full rounded-lg border border-edge bg-paper px-3 py-2 font-mono text-ink outline-none focus:border-accent"
                  />
                </label>
              )}

              <button
                onClick={decrypt}
                disabled={busy || targetVault == null}
                className="mt-4 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ink/90 disabled:opacity-50"
              >
                {busy ? "Decrypting… (approve read in wallet)" : "Decrypt as verifier"}
              </button>

              {result && (
                <div className="mt-4 space-y-2 text-sm">
                  {result.ok ? (
                    <>
                      <p className="text-emerald-600">
                        ✅ Decrypted: <span className="font-mono text-ink">{result.value}</span>
                      </p>
                      {result.issuer ? (
                        <p className={result.verified ? "text-emerald-600" : "text-red-600"}>
                          🏛️ {result.verified ? "Issued & verified" : "Signature INVALID"} —
                          issuer <span className="font-mono">{short(result.issuer)}</span>
                        </p>
                      ) : (
                        <p className="text-muted">Self-asserted (no issuer signature).</p>
                      )}
                    </>
                  ) : (
                    <p className="text-amber-700">🔒 {friendly(result.error)}</p>
                  )}
                </div>
              )}
            </div>

            {received.length > 0 && (
              <div className="space-y-3">
                <h2 className="font-medium text-ink">
                  Shared with me <span className="text-muted">({received.length})</span>
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {received.map((c) => (
                    <div key={c.vaultUuid} className="rounded-2xl border border-edge bg-surface p-4 shadow-soft">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-ink">{c.label}</p>
                          <p className="text-xs text-muted">{c.type}</p>
                        </div>
                        {c.issuer ? (
                          <span className={`rounded-full px-2 py-0.5 text-xs ${c.verified ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                            {c.verified ? "verified" : "invalid"}
                          </span>
                        ) : (
                          <span className="rounded-full bg-paper px-2 py-0.5 text-xs text-muted">
                            self-asserted
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm">
                        value <span className="font-mono text-ink">{c.value}</span>
                      </p>
                      {c.issuer && (
                        <p className="mt-1 font-mono text-[11px] text-muted">issuer {short(c.issuer)}</p>
                      )}
                      <p className="mt-1 font-mono text-[11px] text-muted">vault {c.vaultUuid}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <SiteFooter />
    </>
  );
}
