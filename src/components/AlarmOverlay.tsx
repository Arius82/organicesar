import React, { useEffect, useState } from 'react';
import { useAlarms } from '@/context/AlarmContext';
import { Button } from '@/components/ui/button';
import { Bell, BellRing, XCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AlarmOverlay: React.FC = () => {
  const { ringingTask, stopAlarm } = useAlarms();
  const [displayTime, setDisplayTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = now.getHours().toString().padStart(2, '0');
      const m = now.getMinutes().toString().padStart(2, '0');
      setDisplayTime(`${h}:${m}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!ringingTask) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-background/95 backdrop-blur-2xl p-6 text-center overflow-y-auto"
      >
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            animate={{ scale: [1, 1.4, 1], opacity: [0.1, 0.3, 0.1] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/30 rounded-full blur-[120px]"
          />
        </div>

        <div className="relative z-10 w-full max-w-lg flex flex-col items-center py-10">
          <motion.div
            animate={{ rotate: [0, -15, 15, -15, 15, 0], scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 0.8, repeatDelay: 1 }}
            className="w-28 h-28 rounded-full bg-primary/20 flex items-center justify-center mb-10 shadow-[0_0_40px_rgba(var(--primary),0.3)] border-2 border-primary/30"
          >
            <BellRing className="w-14 h-14 text-primary" />
          </motion.div>

          <div className="space-y-3 mb-12">
            <p className="text-7xl font-display font-black text-foreground tracking-tighter drop-shadow-sm">
              {displayTime}
            </p>
            <div className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
              <p className="text-sm font-bold text-primary uppercase tracking-[0.3em]">
                Alarme Ativo
              </p>
            </div>
          </div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full glass-card p-10 rounded-[2.5rem] border-2 border-primary/20 shadow-2xl mb-12 backdrop-blur-md"
          >
            <h2 className="text-3xl font-display font-bold text-foreground mb-4 leading-tight">{ringingTask.titulo}</h2>
            {ringingTask.descricao && (
              <p className="text-lg text-muted-foreground/80 mb-8 line-clamp-4 leading-relaxed italic">
                "{ringingTask.descricao}"
              </p>
            )}
            <div className="flex items-center justify-center gap-3 py-3 px-6 bg-primary/10 rounded-2xl inline-flex text-primary font-bold text-base">
              <Bell className="w-5 h-5" />
              <span>Programado para {ringingTask.alarme_hora}</span>
            </div>
          </motion.div>

          <motion.div
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             className="w-full px-4"
          >
            <Button 
              onClick={stopAlarm}
              className="h-24 w-full rounded-[2rem] text-2xl font-black gradient-primary text-primary-foreground shadow-[0_10px_40px_rgba(0,0,0,0.2)] flex items-center justify-center gap-4 border-b-8 border-primary transition-all active:border-b-0 active:translate-y-2"
            >
              <XCircle className="w-8 h-8" />
              PARAR ALARME
            </Button>
          </motion.div>

          <p className="mt-10 text-sm font-medium text-muted-foreground/60 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pressione para silenciar e fechar
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AlarmOverlay;
