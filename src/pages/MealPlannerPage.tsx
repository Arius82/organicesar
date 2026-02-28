import { useApp } from '@/context/AppContext';
import { Coffee, Sun, Moon } from 'lucide-react';

const mealConfig = {
  cafe: { label: 'Café da Manhã', icon: Coffee, emoji: '☕' },
  almoco: { label: 'Almoço', icon: Sun, emoji: '🍽️' },
  jantar: { label: 'Jantar', icon: Moon, emoji: '🌙' },
};

const MealPlannerPage = () => {
  const { meals } = useApp();

  const grouped = meals.reduce((acc, meal) => {
    if (!acc[meal.data]) acc[meal.data] = [];
    acc[meal.data].push(meal);
    return acc;
  }, {} as Record<string, typeof meals>);

  const weekdays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([date, dayMeals]) => {
        const d = new Date(date + 'T12:00:00');
        return (
          <div key={date} className="animate-fade-in">
            <h3 className="font-display font-semibold text-foreground mb-3">
              {weekdays[d.getDay()]}, {d.toLocaleDateString('pt-BR')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(['cafe', 'almoco', 'jantar'] as const).map(type => {
                const meal = dayMeals.find(m => m.refeicao === type);
                const cfg = mealConfig[type];
                return (
                  <div key={type} className="glass-card rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{cfg.emoji}</span>
                      <h4 className="text-sm font-medium text-foreground">{cfg.label}</h4>
                    </div>
                    {meal ? (
                      <>
                        <p className="text-sm text-foreground">{meal.descricao}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {meal.ingredientes_relacionados.map(ing => (
                            <span key={ing} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{ing}</span>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Não planejado</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MealPlannerPage;
