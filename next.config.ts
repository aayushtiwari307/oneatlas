import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This project uses the route-segment `force-dynamic` contract for all
  // database-backed pages and API handlers. Cache Components disables that
  // legacy segment configuration, so it remains intentionally disabled here.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
