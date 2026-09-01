import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
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
        hostname: 'academy-dev-alb-1183018762.ap-south-1.elb.amazonaws.com',
        pathname: '/api/uploads/**',
      },
    ],
  },
};

export default nextConfig;
