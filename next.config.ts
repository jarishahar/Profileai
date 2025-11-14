import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb", // Increased from default 1MB to handle large text chunks
    },
  },
  serverExternalPackages: ["pdfjs-dist", "pdf-parse", "mammoth", "xlsx"],
};

export default nextConfig;
