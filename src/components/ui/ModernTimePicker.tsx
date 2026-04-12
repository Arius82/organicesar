import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, Clock } from 'lucide-react';
import { Input } from './input';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface ModernTimePickerProps {
  value: string; // HH:mm
  onChange: (value: string) => void;
  className?: string;
}

const ModernTimePicker: React.FC<ModernTimePickerProps> = ({ value, onChange, className }) => {
  const [hours, setHours] = useState('08');
  const [minutes, setMinutes] = useState('00');

  useEffect(() => {
    if (value && value.includes(':')) {
      const [h, m] = value.split(':');
      setHours(h.padStart(2, '0'));
      setMinutes(m.padStart(2, '0'));
    }
  }, [value]);

  const updateTime = (h: string, m: string) => {
    const formattedH = h.padStart(2, '0');
    const formattedM = m.padStart(2, '0');
    onChange(`${formattedH}:${formattedM}`);
  };

  const adjustHours = (delta: number) => {
    let newH = parseInt(hours) + delta;
    if (newH > 23) newH = 0;
    if (newH < 0) newH = 23;
    const hStr = newH.toString().padStart(2, '0');
    setHours(hStr);
    updateTime(hStr, minutes);
  };

  const adjustMinutes = (delta: number) => {
    let newM = parseInt(minutes) + delta;
    if (newM > 59) newM = 0;
    if (newM < 0) newM = 59;
    const mStr = newM.toString().padStart(2, '0');
    setMinutes(mStr);
    updateTime(hours, mStr);
  };

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').slice(-2);
    let num = parseInt(val) || 0;
    if (num > 23) num = 23;
    const hStr = num.toString().padStart(2, '0');
    setHours(hStr);
    updateTime(hStr, minutes);
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').slice(-2);
    let num = parseInt(val) || 0;
    if (num > 59) num = 59;
    const mStr = num.toString().padStart(2, '0');
    setMinutes(mStr);
    updateTime(hours, mStr);
  };

  return (
    <div className={cn("flex items-center gap-3 p-3 bg-primary/5 rounded-2xl border-2 border-primary/10 w-fit", className)}>
      <Clock className="w-5 h-5 text-primary opacity-70" />
      
      <div className="flex items-center gap-1">
        {/* Hours Column */}
        <div className="flex flex-col items-center">
          <Button 
            type="button" variant="ghost" size="icon" className="h-6 w-8 hover:bg-primary/10"
            onClick={() => adjustHours(1)}
          >
            <ChevronUp className="w-4 h-4" />
          </Button>
          <Input 
            type="text"
            inputMode="numeric"
            value={hours}
            onChange={handleHourChange}
            className="w-12 h-10 text-center font-bold text-lg p-0 bg-background border-primary/20 focus:border-primary transition-all"
          />
          <Button 
            type="button" variant="ghost" size="icon" className="h-6 w-8 hover:bg-primary/10"
            onClick={() => adjustHours(-1)}
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>

        <span className="text-2xl font-bold text-primary animate-pulse">:</span>

        {/* Minutes Column */}
        <div className="flex flex-col items-center">
          <Button 
            type="button" variant="ghost" size="icon" className="h-6 w-8 hover:bg-primary/10"
            onClick={() => adjustMinutes(1)}
          >
            <ChevronUp className="w-4 h-4" />
          </Button>
          <Input 
            type="text"
            inputMode="numeric"
            value={minutes}
            onChange={handleMinuteChange}
            className="w-12 h-10 text-center font-bold text-lg p-0 bg-background border-primary/20 focus:border-primary transition-all"
          />
          <Button 
            type="button" variant="ghost" size="icon" className="h-6 w-8 hover:bg-primary/10"
            onClick={() => adjustMinutes(-1)}
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="hidden sm:block pl-2 border-l border-primary/10">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Format 24h</span>
      </div>
    </div>
  );
};

export default ModernTimePicker;
