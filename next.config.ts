import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
    deviceSizes: [640, 750, 1080, 1200],
    imageSizes: [88, 176, 256, 384],
  },
};

export default nextConfig;
