import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useApp } from './AppContext';
import type { Task } from '@/types';

interface AlarmContextType {
  ringingTask: Task | null;
  stopAlarm: () => void;
  triggerAlarm: (task: Task) => void;
  soundOptions: { id: number; name: string; url: string }[];
}

const AlarmContext = createContext<AlarmContextType | null>(null);

export const useAlarms = () => {
  const ctx = useContext(AlarmContext);
  if (!ctx) throw new Error('useAlarms must be used within AlarmProvider');
  return ctx;
};

const SOUND_OPTIONS = [
  { id: 1, name: 'Digital Padrão', url: 'https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3' },
  { id: 2, name: 'Clássico',       url: 'https://assets.mixkit.co/sfx/preview/mixkit-classic-alarm-995.mp3' },
  { id: 3, name: 'Despertar',     url: 'https://assets.mixkit.co/sfx/preview/mixkit-morning-clock-alarm-1003.mp3' },
  { id: 4, name: 'Sinos Suaves',   url: 'https://assets.mixkit.co/sfx/preview/mixkit-modern-classic-door-bell-sound-121.mp3' },
  { id: 5, name: 'Natureza',       url: 'https://assets.mixkit.co/sfx/preview/mixkit-nature-birds-singing-24.mp3' },
];

export const AlarmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { tasks } = useApp();
  const [ringingTask, setRingingTask] = useState<Task | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastTriggeredRef = useRef<{ id: string; time: string } | null>(null);
  const isCurrentlyRinging = useRef(false);

  // Update ref when state changes
  useEffect(() => {
    isCurrentlyRinging.current = !!ringingTask;
  }, [ringingTask]);

  // Helper to check if task is visible today
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
    
    const sound = SOUND_OPTIONS.find(s => s.id === task.alarme_som) || SOUND_OPTIONS[0];
    if (audioRef.current) {
      audioRef.current.src = sound.url;
      audioRef.current.loop = true;
      audioRef.current.play().catch(err => console.error('Error playing alarm:', err));
    }

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`ALERTA: ${task.titulo}`, {
        body: task.descricao || 'Hora de realizar sua tarefa!',
        requireInteraction: true,
      });
    }

    if ('vibrate' in navigator) navigator.vibrate([500, 200, 500]);
  }, []);

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

    const interval = setInterval(checkAlarms, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, [tasks, triggerAlarm]);

  return (
    <AlarmContext.Provider value={{ ringingTask, stopAlarm, triggerAlarm, soundOptions: SOUND_OPTIONS }}>
      <audio ref={audioRef} />
      {children}
    </AlarmContext.Provider>
  );
};
