/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// Inyectamos nuestro plugin anti-redirecciones a todas las estrategias de Next.js
// Esto permite que Serwist mantenga su lógica de App Router para rutas estáticas (como /tithe)
// pero impide que se cachee la redirección del login.
for (const entry of defaultCache) {
  if (entry.handler && typeof entry.handler === 'object') {
    const handler = entry.handler as any;
    if (!handler.plugins) {
      handler.plugins = [];
    }
    handler.plugins.push({
      cacheWillUpdate: async ({ response }: any) => {
        if (response.redirected || response.url.includes('/login')) {
          return null; // Rechazar
        }
        return response; // Aceptar
      }
    });
  }
}

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
