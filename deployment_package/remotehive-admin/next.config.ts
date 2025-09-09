import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:8001/api/v1/:path*',
      },
      {
        source: '/api/scraper/:path*',
        destination: 'http://localhost:8002/api/scraper/:path*',
      },
    ];
  },
};

export default nextConfig;
