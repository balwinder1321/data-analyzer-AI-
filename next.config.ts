import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use Turbopack (Next.js 16 default)
  turbopack: {},
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
    ];
  },
  // Server external packages
  serverExternalPackages: ['xlsx'],
};

export default nextConfig;
