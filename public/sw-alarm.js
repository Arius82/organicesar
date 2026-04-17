// sw-alarm.js — Service Worker for OrganiCésar
// Handles notifications and background alarm monitoring

const DB_NAME = 'OrganiCesarDB';
const STORE_NAME = 'alarms';
const CHECK_INTERVAL = 45000; // Check every 45s (budget friendly for SW)

// Helper for IndexedDB in SW
function getActiveAlarms() {
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME);
    request.onsuccess = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) return resolve([]);
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const getAll = store.getAll();
      getAll.onsuccess = () => resolve(getAll.result);
      getAll.onerror = () => resolve([]);
    };
    request.onerror = () => resolve([]);
  });
}

async function checkAlarms() {
  const alarms = await getActiveAlarms();
  if (!alarms || alarms.length === 0) return;

  const now = new Date();
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  const currentHHmm = `${h}:${m}`;
  const dateStr = now.toISOString().split('T')[0];
  const dayOfWeek = now.getDay();

  for (const alarm of alarms) {
    if (!alarm.ativo || alarm.hora !== currentHHmm) continue;

    // Check if task is due today
    if (alarm.excecoes && alarm.excecoes.includes(dateStr)) continue;

    let isDueToday = false;
    if (alarm.diasSemana && alarm.diasSemana.length > 0) {
      isDueToday = (
        dateStr >= alarm.dataCriacao &&
        dateStr <= alarm.dataLimite &&
        alarm.diasSemana.includes(dayOfWeek)
      );
    } else {
      isDueToday = alarm.dataLimite === dateStr;
    }

    if (isDueToday) {
      showAlarmNotification(alarm);
    }
  }
}

async function showAlarmNotification(alarm) {
  const title = `🔔 ALARME: ${alarm.titulo}`;
  const options = {
    body: alarm.descricao || 'Hora de realizar sua tarefa!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: `alarm-${alarm.id}`,
    renotify: true,
    requireInteraction: true,
    vibrate: [500, 200, 500, 200, 500, 200, 500, 200, 500],
    data: { taskId: alarm.id, alarmSom: alarm.som },
    actions: [
      { action: 'stop', title: 'Parar Alarme' },
      { action: 'open', title: 'Ver Tarefa' }
    ]
  };

  return self.registration.showNotification(title, options);
}

// Polling interval (best effort for SW)
setInterval(() => {
  checkAlarms();
}, CHECK_INTERVAL);

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const taskId = event.notification.data?.taskId;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Focus existing window
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if ('focus' in client) {
          client.focus();
          client.postMessage({ type: 'STOP_ALARM', taskId: taskId });
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

// Activate immediately
self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
});

// Listener for manual sync requests from UI
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SYNC_ALARMS') {
    checkAlarms();
  }
});
