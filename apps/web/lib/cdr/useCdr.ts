"use client";

import { useMemo } from "react";
import { useAccount, useWalletClient } from "wagmi";
import type { CDRClient } from "@piplabs/cdr-sdk";
import { buildClient } from "./browser";

// Bridges wagmi (the connected wallet) into a CDR client. `account` is the
// connected address; `client` is ready once a wallet client is available.
export function useCdr(): { account: `0x${string}` | null; client: CDRClient | null } {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const client = useMemo(
    () => (walletClient ? buildClient(walletClient) : null),
    [walletClient],
  );
  return { account: address ?? null, client };
}
