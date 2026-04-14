/// <reference lib="webworker" />

// Custom Service Worker for OrganiCésar Alarm Notifications
// This runs independently of the main app thread

const sw = self as unknown as ServiceWorkerGlobalScope;

// Handle notification click
sw.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const data = event.notification.data;

  event.waitUntil(
    sw.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If there is already a window, focus it
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          // Send message to stop the alarm in the app
          client.postMessage({ type: 'STOP_ALARM', taskId: data?.taskId });
          return;
        }
      }
      // Otherwise open the app
      if (sw.clients.openWindow) {
        return sw.clients.openWindow('/tarefas');
      }
    })
  );
});

// Handle messages from the app
sw.addEventListener('message', (event) => {
  if (event.data?.type === 'SCHEDULE_ALARM') {
    const { taskId, taskTitle, taskDescription, alarmTime, soundId } = event.data;

    // Calculate delay in ms
    const now = new Date();
    const [hours, minutes] = alarmTime.split(':').map(Number);
    const target = new Date();
    target.setHours(hours, minutes, 0, 0);

    let delay = target.getTime() - now.getTime();
    if (delay < 0) delay += 24 * 60 * 60 * 1000; // next day

    // Use setTimeout in the SW (will work while app is in background)
    setTimeout(() => {
      sw.registration.showNotification(`🔔 ${taskTitle}`, {
        body: taskDescription || 'Hora de realizar sua tarefa!',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: `alarm-${taskId}`,
        renotify: true,
        requireInteraction: true,
        vibrate: [500, 200, 500, 200, 500],
        data: { taskId, soundId },
        actions: [
          { action: 'open', title: '📋 Ver Tarefa' },
          { action: 'dismiss', title: '✕ Dispensar' },
        ],
      });
    }, delay);
  }

  if (event.data?.type === 'SHOW_ALARM_NOW') {
    const { taskId, taskTitle, taskDescription } = event.data;

    sw.registration.showNotification(`🔔 ALARME: ${taskTitle}`, {
      body: taskDescription || 'Hora de realizar sua tarefa!',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: `alarm-${taskId}`,
      renotify: true,
      requireInteraction: true,
      vibrate: [500, 200, 500, 200, 500, 200, 500],
      data: { taskId },
      actions: [
        { action: 'open', title: '📋 Ver Tarefa' },
        { action: 'dismiss', title: '✕ Dispensar' },
      ],
    });
  }
});
