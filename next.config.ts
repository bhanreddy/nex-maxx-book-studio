import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  distDir: process.env.NEX_BUILD_DIR || ".next",
  transpilePackages: ["three", "lucide-react"],
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  outputFileTracingRoot: path.resolve(__dirname),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
