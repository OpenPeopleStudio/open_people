import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Reduce noisy console warnings in development
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
};

export default nextConfig;
