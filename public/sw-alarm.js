// sw-alarm.js — Service Worker for OrganiCésar
// Handles notification clicks and ensures notifications work in background

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Focus existing window if available
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if ('focus' in client) {
          client.focus();
          client.postMessage({ type: 'STOP_ALARM', taskId: event.notification.data?.taskId });
          return;
        }
      }
      // Open app if no window is available
      if (self.clients.openWindow) {
        return self.clients.openWindow('/tarefas');
      }
    })
  );
});

// Keep the service worker alive when it receives a message
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'KEEPALIVE') {
    // Simply acknowledge to keep the SW alive
    event.source?.postMessage({ type: 'ALIVE' });
  }
});

// Activate immediately
self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
});
