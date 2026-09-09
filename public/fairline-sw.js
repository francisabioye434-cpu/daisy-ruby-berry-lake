/* Fairline desk worker — notifications without Grok. */
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type !== "NOTIFY") return;
  const title = data.title || "Fairline";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: data.tag || "fairline",
      renotify: Boolean(data.renotify),
      data: { url: data.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      for (const w of windows) {
        if ("focus" in w) {
          w.focus();
          if (w.url && "navigate" in w) w.navigate(url);
          return;
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    }),
  );
});

self.addEventListener("periodicsync", (event) => {
  if (event.tag !== "fairline-daily") return;
  event.waitUntil(
    self.registration.showNotification("Fairline daily", {
      body: "Open the desk — today’s possible tickets are waiting.",
      icon: "/icon-192.png",
      tag: "fairline-daily",
      data: { url: "/" },
    }),
  );
});
