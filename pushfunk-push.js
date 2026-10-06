/* Pushfunk – Push-Empfang im Service Worker (zentral gepflegt in ~/Projects/apps/pushfunk/public/pushfunk-push.js).
   In einen vorhandenen Service Worker einbinden mit  importScripts('pushfunk-push.js');
   Ohne diesen Empfänger zeigt iOS nur eine leere Meldung und kündigt das Abo irgendwann. */
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { text: e.data ? e.data.text() : '' }; }
  if (d.app === undefined && d.titel === undefined && d.id === undefined) return; // gehört nicht zu Pushfunk
  e.waitUntil(self.registration.showNotification(d.titel || 'Pushfunk', {
    body: d.text || '',
    tag: d.tag || d.id,
    renotify: true,
    icon: d.icon,
    data: { url: d.url || self.registration.scope, pushfunk: d.id },
  }));
});

self.addEventListener('notificationclick', (e) => {
  if (!e.notification.data || !('pushfunk' in e.notification.data)) return;
  e.notification.close();
  const url = new URL(e.notification.data.url || self.registration.scope, self.registration.scope).href;
  e.waitUntil((async () => {
    const fenster = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of fenster) {
      if (new URL(c.url).origin !== new URL(url).origin) continue;
      try { const neu = await c.navigate(url); if (neu) return neu.focus(); } catch {}
      break;
    }
    return self.clients.openWindow(url);
  })());
});
