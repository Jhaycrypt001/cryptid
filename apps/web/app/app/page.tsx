import { CreateClaimForm } from "@/components/CreateClaimForm";
import { ClaimCard } from "@/components/ClaimCard";
import { AppHeader } from "@/components/AppHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { listClaims } from "@/lib/store";
import {
  owner,
  verifier,
  REVOCABLE_CONDITION_ADDRESS,
  TIMEBOUND_CONDITION_ADDRESS,
} from "@/lib/cdr/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const claims = await listClaims();

  // Read config defensively so the page renders with a helpful message if
  // .env.local isn't set up yet.
  let ownerAddr = "";
  let verifierAddr = "";
  let configError = "";
  try {
    ownerAddr = owner().address;
    verifierAddr = verifier().address;
  } catch (e) {
    configError = (e as Error).message;
  }

  return (
    <>
      <AppHeader />
      <div className="mx-auto min-h-[70vh] max-w-5xl space-y-8 px-6 py-10">
        <section>
          <h1 className="font-heading text-3xl tracking-tight text-ink">
            Your identity, encrypted.
          </h1>
          <p className="mt-2 max-w-2xl text-muted">
            Every claim is a threshold-encrypted vault you own. Grant a verifier access to
            one claim. They decrypt only that, nothing else.
          </p>
          {ownerAddr && (
            <p className="mt-2 font-mono text-xs text-muted">owner {ownerAddr}</p>
          )}
        </section>

        {/* Plain-language explainer for first-time visitors */}
        <ol className="grid gap-3 sm:grid-cols-3">
          {[
            {
              n: "1",
              t: "Create",
              d: "Write a fact about yourself (age, KYC, nationality…). It's encrypted before it ever leaves your device.",
            },
            {
              n: "2",
              t: "Disclose",
              d: "Lock a claim to one verifier's wallet address. Only that address can ever unlock it.",
            },
            {
              n: "3",
              t: "Decrypt",
              d: "The verifier opens it from their portal. The chain enforces the lock, so no one else gets in.",
            },
          ].map((s) => (
            <li
              key={s.n}
              className="rounded-2xl border border-edge bg-surface p-4 shadow-soft"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-ink text-xs font-semibold text-white">
                {s.n}
              </span>
              <p className="mt-2 font-medium text-ink">{s.t}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{s.d}</p>
            </li>
          ))}
        </ol>

        {configError ? (
          <div className="rounded-xl border border-red-300 bg-red-50 p-5 text-sm text-red-700">
            {configError}. Copy <code>apps/web/.env.example</code> to{" "}
            <code>.env.local</code> and add your funded Aeneid keys.
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[380px,1fr]">
            <CreateClaimForm
              verifierAddress={verifierAddr}
              revocableEnabled={Boolean(REVOCABLE_CONDITION_ADDRESS)}
              timeboundEnabled={Boolean(TIMEBOUND_CONDITION_ADDRESS)}
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
                    <ClaimCard key={c.id} claim={c} as="owner" />
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
