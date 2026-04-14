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

// Register the alarm service worker separately from the PWA service worker
async function registerAlarmSW(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw-alarm.js', { scope: '/' });
    console.log('[AlarmSW] Registered:', reg.scope);
    return reg;
  } catch (err) {
    console.error('[AlarmSW] Registration failed:', err);
    return null;
  }
}

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
  const lastTriggeredRef = useRef<{ id: string; time: string } | null>(null);
  const isCurrentlyRinging = useRef(false);
  const swRegRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    localStorage.setItem('alarm_muted', isMuted.toString());
  }, [isMuted]);

  // Update ref when state changes
  useEffect(() => {
    isCurrentlyRinging.current = !!ringingTask;
  }, [ringingTask]);

  // Register the alarm SW on mount
  useEffect(() => {
    registerAlarmSW().then(reg => {
      swRegRef.current = reg;
    });

    // Listen for messages from the SW (e.g., STOP_ALARM on notification click)
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'STOP_ALARM') {
        stopAlarm();
      }
    };
    navigator.serviceWorker?.addEventListener('message', handler);
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handler);
    };
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      setNotificationPermission('unsupported');
      return;
    }
    try {
      const result = await Notification.requestPermission();
      setNotificationPermission(result);
      console.log('[Alarm] Notification permission:', result);
    } catch (err) {
      console.error('[Alarm] Permission request error:', err);
    }
  }, []);

  // Auto-request notification permission after first user interaction
  useEffect(() => {
    if (notificationPermission !== 'default') return;

    const handleInteraction = () => {
      requestNotificationPermission();
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };

    // Small delay so the user has context before the permission popup
    const timer = setTimeout(() => {
      document.addEventListener('click', handleInteraction);
      document.addEventListener('touchstart', handleInteraction);
    }, 3000);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };
  }, [notificationPermission, requestNotificationPermission]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const initializeAudio = useCallback(() => {
    if (isAudioWarmedUp || !audioRef.current) return;
    
    // Play a tiny silent sound to unlock audio context in browsers
    const prevSrc = audioRef.current.src;
    audioRef.current.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA== ";
    audioRef.current.play()
      .then(() => {
        console.log('Audio Context Warmed Up Successfully');
        setIsAudioWarmedUp(true);
      })
      .catch(err => console.log('Warm up failed or deferred:', err))
      .finally(() => {
        audioRef.current!.src = prevSrc;
      });
  }, [isAudioWarmedUp]);

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

  const stopAlarm = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setRingingTask(null);
  }, []);

  const triggerAlarm = useCallback((task: Task) => {
    if (isCurrentlyRinging.current) return;

    setRingingTask(task);
    
    // Play audio in the foreground (when app is visible)
    if (!isMuted && audioRef.current) {
      const sound = SOUND_OPTIONS.find(s => s.id === task.alarme_som) || SOUND_OPTIONS[0];
      try {
        console.log('Triggering Alarm Sound:', sound.url);
        audioRef.current.src = sound.url;
        audioRef.current.load();
        audioRef.current.loop = true;
        audioRef.current.volume = 1.0;
        
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.error('Audio Playback Error:', err);
          });
        }
      } catch (e) {
        console.error('Audio Setup Error:', e);
      }
    }

    // Always send a persistent notification via Service Worker
    // This ensures the alarm is visible even when minimized
    if (swRegRef.current && notificationPermission === 'granted') {
      navigator.serviceWorker?.controller?.postMessage({
        type: 'SHOW_ALARM_NOW',
        taskId: task.id,
        taskTitle: task.titulo,
        taskDescription: task.descricao || 'Hora de realizar sua tarefa!',
      });

      // Fallback: use the SW registration directly
      swRegRef.current.showNotification(`🔔 ALARME: ${task.titulo}`, {
        body: task.descricao || 'Hora de realizar sua tarefa!',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: `alarm-${task.id}`,
        renotify: true,
        requireInteraction: true,
        vibrate: [500, 200, 500, 200, 500, 200, 500],
        data: { taskId: task.id },
      });
    } else if ('Notification' in window && Notification.permission === 'granted') {
      // Fallback to regular notification
      try {
        new Notification(`🔔 ALARME: ${task.titulo}`, {
          body: task.descricao || 'Hora de realizar sua tarefa!',
          requireInteraction: true,
          icon: '/icon-192.png',
        });
      } catch (e) {
        console.error('Notification fallback error:', e);
      }
    }

    if ('vibrate' in navigator) navigator.vibrate([500, 200, 500, 200, 500]);
  }, [isMuted, notificationPermission]);

  // Schedule alarms for tasks with active alarms whenever tasks change
  useEffect(() => {
    if (!tasks || !swRegRef.current) return;

    const now = new Date();
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    const currentHHmm = `${h}:${m}`;

    // Send upcoming alarms to the service worker for background firing
    tasks.forEach(task => {
      if (
        task.alarme_ativo &&
        task.status === 'pendente' &&
        isTaskDueToday(task) &&
        task.alarme_hora > currentHHmm
      ) {
        navigator.serviceWorker?.controller?.postMessage({
          type: 'SCHEDULE_ALARM',
          taskId: task.id,
          taskTitle: task.titulo,
          taskDescription: task.descricao || 'Hora de realizar sua tarefa!',
          alarmTime: task.alarme_hora,
          soundId: task.alarme_som,
        });
      }
    });
  }, [tasks]);

  // Foreground alarm check (interval-based, as before)
  useEffect(() => {
    const checkAlarms = () => {
      if (!tasks) return;
      
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
        const alreadyTriggered = lastTriggeredRef.current?.id === dueTask.id && lastTriggeredRef.current?.time === currentHHmm;
        if (!alreadyTriggered && !isCurrentlyRinging.current) {
          lastTriggeredRef.current = { id: dueTask.id, time: currentHHmm };
          triggerAlarm(dueTask);
        }
      }
    };

    const interval = setInterval(checkAlarms, 10000); 
    return () => clearInterval(interval);
  }, [tasks, triggerAlarm]);

  // Audio warm up effect
  useEffect(() => {
    if (isAudioWarmedUp) return;

    const handleInteraction = () => {
      initializeAudio();
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };

    document.addEventListener('click', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
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
