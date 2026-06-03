/** @type {import('next').NextConfig} */
const nextConfig = {
  // The CDR SDK ships native WASM. On the server we keep it external (loads from
  // node_modules at runtime). For the browser self-custody path we need webpack
  // to handle the .wasm import + the Emscripten glue's Node-only branches.
  experimental: {
    serverComponentsExternalPackages: ["@piplabs/cdr-sdk"],
  },
  webpack: (config, { webpack }) => {
    config.experiments = { ...config.experiments, asyncWebAssembly: true };

    // The Emscripten WASM glue imports `node:*` builtins only inside its
    // Node-only branches (it has a browser fetch path via import.meta.url).
    // webpack can't resolve the `node:` URI scheme for the browser, so rewrite
    // `node:fs` -> `fs` etc., then stub those bare names below.
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
        resource.request = resource.request.replace(/^node:/, "");
      }),
    );

    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
      module: false,
      url: false,
      os: false,
      util: false,
      stream: false,
    };

    // Optional IPFS/file-storage providers the SDK lists as optional peers.
    // We only use the inline (encrypt/write/read) path, so stub them out.
    // (`multiformats` IS used by the core read path — keep it installed.)
    config.resolve.alias = {
      ...config.resolve.alias,
      helia: false,
      "@helia/unixfs": false,
      "@storacha/client": false,
      "@filoz/synapse-sdk": false,
    };

    return config;
  },
};

export default nextConfig;
