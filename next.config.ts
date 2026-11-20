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
  // Grundschutz für alle Antworten: nicht in fremde Seiten einbetten (Clickjacking im Admin),
  // keine MIME-Ratespiele, keine vollen URLs an fremde Seiten weitergeben.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
        ],
      },
      {
        // /api/* (Bilder, Logos) setzt eine eigene, strengere CSP mit sandbox
        source: "/((?!api/).*)",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
        ],
      },
    ];
  },
  poweredByHeader: false,
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
