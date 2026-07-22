import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";
import crypto from "crypto";

const buildRevision = crypto.randomUUID();

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  additionalPrecacheEntries: [
    // App shell routes
    { url: "/", revision: buildRevision },
    { url: "/login", revision: buildRevision },
    { url: "/registro", revision: buildRevision },
    { url: "/welcome", revision: buildRevision },
    { url: "/home", revision: buildRevision },
    { url: "/tithe", revision: buildRevision },
    { url: "/seeds", revision: buildRevision },
    { url: "/seeds/new", revision: buildRevision },
    { url: "/planning", revision: buildRevision },
    { url: "/planning/new", revision: buildRevision },
    { url: "/register-tx", revision: buildRevision },
    { url: "/profile", revision: buildRevision },
    { url: "/asistencia", revision: buildRevision },
    { url: "/oraciones", revision: buildRevision },
    { url: "/transactions", revision: buildRevision },
    // Critical public assets
    { url: "/manifest.webmanifest", revision: buildRevision },
    { url: "/icon-192x192.png", revision: buildRevision },
    { url: "/icon-512x512.png", revision: buildRevision },
    { url: "/apple-touch-icon.png", revision: buildRevision },
    // Sounds
    { url: "/sounds/delete.wav", revision: buildRevision },
    { url: "/sounds/error.wav", revision: buildRevision },
    { url: "/sounds/goal.wav", revision: buildRevision },
    { url: "/sounds/restore.wav", revision: buildRevision },
    { url: "/sounds/stars.mp3", revision: buildRevision },
    { url: "/sounds/success.wav", revision: buildRevision },
  ],
});

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client', 'prisma'],
};

export default withSerwist(nextConfig);