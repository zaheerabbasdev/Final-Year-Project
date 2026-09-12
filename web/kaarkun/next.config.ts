import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**',
      },
      {
        // AWS ALB — avatars and attachments served at /api/uploads/**
        protocol: 'http',
        hostname: 'academy-dev-alb-1956712506.ap-south-1.elb.amazonaws.com',
        pathname: '/api/uploads/**',
      },
    ],
  },
};

export default nextConfig;
