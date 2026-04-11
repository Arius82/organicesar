import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Coffee, Sun, Moon, Sparkles, Loader2, ChefHat, Pencil, Trash2, X, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AddMealDialog from '@/components/AddMealDialog';
import PageTransition from '@/components/PageTransition';
import { supabase } from '@/integrations/supabase/client';
import { useNotifications } from '@/context/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

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

const getWeekStart = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
};

const MealPlannerPage = () => {
  const { meals, pantry, isMaster, addMeal, editMeal, deleteMeal } = useApp();
  const { addNotification } = useNotifications();
  const [suggestions, setSuggestions] = useState<MealSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiMealType, setAiMealType] = useState<string>('almoco');
  const [aiDate, setAiDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ descricao: '', ingredientes: '' });
  const [weekOffset, setWeekOffset] = useState(0);

  const currentWeekStart = getWeekStart(new Date());
  currentWeekStart.setDate(currentWeekStart.getDate() + weekOffset * 7);
  const weekEnd = new Date(currentWeekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  const weekMeals = meals.filter(m => weekDates.includes(m.data));

  const grouped = weekMeals.reduce((acc, meal) => {
    if (!acc[meal.data]) acc[meal.data] = [];
    acc[meal.data].push(meal);
    return acc;
  }, {} as Record<string, typeof meals>);

  // Show all days of the week, even empty ones
  const allGrouped = weekDates.reduce((acc, date) => {
    acc[date] = grouped[date] || [];
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

  const startEdit = (meal: typeof meals[0]) => {
    setEditingId(meal.id);
    setEditForm({
      descricao: meal.descricao,
      ingredientes: meal.ingredientes_relacionados.join(', '),
    });
  };

  const saveEdit = (mealId: string) => {
    const ingredientes = editForm.ingredientes
      .split(',')
      .map(i => i.trim())
      .filter(Boolean);
    editMeal(mealId, {
      descricao: editForm.descricao,
      ingredientes_relacionados: ingredientes,
    });
    setEditingId(null);
    addNotification('Refeição atualizada!', 'success');
  };

  const handleDelete = (mealId: string) => {
    deleteMeal(mealId);
    addNotification('Refeição removida do cardápio', 'success');
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekOffset(w => w - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs sm:text-sm font-medium text-foreground text-center">
                {currentWeekStart.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} — {weekEnd.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekOffset(w => w + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              {weekOffset !== 0 && (
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setWeekOffset(0)}>Hoje</Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{weekMeals.length} refeições</p>
          </div>
          <AddMealDialog />
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
        {Object.entries(allGrouped).map(([date, dayMeals]) => {
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
                  const isEditing = meal && editingId === meal.id;
                  return (
                    <motion.div
                      key={type}
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                      className="glass-card rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{cfg.emoji}</span>
                          <h4 className="text-sm font-medium text-foreground">{cfg.label}</h4>
                        </div>
                        {meal && !isEditing && (
                          <div className="flex items-center gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(meal)}>
                              <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-7 w-7">
                                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir refeição?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja remover "{meal.descricao}" do cardápio?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(meal.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                      </div>
                      {meal ? (
                        isEditing ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editForm.descricao}
                              onChange={e => setEditForm(f => ({ ...f, descricao: e.target.value }))}
                              className="text-sm min-h-[60px]"
                              placeholder="Descrição da refeição"
                            />
                            <Input
                              value={editForm.ingredientes}
                              onChange={e => setEditForm(f => ({ ...f, ingredientes: e.target.value }))}
                              className="text-sm"
                              placeholder="Ingredientes separados por vírgula"
                            />
                            <div className="flex gap-1.5 justify-end">
                              <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-7 px-2 text-xs">
                                <X className="w-3.5 h-3.5 mr-1" /> Cancelar
                              </Button>
                              <Button size="sm" onClick={() => saveEdit(meal.id)} className="h-7 px-2 text-xs gradient-primary text-primary-foreground">
                                <Check className="w-3.5 h-3.5 mr-1" /> Salvar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm text-foreground">{meal.descricao}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {meal.ingredientes_relacionados.map(ing => (
                                <span key={ing} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{ing}</span>
                              ))}
                            </div>
                          </>
                        )
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
