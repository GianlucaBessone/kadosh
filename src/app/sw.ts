/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";
import { CacheFirst, NetworkFirst, ExpirationPlugin, RangeRequestsPlugin } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST || [],
  precacheOptions: {
    ignoreURLParametersMatching: [/./],
  },
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,

  runtimeCaching: [
    ...defaultCache,

    // Assets críticos
    {
      matcher: ({ url }) => 
        url.pathname.includes("/sounds/") || 
        url.pathname.includes("/icon-"),
      handler: new CacheFirst({
        cacheName: "critical-assets",
        plugins: [
          new ExpirationPlugin({ maxEntries: 150, maxAgeSeconds: 60 * 86400 }),
          new RangeRequestsPlugin()
        ],
      }),
    },
  ],
});



serwist.addEventListeners();