import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";
import crypto from "crypto";

const buildRevision = crypto.randomUUID();

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  additionalPrecacheEntries: [
    { url: "/", revision: buildRevision },
    { url: "/login", revision: buildRevision },
    { url: "/registro", revision: buildRevision },
    { url: "/home", revision: buildRevision },
    { url: "/welcome", revision: buildRevision },
  ],
  injectionPoint: undefined,
});

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client', 'prisma'],
};

export default withSerwist(nextConfig);