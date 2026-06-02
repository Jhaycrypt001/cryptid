/** @type {import('next').NextConfig} */
const nextConfig = {
  // The CDR SDK ships native WASM and must not be bundled by the server compiler.
  // Keep it external so it loads from node_modules at runtime (Node runtime only).
  experimental: {
    serverComponentsExternalPackages: ["@piplabs/cdr-sdk"],
  },
};

export default nextConfig;
