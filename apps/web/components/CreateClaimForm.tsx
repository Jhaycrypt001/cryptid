"use client";

import { useState } from "react";
import { isAddress, type Address } from "viem";
import type { CDRClient } from "@piplabs/cdr-sdk";
import { createClaimOnChain } from "@/lib/cdr/browser";
import { addClaim } from "@/lib/localClaims";
import type { Audience, ClaimType, Claim } from "@/lib/types";
import type { SignedCredential } from "@/lib/credential";

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

export function CreateClaimForm({
  account,
  client,
  onCreated,
  initial,
}: {
  account: Address;
  client: CDRClient;
  onCreated: () => void;
  initial?: { type?: ClaimType; verifier?: string; credential?: SignedCredential };
}) {
  const credential = initial?.credential;
  const [type, setType] = useState<ClaimType>(
    (credential?.claimType as ClaimType) ?? initial?.type ?? "age_over_18",
  );
  const [label, setLabel] = useState("");
  const [value, setValue] = useState(credential?.value ?? "");
  const [disclose, setDisclose] = useState(Boolean(initial?.verifier));
  const [verifier, setVerifier] = useState(initial?.verifier ?? "");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!label.trim() || !value.trim()) return setError("Label and value are required.");
    let audience: Audience = "self";
    if (disclose) {
      if (!isAddress(verifier)) return setError("Enter a valid verifier address (0x…).");
      audience = verifier as Address;
    }

    setBusy(true);
    try {
      setStatus("Allocating vault… (approve in wallet)");
      const vaultUuid = await createClaimOnChain(client, account, {
        type,
        value: value.trim(),
        audience,
        credential,
      });

      const claim: Claim = {
        id: crypto.randomUUID(),
        vaultUuid,
        type,
        label: label.trim(),
        audience,
        kind: audience === "self" ? "self" : "eoa",
        createdAt: Date.now(),
      };
      addClaim(account, claim);
      setStatus(null);
      setLabel("");
      setValue("");
      setVerifier("");
      setDisclose(false);
      onCreated();
    } catch (err) {
      setError((err as Error).message.split("\n")[0]);
      setStatus(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-edge bg-surface p-5 shadow-soft">
      <h2 className="font-heading text-lg text-ink">Issue a claim</h2>

      {credential && (
        <div className="rounded-xl border border-accent/40 bg-accent/5 p-3 text-xs text-ink">
          🏛️ Signed credential from issuer{" "}
          <span className="font-mono">
            {credential.issuer.slice(0, 6)}…{credential.issuer.slice(-4)}
          </span>
          . Type and value are locked to what was signed; the signature will be embedded so a
          verifier can confirm it.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-muted">Type</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ClaimType)}
            disabled={Boolean(credential)}
            className={`${inputCls} disabled:opacity-60`}
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted">Label</span>
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Over 18" className={inputCls} />
        </label>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block text-muted">Value (encrypted in your browser)</span>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          readOnly={Boolean(credential)}
          placeholder="e.g. true"
          className={`${inputCls} read-only:opacity-60`}
        />
      </label>

      <label className="flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" checked={disclose} onChange={(e) => setDisclose(e.target.checked)} className="accent-accent" />
        Disclose to a verifier
      </label>

      {disclose && (
        <label className="block text-sm">
          <span className="mb-1 block text-muted">Verifier wallet address</span>
          <input value={verifier} onChange={(e) => setVerifier(e.target.value)} placeholder="0x…" className={`${inputCls} font-mono`} />
          <span className="mt-1 block text-xs text-muted">
            Only this address will ever be able to decrypt the claim.
          </span>
        </label>
      )}

      <button
        type="submit"
        disabled={busy}
        className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ink/90 disabled:opacity-50"
      >
        {busy ? status ?? "Working…" : "Create encrypted claim"}
      </button>

      {busy && (
        <p className="text-xs text-muted">Two wallet signatures: allocate, then write.</p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
