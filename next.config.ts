import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/qualify",
        destination: "/lets-talk",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
