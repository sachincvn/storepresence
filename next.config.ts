import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A stray lockfile in the home directory confuses workspace-root detection.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
