import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Für das Docker-Image: .next/standalone enthält Server und nur die nötigen node_modules
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  // Alte Adresse der Item-Verwaltung
  async redirects() {
    return [{ source: "/admin/loans", destination: "/admin/items", permanent: true }];
  },
  experimental: {
    // Logo-Upload im Admin (Logo selbst max. 2 MB)
    serverActions: { bodySizeLimit: "3mb" },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
