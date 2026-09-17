import type { NextConfig } from "next";

// On Vercel we build a fully static export (the app is client-side only).
// Locally, vinext/Cloudflare keeps the default behavior.
const nextConfig: NextConfig = process.env.VERCEL
  ? { output: "export", trailingSlash: true, images: { unoptimized: true } }
  : {};

export default nextConfig;
