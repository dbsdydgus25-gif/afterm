import type { NextConfig } from "next";

// Force deploy trigger: 2026-02-04 14:15

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  experimental: {
    outputFileTracingIncludes: {
      '/api/admin/cases/[caseId]/delegation-pdf': ['./public/fonts/**'],
    },
  },
};

export default nextConfig;
