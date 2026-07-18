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

// Definir rutas específicas para precacheo que deben estar disponibles offline
// Actualizado para reflejar el nuevo flujo de bootstrap
const criticalRoutes = [
  "/",
  "/login", 
  "/home",
  "/registro",
  "/welcome",
  "/_next/static/chunks/app/layout-bb6cde704e7f2cb2.js",
  "/_next/static/chunks/app/(main)/layout-9c928af083522b4c.js",
  "/_next/static/chunks/app/(main)/template-eff60b26f5709b70.js",
  // Añadir rutas críticas para el nuevo flujo de bootstrap
  "/_next/static/chunks/pages/index.*.js",
  "/_next/static/chunks/app/page.*.js",
];

// Agregar rutas críticas al precache si no están ya incluidas
const precacheEntries = self.__SW_MANIFEST || [];
for (const route of criticalRoutes) {
  const exists = precacheEntries.some(entry => {
    if (typeof entry === 'string') {
      return entry === route;
    } else {
      return entry.url === route;
    }
  });
  if (!exists) {
    precacheEntries.push(route);
  }
}

// Forzar skipWaiting y clientsClaim para asegurar actualización
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

const serwist = new Serwist({
  precacheEntries: precacheEntries,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();