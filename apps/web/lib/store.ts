import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Claim } from "./types";

// Minimal file-backed store for claim METADATA only (never plaintext — that
// lives encrypted in the CDR vault). Good enough for a hackathon demo; swap for
// a DB later. Stored at apps/web/.data/claims.json (gitignored).

const DATA_DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DATA_DIR, "claims.json");

async function readAll(): Promise<Claim[]> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    return JSON.parse(raw) as Claim[];
  } catch {
    return [];
  }
}

async function writeAll(claims: Claim[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(claims, null, 2), "utf8");
}

export async function addClaim(claim: Claim): Promise<void> {
  const all = await readAll();
  all.unshift(claim);
  await writeAll(all);
}

export async function listClaims(): Promise<Claim[]> {
  return readAll();
}

export async function getClaim(id: string): Promise<Claim | undefined> {
  return (await readAll()).find((c) => c.id === id);
}

// Claims disclosed to a specific verifier address (for the /verify portal).
export async function listClaimsForVerifier(addr: string): Promise<Claim[]> {
  const target = addr.toLowerCase();
  return (await readAll()).filter((c) => c.audience.toLowerCase() === target);
}
