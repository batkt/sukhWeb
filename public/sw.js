/* eslint-disable no-undef */
// Service Worker for offline-first caching and background sync
// Uses Workbox from CDN for robust strategies

self.addEventListener("install", (event) => {
  // Activate worker immediately after install
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Take control of uncontrolled clients
  event.waitUntil(self.clients.claim());
});

// Import Workbox
importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/6.6.1/workbox-sw.js"
);

if (self.workbox) {
  // Debug off in production
  workbox.setConfig({ debug: false });

  // Precache minimal offline page to show when navigation fails
  workbox.precaching.precacheAndRoute([
    { url: "/offline.html", revision: "1" },
  ]);

  // Cache Next.js build assets (immutable hashed files)
  workbox.routing.registerRoute(
    ({ url }) => url.pathname.startsWith("/_next/static/"),
    new workbox.strategies.CacheFirst({
      cacheName: "next-static-assets",
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        }),
      ],
    })
  );

  // Cache images with StaleWhileRevalidate
  workbox.routing.registerRoute(
    ({ request }) => request.destination === "image",
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: "images",
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        }),
      ],
    })
  );

  // Navigation requests: try network first, fall back to offline page
  const handler = new workbox.strategies.NetworkFirst({
    cacheName: "pages",
    networkTimeoutSeconds: 5,
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 7 * 24 * 60 * 60,
      }),
    ],
  });
  workbox.routing.registerRoute(
    ({ request }) => request.mode === "navigate",
    async (args) => {
      try {
        return await handler.handle(args);
      } catch (e) {
        return caches.match("/offline.html");
      }
    }
  );

  // Backend API base URL (adjust if changed)
  const API_ORIGIN = "http://103.143.40.46:8084";

  // Background Sync for write operations
  const QUEUE_NAME = "api-write-queue";
  const bgSyncPlugin = new workbox.backgroundSync.BackgroundSyncPlugin(
    QUEUE_NAME,
    {
      maxRetentionTime: 24 * 60, // minutes
    }
  );
  const manualQueue = new workbox.backgroundSync.Queue(QUEUE_NAME);

  // Queue POST/PUT/PATCH/DELETE to API when offline
  const queueableMethods = ["POST", "PUT", "PATCH", "DELETE"];
  workbox.routing.registerRoute(
    ({ url, request }) =>
      url.origin === API_ORIGIN && queueableMethods.includes(request.method),
    new workbox.strategies.NetworkOnly({ plugins: [bgSyncPlugin] }),
    queueableMethods
  );

  // Cache GET API responses for offline reads (stale while revalidate)
  workbox.routing.registerRoute(
    ({ url, request }) => url.origin === API_ORIGIN && request.method === "GET",
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: "api-get-cache",
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 300,
          maxAgeSeconds: 24 * 60 * 60,
        }),
      ],
    })
  );

  // Also cache same-origin GET requests (e.g., Next data requests)
  workbox.routing.registerRoute(
    ({ url, request }) =>
      url.origin === self.location.origin && request.method === "GET",
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: "same-origin-get",
    })
  );

  // Listen for client messages to enqueue write requests when app detects offline
  self.addEventListener("message", async (event) => {
    const data = event.data || {};
    if (data && data.type === "queue-request") {
      try {
        const reqInit = data.init || {};
        const req = new Request(data.url, reqInit);
        await manualQueue.pushRequest({ request: req });
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ ok: true });
        }
      } catch (e) {
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ ok: false, error: String(e) });
        }
      }
    }
  });
}
