// Same-origin proxy to the Story-API REST endpoint.
//
// In self-custody mode the CDR client runs in the browser, where direct calls
// to the Story-API (different origin, plain HTTP) are blocked by CORS / mixed
// content. The browser points the SDK's apiUrl at `${origin}/api/story`, and
// this handler forwards the request server-side. No keys involved — the user's
// wallet still signs every transaction client-side; this only relays REST reads.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPSTREAM = process.env.API_URL ?? "http://172.192.41.96:1317";

async function forward(req: Request, path: string[]): Promise<Response> {
  const search = new URL(req.url).search;
  const target = `${UPSTREAM}/${path.join("/")}${search}`;

  const init: RequestInit = {
    method: req.method,
    headers: { "content-type": req.headers.get("content-type") ?? "application/json" },
  };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.text();
  }

  try {
    const res = await fetch(target, init);
    const body = await res.text();
    return new Response(body, {
      status: res.status,
      headers: { "content-type": res.headers.get("content-type") ?? "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "proxy_failed", detail: (e as Error).message, target }),
      { status: 502, headers: { "content-type": "application/json" } },
    );
  }
}

type Ctx = { params: { path: string[] } };

export async function GET(req: Request, { params }: Ctx) {
  return forward(req, params.path ?? []);
}
export async function POST(req: Request, { params }: Ctx) {
  return forward(req, params.path ?? []);
}
