import React, { useEffect, useState } from 'react';
import { useAlarms } from '@/context/AlarmContext';
import { Button } from '@/components/ui/button';
import { Bell, BellRing, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AlarmOverlay: React.FC = () => {
  const { ringingTask, stopAlarm } = useAlarms();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!ringingTask) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/95 backdrop-blur-xl p-6 text-center"
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[100px]"
          />
        </div>

        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
          transition={{ repeat: Infinity, duration: 0.5, repeatDelay: 1 }}
          className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-8 border-4 border-primary/20"
        >
          <BellRing className="w-12 h-12 text-primary" />
        </motion.div>

        <div className="space-y-2 mb-12 relative z-10">
          <p className="text-6xl font-display font-bold text-foreground">
            {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
            Alarme da Tarefa
          </p>
        </div>

        <div className="max-w-md w-full glass-card p-8 rounded-3xl border-2 border-primary/20 shadow-2xl relative z-10 mb-12">
          <h2 className="text-2xl font-display font-bold text-foreground mb-4">{ringingTask.titulo}</h2>
          {ringingTask.descricao && (
            <p className="text-muted-foreground mb-6 line-clamp-3">{ringingTask.descricao}</p>
          )}
          <div className="flex items-center justify-center gap-2 py-2 px-4 bg-primary/5 rounded-full inline-flex text-primary font-semibold text-sm">
            <Bell className="w-4 h-4" />
            <span>Toque: {ringingTask.alarme_hora}</span>
          </div>
        </div>

        <motion.div
           whileHover={{ scale: 1.05 }}
           whileTap={{ scale: 0.95 }}
           className="relative z-10"
        >
          <Button 
            onClick={stopAlarm}
            className="h-20 px-12 rounded-full text-xl font-bold gradient-primary text-primary-foreground shadow-[0_0_50px_rgba(var(--primary),0.5)] flex items-center gap-3"
          >
            <XCircle className="w-6 h-6" />
            PARAR ALARME
          </Button>
        </motion.div>

        <p className="mt-8 text-xs text-muted-foreground/60 animate-pulse">
          Toque no botão para interromper o alarme
        </p>
      </motion.div>
    </AnimatePresence>
  );
};

export default AlarmOverlay;
