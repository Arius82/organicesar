import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Coffee, Sun, Moon, Sparkles, Loader2, ChefHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AddMealDialog from '@/components/AddMealDialog';
import PageTransition from '@/components/PageTransition';
import { supabase } from '@/integrations/supabase/client';
import { useNotifications } from '@/context/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';

const mealConfig = {
  cafe: { label: 'Café da Manhã', icon: Coffee, emoji: '☕' },
  almoco: { label: 'Almoço', icon: Sun, emoji: '🍽️' },
  jantar: { label: 'Jantar', icon: Moon, emoji: '🌙' },
};

interface MealSuggestion {
  title: string;
  description: string;
  ingredients: string[];
}

const MealPlannerPage = () => {
  const { meals, pantry, isMaster, addMeal } = useApp();
  const { addNotification } = useNotifications();
  const [suggestions, setSuggestions] = useState<MealSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiMealType, setAiMealType] = useState<string>('almoco');
  const [aiDate, setAiDate] = useState(new Date().toISOString().split('T')[0]);

  const grouped = meals.reduce((acc, meal) => {
    if (!acc[meal.data]) acc[meal.data] = [];
    acc[meal.data].push(meal);
    return acc;
  }, {} as Record<string, typeof meals>);

  const weekdays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  const handleSuggest = async () => {
    setLoading(true);
    setSuggestions([]);
    try {
      const pantryItems = pantry.map(p => p.nome_item);
      const { data, error } = await supabase.functions.invoke('suggest-meals', {
        body: { pantryItems, mealType: aiMealType, date: aiDate },
      });
      if (error) throw error;
      if (data?.suggestions) {
        setSuggestions(data.suggestions);
      } else if (data?.error) {
        addNotification(data.error, 'warning');
      }
    } catch (err: any) {
      console.error('AI suggestion error:', err);
      addNotification('Erro ao gerar sugestões de cardápio', 'warning');
    }
    setLoading(false);
  };

  const handleUseSuggestion = (s: MealSuggestion) => {
    addMeal({
      data: aiDate,
      refeicao: aiMealType as 'cafe' | 'almoco' | 'jantar',
      descricao: `${s.title} - ${s.description}`,
      ingredientes_relacionados: s.ingredients,
    });
    addNotification(`"${s.title}" adicionado ao cardápio!`, 'success');
    setSuggestions(prev => prev.filter(x => x !== s));
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{meals.length} refeições planejadas</p>
          {isMaster && <AddMealDialog />}
        </div>

        {/* AI Suggestion Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-xl p-5 space-y-4 border-primary/20"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-foreground text-sm">Sugestão com IA</h3>
              <p className="text-xs text-muted-foreground">Gere ideias de refeições baseadas na sua despensa</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Data</Label>
              <Input type="date" value={aiDate} onChange={e => setAiDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Refeição</Label>
              <Select value={aiMealType} onValueChange={setAiMealType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cafe">Café da Manhã</SelectItem>
                  <SelectItem value="almoco">Almoço</SelectItem>
                  <SelectItem value="jantar">Jantar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleSuggest} disabled={loading} className="w-full gradient-primary text-primary-foreground gap-1.5">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChefHat className="w-4 h-4" />}
                {loading ? 'Gerando...' : 'Sugerir'}
              </Button>
            </div>
          </div>

          <AnimatePresence>
            {suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 overflow-hidden"
              >
                {suggestions.map((s, i) => (
                  <motion.div
                    key={s.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-muted/50 rounded-lg p-4 border border-border/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-display font-semibold text-foreground text-sm">{s.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{s.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {s.ingredients.map(ing => (
                            <span key={ing} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{ing}</span>
                          ))}
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => handleUseSuggestion(s)} className="shrink-0 text-xs">
                        Usar
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Existing Meals */}
        {Object.entries(grouped).map(([date, dayMeals]) => {
          const d = new Date(date + 'T12:00:00');
          return (
            <motion.div
              key={date}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="font-display font-semibold text-foreground mb-3">
                {weekdays[d.getDay()]}, {d.toLocaleDateString('pt-BR')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {(['cafe', 'almoco', 'jantar'] as const).map(type => {
                  const meal = dayMeals.find(m => m.refeicao === type);
                  const cfg = mealConfig[type];
                  return (
                    <motion.div
                      key={type}
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                      className="glass-card rounded-xl p-4"
                    >
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
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>
    </PageTransition>
  );
};

export default MealPlannerPage;
