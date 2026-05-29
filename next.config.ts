import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for SSE streaming responses
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
