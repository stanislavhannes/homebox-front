import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
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
