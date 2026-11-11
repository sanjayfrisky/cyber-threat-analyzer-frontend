import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  // Static export: the app is fully client-side, so Cloudflare Pages
  // can serve it without a Node server. Build output goes to ./out
  output: "export",
  images: { unoptimized: true },
};
export default nextConfig;