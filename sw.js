/* Crecer en la panza · funcionamiento sin conexión
   Si cambiás algo de la app, subí el número de versión para que los celulares se actualicen. */
const VERSION = "panza-v2";
const BASE = ["./", "index.html", "contenido.js", "manifest.json", "icons/icon-192.png", "icons/icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(claves => Promise.all(claves.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // La validación de la suscripción siempre va a internet
  if (url.hostname.includes("script.google.com") || url.hostname.includes("googleusercontent.com")) return;

  const esPagina = req.mode === "navigate" || url.pathname.endsWith(".html") || url.pathname.endsWith("contenido.js");
  if (esPagina) {
    // Primero internet (para recibir novedades), si no hay conexión, lo guardado
    e.respondWith(fetch(req).then(r => {
      const copia = r.clone(); caches.open(VERSION).then(c => c.put(req, copia)); return r;
    }).catch(() => caches.match(req).then(r => r || caches.match("index.html"))));
    return;
  }
  // Imágenes, fuentes y demás: primero lo guardado, si no está, internet
  e.respondWith(caches.match(req).then(guardado => guardado || fetch(req).then(r => {
    if (r.ok || r.type === "opaque") { const copia = r.clone(); caches.open(VERSION).then(c => c.put(req, copia)); }
    return r;
  })));
});
