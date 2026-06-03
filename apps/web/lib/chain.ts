import { defineChain } from "viem";

// Story Aeneid testnet. Kept in its own light module (no CDR SDK import) so the
// wagmi config + landing page don't pull in the heavy WASM bundle.
export const aeneid = defineChain({
  id: 1315,
  name: "Story Aeneid",
  nativeCurrency: { name: "IP", symbol: "IP", decimals: 18 },
  rpcUrls: { default: { http: ["https://aeneid.storyrpc.io"] } },
  blockExplorers: {
    default: { name: "Storyscan", url: "https://aeneid.storyscan.io" },
  },
  testnet: true,
});
