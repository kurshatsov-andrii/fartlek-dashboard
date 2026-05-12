import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "source.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "cdn.jsdelivr.net" },
      { protocol: "https", hostname: "telegraph.controller.bot" },
      { protocol: "http", hostname: "telegraph.controller.bot" },
      { protocol: "https", hostname: "cdn4.telesco.pe" },
      { protocol: "https", hostname: "cdn5.telesco.pe" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
