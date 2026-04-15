import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useApp } from './AppContext';
import type { Task } from '@/types';

interface AlarmContextType {
  ringingTask: Task | null;
  stopAlarm: () => void;
  triggerAlarm: (task: Task) => void;
  soundOptions: { id: number; name: string; url: string }[];
  isMuted: boolean;
  toggleMute: () => void;
  initializeAudio: () => void;
  isAudioWarmedUp: boolean;
  notificationPermission: NotificationPermission | 'unsupported';
  requestNotificationPermission: () => Promise<void>;
}

const AlarmContext = createContext<AlarmContextType | null>(null);

export const useAlarms = () => {
  const ctx = useContext(AlarmContext);
  if (!ctx) throw new Error('useAlarms must be used within AlarmProvider');
  return ctx;
};

const SOUND_OPTIONS = [
  { id: 1, name: 'Digital Bipe',    url: '/sounds/alarm.mp3' },
  { id: 2, name: 'Alarme Clássico', url: '/sounds/classic.mp3' },
  { id: 3, name: 'Sino Suave',      url: '/sounds/soft.mp3' },
];

export const AlarmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { tasks } = useApp();
  const [ringingTask, setRingingTask] = useState<Task | null>(null);
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem('alarm_muted');
    return saved === 'true';
  });
  const [isAudioWarmedUp, setIsAudioWarmedUp] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>(() => {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
  });
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastTriggeredRef = useRef<string | null>(null); // "taskId:HH:mm"
  const isCurrentlyRinging = useRef(false);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    localStorage.setItem('alarm_muted', isMuted.toString());
  }, [isMuted]);

  useEffect(() => {
    isCurrentlyRinging.current = !!ringingTask;
  }, [ringingTask]);

  // ────────────────────────────────────────────
  // 1. DEDICATED WEB WORKER for background timing
  // ────────────────────────────────────────────
  useEffect(() => {
    try {
      const worker = new Worker('/alarm-worker.js');
      workerRef.current = worker;

      worker.onmessage = (e) => {
        if (e.data.type === 'ALARM_DUE') {
          const key = `${e.data.taskId}:${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}`;
          if (lastTriggeredRef.current === key || isCurrentlyRinging.current) return;
          lastTriggeredRef.current = key;

          const task = tasks.find(t => t.id === e.data.taskId);
          if (task) {
            triggerAlarmInternal(task);
          } else {
            // Task might not be loaded yet, use data from worker
            showBackgroundNotification(e.data.taskTitle, e.data.taskDescription, e.data.taskId);
          }
        }
      };

      worker.postMessage({ type: 'START' });

      return () => {
        worker.postMessage({ type: 'STOP' });
        worker.terminate();
        workerRef.current = null;
      };
    } catch (err) {
      console.error('[Alarm] Web Worker failed:', err);
    }
  }, []); // Only create worker once

  // Send updated tasks to the worker whenever they change
  useEffect(() => {
    if (!workerRef.current || !tasks) return;

    // Only send alarm-relevant data to the worker (lightweight)
    const alarmTasks = tasks
      .filter(t => t.alarme_ativo && t.status === 'pendente')
      .map(t => ({
        id: t.id,
        titulo: t.titulo,
        descricao: t.descricao,
        alarme_ativo: t.alarme_ativo,
        alarme_hora: t.alarme_hora,
        alarme_som: t.alarme_som,
        status: t.status,
        data_limite: t.data_limite,
        data_criacao: t.data_criacao,
        dias_semana: t.dias_semana,
        excecoes: t.excecoes,
      }));

    workerRef.current.postMessage({ type: 'UPDATE_TASKS', tasks: alarmTasks });
  }, [tasks]);

  // ────────────────────────────────────────────
  // 2. VISIBILITY CHANGE — fire pending alarms when returning to app
  // ────────────────────────────────────────────
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && tasks) {
        // Check if any alarm was missed while in background
        const now = new Date();
        const h = now.getHours().toString().padStart(2, '0');
        const m = now.getMinutes().toString().padStart(2, '0');
        const currentHHmm = `${h}:${m}`;

        const dueTask = tasks.find(t =>
          t.alarme_ativo &&
          t.alarme_hora === currentHHmm &&
          t.status === 'pendente' &&
          isTaskDueToday(t)
        );

        if (dueTask) {
          const key = `${dueTask.id}:${currentHHmm}`;
          if (lastTriggeredRef.current !== key && !isCurrentlyRinging.current) {
            lastTriggeredRef.current = key;
            triggerAlarmInternal(dueTask);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [tasks]);

  // ────────────────────────────────────────────
  // 3. FOREGROUND interval (backup for when Worker isn't supported)
  // ────────────────────────────────────────────
  useEffect(() => {
    const checkAlarms = () => {
      if (!tasks || document.visibilityState === 'hidden') return;
      
      const now = new Date();
      const h = now.getHours().toString().padStart(2, '0');
      const m = now.getMinutes().toString().padStart(2, '0');
      const currentHHmm = `${h}:${m}`;
      
      const dueTask = tasks.find(t => 
        t.alarme_ativo && 
        t.alarme_hora === currentHHmm && 
        isTaskDueToday(t) &&
        t.status === 'pendente'
      );

      if (dueTask) {
        const key = `${dueTask.id}:${currentHHmm}`;
        if (lastTriggeredRef.current !== key && !isCurrentlyRinging.current) {
          lastTriggeredRef.current = key;
          triggerAlarmInternal(dueTask);
        }
      }
    };

    const interval = setInterval(checkAlarms, 10000);
    return () => clearInterval(interval);
  }, [tasks]);

  // ────────────────────────────────────────────
  // NOTIFICATION PERMISSION
  // ────────────────────────────────────────────
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      setNotificationPermission('unsupported');
      return;
    }
    try {
      const result = await Notification.requestPermission();
      setNotificationPermission(result);
    } catch (err) {
      console.error('[Alarm] Permission error:', err);
    }
  }, []);

  // Auto-request after first user interaction
  useEffect(() => {
    if (notificationPermission !== 'default') return;

    const handler = () => {
      requestNotificationPermission();
      document.removeEventListener('click', handler);
      document.removeEventListener('touchstart', handler);
    };

    const timer = setTimeout(() => {
      document.addEventListener('click', handler);
      document.addEventListener('touchstart', handler);
    }, 3000);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [notificationPermission, requestNotificationPermission]);

  // ────────────────────────────────────────────
  // HELPERS
  // ────────────────────────────────────────────
  const isTaskDueToday = (task: Task): boolean => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    if (task.excecoes?.includes(dateStr)) return false;

    if (task.dias_semana && task.dias_semana.length > 0) {
      return (
        dateStr >= task.data_criacao &&
        dateStr <= task.data_limite &&
        task.dias_semana.includes(now.getDay())
      );
    }
    return task.data_limite === dateStr;
  };

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const initializeAudio = useCallback(() => {
    if (isAudioWarmedUp || !audioRef.current) return;
    audioRef.current.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==";
    audioRef.current.play()
      .then(() => setIsAudioWarmedUp(true))
      .catch(() => {})
      .finally(() => { if (audioRef.current) audioRef.current.src = ''; });
  }, [isAudioWarmedUp]);

  const stopAlarm = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setRingingTask(null);
  }, []);

  // Show notification via SW registration (works even in background)
  const showBackgroundNotification = useCallback(async (title: string, body: string, taskId: string) => {
    if (Notification.permission !== 'granted') return;

    try {
      const reg = await navigator.serviceWorker?.ready;
      if (reg) {
        await reg.showNotification(`🔔 ALARME: ${title}`, {
          body: body || 'Hora de realizar sua tarefa!',
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: `alarm-${taskId}`,
          renotify: true,
          requireInteraction: true,
          vibrate: [500, 200, 500, 200, 500, 200, 500],
          data: { taskId },
        });
      }
    } catch (err) {
      // Fallback: basic Notification API
      try {
        new Notification(`🔔 ${title}`, {
          body: body || 'Hora de realizar sua tarefa!',
          icon: '/icon-192.png',
          requireInteraction: true,
        });
      } catch (e) {}
    }
  }, []);

  // Core alarm trigger function
  const triggerAlarmInternal = useCallback((task: Task) => {
    if (isCurrentlyRinging.current) return;

    console.log('[Alarm] 🔔 TRIGGERING:', task.titulo);
    setRingingTask(task);

    // 1. Play audio (foreground only)
    if (!isMuted && audioRef.current) {
      const sound = SOUND_OPTIONS.find(s => s.id === task.alarme_som) || SOUND_OPTIONS[0];
      try {
        audioRef.current.src = sound.url;
        audioRef.current.load();
        audioRef.current.loop = true;
        audioRef.current.volume = 1.0;
        audioRef.current.play().catch(() => {});
      } catch (e) {}
    }

    // 2. Show persistent notification (works even in background!)
    showBackgroundNotification(task.titulo, task.descricao, task.id);

    // 3. Vibrate device
    if ('vibrate' in navigator) {
      navigator.vibrate([500, 200, 500, 200, 500, 200, 500]);
    }
  }, [isMuted, showBackgroundNotification]);

  // Public-facing triggerAlarm (for manual triggers)
  const triggerAlarm = useCallback((task: Task) => {
    triggerAlarmInternal(task);
  }, [triggerAlarmInternal]);

  // Audio warm up on first interaction
  useEffect(() => {
    if (isAudioWarmedUp) return;

    const handler = () => {
      initializeAudio();
      document.removeEventListener('click', handler);
      document.removeEventListener('touchstart', handler);
    };

    document.addEventListener('click', handler);
    document.addEventListener('touchstart', handler);

    return () => {
      document.removeEventListener('click', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [initializeAudio, isAudioWarmedUp]);

  return (
    <AlarmContext.Provider value={{ 
      ringingTask, 
      stopAlarm, 
      triggerAlarm, 
      soundOptions: SOUND_OPTIONS,
      isMuted,
      toggleMute,
      initializeAudio,
      isAudioWarmedUp,
      notificationPermission,
      requestNotificationPermission,
    }}>
      <audio ref={audioRef} crossOrigin="anonymous" />
      {children}
    </AlarmContext.Provider>
  );
};
