// alarm-worker.js — Dedicated Web Worker for alarm timing
// Web Workers are MORE reliable than main-thread timers when the tab is backgrounded

let alarmTasks = [];
let intervalId = null;

function checkAlarms() {
  const now = new Date();
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  const currentHHmm = `${h}:${m}`;
  const dateStr = now.toISOString().split('T')[0];
  const dayOfWeek = now.getDay();

  for (const task of alarmTasks) {
    if (task.alarme_hora !== currentHHmm) continue;
    if (task.status !== 'pendente') continue;
    if (!task.alarme_ativo) continue;

    // Check if task is due today
    let isDueToday = false;
    if (task.excecoes && task.excecoes.includes(dateStr)) continue;

    if (task.dias_semana && task.dias_semana.length > 0) {
      isDueToday = (
        dateStr >= task.data_criacao &&
        dateStr <= task.data_limite &&
        task.dias_semana.includes(dayOfWeek)
      );
    } else {
      isDueToday = task.data_limite === dateStr;
    }

    if (isDueToday) {
      // Post to main thread that this alarm is due
      self.postMessage({
        type: 'ALARM_DUE',
        taskId: task.id,
        taskTitle: task.titulo,
        taskDescription: task.descricao,
        alarmSom: task.alarme_som,
      });
    }
  }
}

self.onmessage = function(e) {
  if (e.data.type === 'UPDATE_TASKS') {
    alarmTasks = e.data.tasks || [];
  }

  if (e.data.type === 'START') {
    if (intervalId) clearInterval(intervalId);
    // Check every 15 seconds — Web Workers maintain this even in background
    intervalId = setInterval(checkAlarms, 15000);
    // Also check immediately
    checkAlarms();
  }

  if (e.data.type === 'STOP') {
    if (intervalId) clearInterval(intervalId);
    intervalId = null;
  }
};
