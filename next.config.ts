import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  // site-captures.ts lazily imports @playwright/test for live screenshots;
  // these packages must stay unbundled or webpack chokes on their binaries.
  serverExternalPackages: ["@playwright/test", "playwright", "playwright-core"],
};

export default nextConfig;
