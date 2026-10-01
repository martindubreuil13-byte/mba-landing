import type { NextConfig } from "next";
import { NOINDEX_DIRECTIVE, deploymentEnv, isProductionDeployment } from "./app/lib/deployment";

const nextConfig: NextConfig = {
  // Baked into the browser bundle at build time so client code (the admin login's Supabase client) can fail closed too.
  env: { NEXT_PUBLIC_DEPLOYMENT_ENV: deploymentEnv() },
  async redirects() {
    return [
      {
        source: "/qualify",
        destination: "/lets-talk",
        permanent: true,
      },
    ];
  },
  // Every non-production deployment (Vercel preview, local) tells crawlers to stay out, on every route,
  // including API routes and the admin. Production sends no such header. This does not rely on Vercel's default.
  async headers() {
    if (isProductionDeployment()) return [];
    return [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: NOINDEX_DIRECTIVE }] }];
  },
};

export default nextConfig;
