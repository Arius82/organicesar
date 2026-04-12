import { cn } from '@/lib/utils';

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

interface WeekdayPickerProps {
  value: number[];
  onChange: (days: number[]) => void;
  label?: string;
}

/**
 * Seletor de dias da semana.
 * value: array de índices (0=Dom, 1=Seg, ..., 6=Sáb)
 */
const WeekdayPicker = ({ value, onChange, label = 'Dias da semana' }: WeekdayPickerProps) => {
  const toggle = (day: number) => {
    onChange(value.includes(day) ? value.filter(d => d !== day) : [...value, day].sort());
  };

  return (
    <div className="space-y-2">
      {label && (
        <p className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </p>
      )}
      <div className="flex gap-1.5">
        {DAYS.map((name, idx) => {
          const active = value.includes(idx);
          return (
            <button
              key={idx}
              type="button"
              onClick={() => toggle(idx)}
              className={cn(
                'flex-1 h-9 rounded-lg text-xs font-semibold transition-all duration-150 select-none',
                active
                  ? 'gradient-primary text-primary-foreground shadow-md scale-105'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              )}
              title={name}
            >
              {name}
            </button>
          );
        })}
      </div>
      {value.length === 0 && (
        <p className="text-xs text-muted-foreground">Nenhum dia selecionado — selecione ao menos um</p>
      )}
    </div>
  );
};

export default WeekdayPicker;
