"use client";

import { useState, useTransition } from "react";
import { createClaimAction } from "@/app/actions";
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

const TTL_OPTIONS = [
  { label: "5 minutes", seconds: 300 },
  { label: "1 hour", seconds: 3600 },
  { label: "24 hours", seconds: 86400 },
];

type Mode = "permanent" | "revocable" | "timebound";

const inputCls =
  "w-full rounded-lg border border-edge bg-paper px-3 py-2 text-ink outline-none focus:border-accent";

export function CreateClaimForm({
  verifierAddress,
  revocableEnabled,
  timeboundEnabled,
}: {
  verifierAddress: string;
  revocableEnabled: boolean;
  timeboundEnabled: boolean;
}) {
  const [pending, start] = useTransition();
  const [disclose, setDisclose] = useState(false);
  const [mode, setMode] = useState<Mode>(
    revocableEnabled ? "revocable" : timeboundEnabled ? "timebound" : "permanent",
  );
  const [ttl, setTtl] = useState(TTL_OPTIONS[0].seconds);
  const [error, setError] = useState<string | null>(null);

  const kindFor = (m: Mode) =>
    m === "permanent" ? "eoa" : m === "revocable" ? "revocable" : "timebound";

  return (
    <form
      action={(fd) => {
        setError(null);
        if (!disclose) {
          fd.set("audience", "self");
          fd.set("kind", "self");
        } else {
          fd.set("audience", verifierAddress);
          fd.set("kind", kindFor(mode));
          if (mode === "timebound") fd.set("ttl", String(ttl));
        }
        start(async () => {
          try {
            await createClaimAction(fd);
          } catch (e) {
            setError((e as Error).message);
          }
        });
      }}
      className="space-y-3 rounded-2xl border border-edge bg-surface p-5 shadow-soft"
    >
      <h2 className="font-heading text-lg text-ink">Issue a claim</h2>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-muted">Type</span>
          <select name="type" className={inputCls}>
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-muted">Label</span>
          <input name="label" placeholder="e.g. Over 18" className={inputCls} />
        </label>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block text-muted">Value (encrypted client-side)</span>
        <input name="value" placeholder="e.g. true" className={inputCls} />
      </label>

      <label className="flex items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          checked={disclose}
          onChange={(e) => setDisclose(e.target.checked)}
          className="accent-accent"
        />
        Disclose to verifier{" "}
        {verifierAddress && (
          <code className="text-xs text-accent">
            {verifierAddress.slice(0, 6)}…{verifierAddress.slice(-4)}
          </code>
        )}
      </label>

      {disclose && (
        <div className="space-y-2 rounded-xl border border-edge bg-paper p-3 text-sm">
          <ModeRow
            id="permanent"
            title="Permanent"
            desc="Gated to the verifier's address. Cannot be revoked."
            checked={mode === "permanent"}
            onSelect={() => setMode("permanent")}
          />
          <ModeRow
            id="revocable"
            title="Revocable"
            desc={
              revocableEnabled
                ? "Gated by the allowlist contract. Grant and revoke any time."
                : "Set REVOCABLE_CONDITION_ADDRESS to enable."
            }
            checked={mode === "revocable"}
            disabled={!revocableEnabled}
            onSelect={() => setMode("revocable")}
          />
          <ModeRow
            id="timebound"
            title="Time-bound"
            desc={
              timeboundEnabled
                ? "Gated by the time-window contract. Access expires on its own."
                : "Set TIMEBOUND_CONDITION_ADDRESS to enable."
            }
            checked={mode === "timebound"}
            disabled={!timeboundEnabled}
            onSelect={() => setMode("timebound")}
          />

          {mode === "timebound" && timeboundEnabled && (
            <label className="block pt-1">
              <span className="mb-1 block text-xs text-muted">Access expires after</span>
              <select
                value={ttl}
                onChange={(e) => setTtl(Number(e.target.value))}
                className={inputCls}
              >
                {TTL_OPTIONS.map((o) => (
                  <option key={o.seconds} value={o.seconds}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-accent transition hover:brightness-110 disabled:opacity-50"
      >
        {pending ? "Encrypting + writing on-chain…" : "Create encrypted claim"}
      </button>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}

function ModeRow({
  title,
  desc,
  checked,
  disabled,
  onSelect,
}: {
  id: string;
  title: string;
  desc: string;
  checked: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <label className={`flex items-start gap-2 ${disabled ? "opacity-50" : ""}`}>
      <input
        type="radio"
        name="mode"
        checked={checked}
        disabled={disabled}
        onChange={onSelect}
        className="mt-1 accent-accent"
      />
      <span>
        <span className="text-ink">{title}</span>
        <span className="block text-xs text-muted">{desc}</span>
      </span>
    </label>
  );
}
