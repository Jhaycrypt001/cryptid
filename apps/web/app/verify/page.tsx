import { ClaimCard } from "@/components/ClaimCard";
import { AppHeader } from "@/components/AppHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { listClaimsForVerifier } from "@/lib/store";
import { verifier } from "@/lib/cdr/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function VerifyPage() {
  let verifierAddr = "";
  let configError = "";
  try {
    verifierAddr = verifier().address;
  } catch (e) {
    configError = (e as Error).message;
  }

  const claims = verifierAddr ? await listClaimsForVerifier(verifierAddr) : [];

  return (
    <>
      <AppHeader />
      <div className="mx-auto min-h-[70vh] max-w-5xl space-y-6 px-6 py-10">
        <section>
          <h1 className="font-heading text-3xl tracking-tight text-ink">Verifier portal</h1>
          <p className="mt-2 max-w-2xl text-muted">
            You are acting as the verifier. You can decrypt only the claims an owner has
            disclosed to your address. The read condition is enforced on-chain.
          </p>
          {verifierAddr && (
            <p className="mt-2 font-mono text-xs text-muted">verifier {verifierAddr}</p>
          )}
        </section>

        {configError ? (
          <div className="rounded-xl border border-red-300 bg-red-50 p-5 text-sm text-red-700">
            {configError}
          </div>
        ) : claims.length === 0 ? (
          <p className="text-sm text-muted">
            No claims disclosed to you yet. On{" "}
            <span className="text-ink">My claims</span>, create a claim with “Disclose to
            verifier” checked.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {claims.map((c) => (
              <ClaimCard key={c.id} claim={c} as="verifier" />
            ))}
          </div>
        )}
      </div>
      <SiteFooter />
    </>
  );
}
