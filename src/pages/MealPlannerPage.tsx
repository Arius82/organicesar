import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Coffee, Sun, Moon, Sparkles, Pencil, Trash2, X, Check, ChevronLeft, ChevronRight, Plus, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AddMealDialog from '@/components/AddMealDialog';
import AISuggestionDialog from '@/components/AISuggestionDialog';
import PageTransition from '@/components/PageTransition';
import { useNotifications } from '@/context/NotificationContext';
import { motion } from 'framer-motion';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const mealConfig = {
  cafe: { label: 'Café da Manhã', icon: Coffee, emoji: '☕' },
  almoco: { label: 'Almoço', icon: Sun, emoji: '🍽️' },
  jantar: { label: 'Jantar', icon: Moon, emoji: '🌙' },
};

const getWeekStart = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
};

const weekdaysShort = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const weekdaysFull = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

const MealPlannerPage = () => {
  const { meals, editMeal, deleteMeal, addMeal } = useApp();
  const { addNotification } = useNotifications();
  
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ descricao: '', ingredientes: '' });

  const currentWeekStart = getWeekStart(new Date());
  currentWeekStart.setDate(currentWeekStart.getDate() + weekOffset * 7);
  const weekEnd = new Date(currentWeekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  const selectedDayMeals = meals.filter(m => m.data === selectedDate);
  const selectedDateObj = new Date(selectedDate + 'T12:00:00');

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

  const handleCloneWeek = async () => {
    const mealsToClone = meals.filter(m => weekDates.includes(m.data));
    if (mealsToClone.length === 0) {
      addNotification('Nenhuma refeição para clonar nesta semana.', 'warning');
      return;
    }
    
    for (const m of mealsToClone) {
      const d = new Date(m.data + 'T12:00:00');
      d.setDate(d.getDate() + 7);
      const nextDateStr = d.toISOString().split('T')[0];
      
      const exists = meals.some(existing => existing.data === nextDateStr && existing.refeicao === m.refeicao);
      if (!exists) {
        await addMeal({
          data: nextDateStr,
          refeicao: m.refeicao as 'cafe' | 'almoco' | 'jantar',
          descricao: m.descricao,
          ingredientes_relacionados: m.ingredientes_relacionados,
        });
      }
    }
    addNotification('Semana copiada com sucesso para a próxima!', 'success');
  };

  return (
    <PageTransition>
      <div className="space-y-6 pb-20">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between mt-2">
            <h1 className="font-display text-2xl font-bold text-gray-900 tracking-tight">Cardápio</h1>
            
            <div className="flex items-center gap-2">
              <Button onClick={handleCloneWeek} variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-full" title="Clonar refeições desta semana para a próxima">
                <Copy className="w-4 h-4" />
              </Button>
              <AISuggestionDialog defaultDate={selectedDate}>
                <Button variant="outline" className="h-9 px-3 gap-1.5 border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 rounded-full shadow-sm">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="text-sm font-semibold tracking-wide hidden sm:inline">Sugestão IA</span>
                  <span className="text-sm font-semibold tracking-wide sm:hidden">IA</span>
                </Button>
              </AISuggestionDialog>
            </div>
          </div>
          
          {/* Calendar Strip */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-gray-600">
              <span className="text-sm font-medium capitalize">
                {currentWeekStart.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </span>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-900" onClick={() => { setWeekOffset(w => w - 1); setSelectedDate(''); }}>
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                {weekOffset !== 0 && (
                  <Button variant="ghost" size="sm" className="h-8 text-xs font-medium text-emerald-600" onClick={() => {
                    setWeekOffset(0);
                    setSelectedDate(new Date().toISOString().split('T')[0]);
                  }}>Hoje</Button>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-900" onClick={() => { setWeekOffset(w => w + 1); setSelectedDate(''); }}>
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 snap-x hide-scrollbar">
              {weekDates.map((date, idx) => {
                const d = new Date(date + 'T12:00:00');
                // if selectedDate is empty (just switched weeks), default to the first day of that week
                const isSelected = selectedDate ? date === selectedDate : idx === 0;
                if (!selectedDate && idx === 0) {
                  // minor side effect avoidance by doing it via effect in a real app, but here it's fine for simple sync
                  setTimeout(() => setSelectedDate(date), 0);
                }

                const isToday = date === new Date().toISOString().split('T')[0];
                
                return (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={`flex flex-col items-center justify-center min-w-[3.5rem] p-2.5 rounded-[1.25rem] snap-start transition-all border ${
                      isSelected 
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/20 scale-105'
                        : isToday
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-900'
                          : 'bg-white border-gray-100 text-gray-600 hover:border-gray-200'
                    }`}
                  >
                    <span className={`text-[10px] uppercase font-bold tracking-wider opacity-80 ${isSelected ? 'text-emerald-100' : ''}`}>
                      {weekdaysShort[d.getDay()]}
                    </span>
                    <span className={`text-lg font-display font-medium mt-1 ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                      {d.getDate()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Day View */}
        <motion.div
          key={selectedDate}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          <div className="flex flex-col">
            <h2 className="font-display text-lg font-semibold text-gray-900 leading-tight">
              {weekdaysFull[selectedDateObj.getDay()]}
            </h2>
            <p className="text-sm text-gray-500 capitalize">{selectedDateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}</p>
          </div>

          <div className="flex flex-col gap-4">
            {(['cafe', 'almoco', 'jantar'] as const).map(type => {
              const meal = selectedDayMeals.find(m => m.refeicao === type);
              const cfg = mealConfig[type];
              const isEditing = meal && editingId === meal.id;

              return (
                <div key={type} className="flex flex-col w-full">
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <span className="text-lg">{cfg.emoji}</span>
                    <h3 className="font-semibold text-gray-900 text-sm">{cfg.label}</h3>
                  </div>

                  {meal ? (
                    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm transition-all hover:shadow-md">
                      <div className="flex items-start justify-between gap-3">
                        {isEditing ? (
                          <div className="space-y-3 w-full">
                            <Textarea
                              value={editForm.descricao}
                              onChange={e => setEditForm(f => ({ ...f, descricao: e.target.value }))}
                              className="text-sm min-h-[80px] bg-gray-50/50 border-gray-200 focus-visible:ring-emerald-600 rounded-xl"
                              placeholder="Descrição da refeição"
                            />
                            <Input
                              value={editForm.ingredientes}
                              onChange={e => setEditForm(f => ({ ...f, ingredientes: e.target.value }))}
                              className="text-sm bg-gray-50/50 border-gray-200 focus-visible:ring-emerald-600 rounded-xl"
                              placeholder="Ingredientes separados por vírgula"
                            />
                            <div className="flex gap-2 justify-end pt-1">
                              <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-8 rounded-lg text-gray-500 hover:text-gray-700">
                                <X className="w-4 h-4 mr-1.5" /> Cancelar
                              </Button>
                              <Button size="sm" onClick={() => saveEdit(meal.id)} className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                                <Check className="w-4 h-4 mr-1.5" /> Salvar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex-1 min-w-0">
                              <p className="text-[15px] font-medium text-gray-800 leading-relaxed">{meal.descricao}</p>
                              {meal.ingredientes_relacionados.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-3">
                                  {meal.ingredientes_relacionados.map(ing => (
                                    <span key={ing} className="text-[10px] uppercase font-bold tracking-wider bg-gray-50 text-gray-500 border border-gray-100 px-2 py-0.5 rounded-full">
                                      {ing}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-col items-center gap-1 shrink-0 -mt-1 -mr-1">
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg" onClick={() => startEdit(meal)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-white border-0 shadow-xl rounded-2xl w-[90vw] sm:max-w-[400px]">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="font-display">Excluir refeição?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-gray-500">
                                      Tem certeza que deseja remover "{meal.descricao}" do cardápio?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="border-gray-200">Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(meal.id)} className="bg-red-500 hover:bg-red-600 text-white">
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <AddMealDialog defaultDate={selectedDate} defaultMeal={type as any}>
                      <button className="w-full h-24 border-2 border-dashed border-gray-200 bg-gray-50/50 hover:bg-gray-50 rounded-2xl flex flex-col items-center justify-center gap-2 transition-colors group">
                        <div className="w-8 h-8 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Plus className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider group-hover:text-emerald-600 transition-colors">
                          Adicionar Refeição
                        </span>
                      </button>
                    </AddMealDialog>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
      
      {/* Inject custom styles that aren't purely tailwind to hide scrollbar nicely */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>
    </PageTransition>
  );
};

export default MealPlannerPage;
