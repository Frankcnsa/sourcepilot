import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/search/single/:pageName',
        destination: '/:pageName.html',
      },
    ];
  },
};

export default nextConfig;
