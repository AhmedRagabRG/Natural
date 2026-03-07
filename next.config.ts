import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Core Web Vitals optimisations */
  poweredByHeader: false,         // remove X-Powered-By header
  compress: true,                 // enable gzip/brotli
  outputFileTracingRoot: __dirname, // silence lockfile warning

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'naturalspicesuae.com',
        port: '',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'dashboard.naturalspicesuae.com',
        port: '',
        pathname: '/uploads/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],  // serve modern formats
    minimumCacheTTL: 86400,                  // cache optimised images 24h
  },

  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['react-icons'],
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  // Cache-Control for static assets
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:all*(js|css)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
