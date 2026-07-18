import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  // Asegurar que las rutas críticas se incluyan en el precache
  injectionPoint: undefined,
});

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client', 'prisma'],
};

export default withSerwist(nextConfig);