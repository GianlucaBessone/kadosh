/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";
import { CacheFirst, NetworkFirst, ExpirationPlugin } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST || [],
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,

  runtimeCaching: [
    ...defaultCache,

    // Catch-all para navegación (lo más amplio posible)
    {
      matcher: ({ request }) => request.mode === "navigate",
      handler: new NetworkFirst({
        cacheName: "navigation",
        plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 30 * 86400 })],
      }),
    },

    // Rutas específicas de tu app
    {
      matcher: ({ url }) => 
        ["/login", "/registro", "/home", "/welcome", "/profile", "/tithe", "/seeds", "/planning", "/register-tx", "/asistencia", "/oraciones"]
          .some(path => url.pathname === path || url.pathname.startsWith(path)),
      handler: new NetworkFirst({
        cacheName: "app-routes",
        plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 7 * 86400 })],
      }),
    },

    // Assets críticos
    {
      matcher: ({ url }) => 
        url.pathname.includes("/sounds/") || 
        url.pathname.includes("/_next/static/") || 
        url.pathname.includes("/icon-"),
      handler: new CacheFirst({
        cacheName: "critical-assets",
        plugins: [new ExpirationPlugin({ maxEntries: 150, maxAgeSeconds: 60 * 86400 })],
      }),
    },
  ],
});

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

serwist.addEventListeners();