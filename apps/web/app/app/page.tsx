"use client";

import { useCallback, useEffect, useState } from "react";
import { useCdr } from "@/lib/cdr/useCdr";
import { ConnectButton } from "@/components/ConnectButton";
import { AppHeader } from "@/components/AppHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CreateClaimForm } from "@/components/CreateClaimForm";
import { ClaimCard } from "@/components/ClaimCard";
import { listClaims } from "@/lib/localClaims";
import { decodeCredential, type SignedCredential } from "@/lib/credential";
import type { Claim, ClaimType } from "@/lib/types";

interface IncomingRequest {
  type: ClaimType;
  to: string;
  note: string;
}

const STEPS = [
  { n: "1", t: "Create", d: "Write a fact about yourself. It's encrypted in your browser and written to a vault on-chain." },
  { n: "2", t: "Disclose", d: "Lock a claim to one verifier's wallet address, then share the link or QR." },
  { n: "3", t: "Decrypt", d: "Only the verifier's wallet can open it. The chain enforces the lock." },
];

export default function Dashboard() {
  const { account, client } = useCdr();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [request, setRequest] = useState<IncomingRequest | null>(null);
  const [credential, setCredential] = useState<SignedCredential | null>(null);

  const refresh = useCallback(() => {
    setClaims(account ? listClaims(account) : []);
  }, [account]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // A verifier's request link: /app?reqType=…&reqTo=0x…&reqNote=…
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const to = p.get("reqTo");
    const type = p.get("reqType");
    if (to && type) {
      setRequest({ type: type as ClaimType, to, note: p.get("reqNote") ?? "" });
    }
    const cred = p.get("cred");
    if (cred) {
      const c = decodeCredential(decodeURIComponent(cred));
      if (c) setCredential(c);
    }
  }, []);

  return (
    <>
      <AppHeader />
      <div className="mx-auto min-h-[70vh] max-w-5xl space-y-8 px-6 py-10">
        <section>
          <h1 className="font-heading text-3xl tracking-tight text-ink">Your identity, encrypted.</h1>
          <p className="mt-2 max-w-2xl text-muted">
            Every claim is a threshold-encrypted vault you own. Grant a verifier access to one
            claim. They decrypt only that, nothing else.
          </p>
          {account && <p className="mt-2 font-mono text-xs text-muted">owner {account}</p>}
        </section>

        {/* How it works — the three roles */}
        <section className="rounded-2xl border border-edge bg-surface p-5 shadow-soft">
          <h2 className="font-heading text-lg text-ink">How CryptId works</h2>
          <p className="mt-1 text-sm text-muted">
            Every action is one of three roles — the same wallet can play any of them.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="font-medium text-ink">
                Holder <span className="text-xs font-normal text-muted">· Claims</span>
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                Create encrypted facts about yourself and choose who can decrypt each one.
              </p>
            </div>
            <div>
              <p className="font-medium text-ink">
                Verifier{" "}
                <span className="text-xs font-normal text-muted">· Verify / Request</span>
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                Ask someone to prove a fact, then decrypt only what they disclose to you.
              </p>
            </div>
            <div>
              <p className="font-medium text-ink">
                Issuer <span className="text-xs font-normal text-muted">· Issue</span>
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                A trusted party signs a credential so a fact is verified, not just self-claimed.
              </p>
            </div>
          </div>
        </section>

        <ol className="grid gap-3 sm:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n} className="rounded-2xl border border-edge bg-surface p-4 shadow-soft">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-ink text-xs font-semibold text-white">
                {s.n}
              </span>
              <p className="mt-2 font-medium text-ink">{s.t}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{s.d}</p>
            </li>
          ))}
        </ol>

        {request && (
          <div className="rounded-2xl border border-accent/40 bg-accent/5 p-4">
            <p className="text-sm text-ink">
              📨 <span className="font-mono text-xs">{request.to.slice(0, 6)}…{request.to.slice(-4)}</span>{" "}
              requests: <span className="font-medium">{request.type}</span>
              {request.note ? ` — ${request.note}` : ""}.
            </p>
            <p className="mt-1 text-xs text-muted">
              Create the claim below (the form is pre-filled and set to disclose to them), then
              send them the share link.
            </p>
            <button
              onClick={() => setRequest(null)}
              className="mt-2 text-xs text-muted hover:text-ink"
            >
              Dismiss
            </button>
          </div>
        )}

        {!account || !client ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-edge bg-surface p-8 text-center shadow-soft">
            <p className="text-ink">Connect your wallet to issue and manage claims.</p>
            <ConnectButton />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[380px,1fr]">
            <CreateClaimForm
              key={
                credential
                  ? `cred-${credential.sig.slice(0, 12)}`
                  : request
                    ? `${request.to}-${request.type}`
                    : "new"
              }
              account={account}
              client={client}
              onCreated={refresh}
              initial={
                credential
                  ? { credential }
                  : request
                    ? { type: request.type, verifier: request.to }
                    : undefined
              }
            />
            <div className="space-y-3">
              <h2 className="font-medium text-ink">
                Claims <span className="text-muted">({claims.length})</span>
              </h2>
              {claims.length === 0 ? (
                <p className="text-sm text-muted">No claims yet. Issue one on the left.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {claims.map((c) => (
                    <ClaimCard key={c.id} claim={c} client={client} owner={account} onRemoved={refresh} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <SiteFooter />
    </>
  );
}
