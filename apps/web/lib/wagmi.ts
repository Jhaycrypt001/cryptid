import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { aeneid } from "./chain";

// WalletConnect/Reown project id is a PUBLIC client-side identifier.
const projectId =
  process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? "1acb93d3c0b2297198945746aefa3050";

export const wagmiConfig = getDefaultConfig({
  appName: "CryptId",
  projectId,
  chains: [aeneid],
  ssr: true,
});
