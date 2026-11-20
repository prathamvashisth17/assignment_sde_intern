import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // The assignment names the API endpoints /feed, /swipe and /matches.
      // Keep the conventional Next.js /api/* routes as the implementation and
      // expose those exact paths as aliases.
      { source: "/feed", destination: "/api/feed" },
      { source: "/swipe", destination: "/api/swipe" },
      { source: "/matches", destination: "/api/matches" },
    ];
  },
};

export default nextConfig;
