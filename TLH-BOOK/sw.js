/* ═══ TLH Service Worker — network-first (แก้โค้ดแล้วเห็นใหม่ทันที ไม่ติดแคชเก่า) ═══ */
const CACHE = "tlh-shell-v1";
const SHELL = [
  "manifest.json", "img/icon.svg", "make-icons.html",
  "login.html", "timesheet.html", "profile.html",
  "css/variables.css", "css/base.css",
  "css/components/buttons.css", "css/components/badges.css",
  "css/components/avatars.css", "css/components/forms.css",
  "css/components/modals.css", "css/components/toast.css",
  "css/components/usertopbar.css",
  "css/pages/login.css", "css/pages/timesheet.css", "css/pages/profile.css",
  "js/data.js", "js/utils.js", "js/api.js",
  "js/components/icons.js", "js/components/auth.js", "js/components/toast.js",
  "js/components/modal.js", "js/components/camera.js", "js/components/install.js",
  "js/pages/login.js", "js/pages/timesheet.js", "js/pages/profile.js"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});