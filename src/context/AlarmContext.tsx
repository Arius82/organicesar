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
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastTriggeredRef = useRef<{ id: string; time: string } | null>(null);
  const isCurrentlyRinging = useRef(false);

  useEffect(() => {
    localStorage.setItem('alarm_muted', isMuted.toString());
  }, [isMuted]);

  // Update ref when state changes
  useEffect(() => {
    isCurrentlyRinging.current = !!ringingTask;
  }, [ringingTask]);

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
            // Fallback: If blocked, we might want to remind user to click
          });
        }
      } catch (e) {
        console.error('Audio Setup Error:', e);
      }
    }

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`ALERTA: ${task.titulo}`, {
          body: task.descricao || 'Hora de realizar sua tarefa!',
          requireInteraction: true,
        });
      } catch (e) {}
    }

    if ('vibrate' in navigator) navigator.vibrate([500, 200, 500]);
  }, [isMuted]);

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
      isAudioWarmedUp
    }}>
      <audio ref={audioRef} crossOrigin="anonymous" />
      {children}
    </AlarmContext.Provider>
  );
};
