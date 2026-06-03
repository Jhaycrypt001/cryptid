"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { isAddress, type Address } from "viem";
import { useAccount, useWalletClient } from "wagmi";
import { ConnectButton } from "@/components/ConnectButton";
import { AppHeader } from "@/components/AppHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { signCredential, encodeCredential } from "@/lib/credential";
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

export default function IssuePage() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [subject, setSubject] = useState("");
  const [type, setType] = useState<ClaimType>("kyc");
  const [value, setValue] = useState("");
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  async function sign() {
    setError(null);
    setLink(null);
    if (!walletClient) return;
    if (!isAddress(subject)) return setError("Enter a valid subject address (0x…).");
    if (!value.trim()) return setError("Enter the credential value.");
    setBusy(true);
    try {
      const cred = await signCredential(walletClient, {
        subject: subject as Address,
        claimType: type,
        value: value.trim(),
      });
      setLink(`${origin}/app?cred=${encodeURIComponent(encodeCredential(cred))}`);
    } catch (e) {
      setError((e as Error).message.split("\n")[0]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <AppHeader />
      <div className="mx-auto min-h-[70vh] max-w-3xl space-y-6 px-6 py-10">
        <section>
          <h1 className="font-heading text-3xl tracking-tight text-ink">Issue a credential</h1>
          <p className="mt-2 max-w-2xl text-muted">
            As a trusted issuer, sign a credential for someone. They import it into CryptId; when
            a verifier decrypts it, your signature proves you attested to the value.
          </p>
          {address && <p className="mt-2 font-mono text-xs text-muted">issuer {address}</p>}
        </section>

        {!walletClient ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-edge bg-surface p-8 text-center shadow-soft">
            <p className="text-ink">Connect your issuer wallet to sign credentials.</p>
            <ConnectButton />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3 rounded-2xl border border-edge bg-surface p-5 shadow-soft">
              <label className="block text-sm">
                <span className="mb-1 block text-muted">Subject (holder) address</span>
                <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="0x…" className={`${inputCls} font-mono`} />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-muted">Claim type</span>
                <select value={type} onChange={(e) => setType(e.target.value as ClaimType)} className={inputCls}>
                  {TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-muted">Value to attest</span>
                <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="e.g. verified" className={inputCls} />
              </label>
              <button
                onClick={sign}
                disabled={busy}
                className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ink/90 disabled:opacity-50"
              >
                {busy ? "Sign in wallet…" : "Sign credential (no gas)"}
              </button>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>

            {link && (
              <div className="space-y-3 rounded-2xl border border-edge bg-paper p-5">
                <p className="text-sm font-medium text-ink">Send this to the subject</p>
                <div className="flex justify-center rounded-lg bg-white p-3">
                  <QRCodeSVG value={link} size={140} />
                </div>
                <div className="flex items-center gap-2">
                  <input readOnly value={link} className="w-full rounded-md border border-edge bg-surface px-2 py-1 font-mono text-[11px] text-muted" />
                  <button
                    onClick={() => navigator.clipboard?.writeText(link)}
                    className="shrink-0 rounded-md border border-edge px-2 py-1 text-xs text-ink hover:border-accent"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-muted">
                  They open it, and the claim is created with your signature embedded.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      <SiteFooter />
    </>
  );
}
