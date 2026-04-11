import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Sparkles, Loader2, ChefHat } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNotifications } from '@/context/NotificationContext';
import { useApp } from '@/context/AppContext';
import { AnimatePresence, motion } from 'framer-motion';

interface MealSuggestion {
  title: string;
  description: string;
  ingredients: string[];
}

export default function AISuggestionDialog({ defaultDate = '', children }: { defaultDate?: string, children?: React.ReactNode }) {
  const { pantry, addMeal } = useApp();
  const { addNotification } = useNotifications();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [aiDate, setAiDate] = useState(defaultDate || new Date().toISOString().split('T')[0]);
  const [aiMealType, setAiMealType] = useState('almoco');
  const [suggestions, setSuggestions] = useState<MealSuggestion[]>([]);

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
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-md bg-white border-none shadow-xl rounded-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b border-gray-100 flex flex-row items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <DialogTitle className="font-display text-gray-900 text-lg font-semibold text-left">Sugestão com IA</DialogTitle>
            <p className="text-xs text-gray-500 mt-0.5 text-left">Gere ideias baseadas na sua despensa</p>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2.5">
              <Label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest block">Data</Label>
              <Input type="date" value={aiDate} onChange={e => setAiDate(e.target.value)} className="bg-gray-50/50 border-gray-200 focus-visible:ring-emerald-600 shadow-sm rounded-xl" />
            </div>
            <div className="space-y-2.5">
              <Label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest block">Refeição</Label>
              <Select value={aiMealType} onValueChange={setAiMealType}>
                <SelectTrigger className="bg-gray-50/50 border-gray-200 focus:ring-emerald-600 shadow-sm rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-gray-100 shadow-xl rounded-xl">
                  <SelectItem value="cafe" className="focus:bg-emerald-50 cursor-pointer">Café da Manhã</SelectItem>
                  <SelectItem value="almoco" className="focus:bg-emerald-50 cursor-pointer">Almoço</SelectItem>
                  <SelectItem value="jantar" className="focus:bg-emerald-50 cursor-pointer">Jantar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={handleSuggest} 
            disabled={loading} 
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 rounded-xl py-6 text-base font-medium transition-all active:scale-[0.98] mt-2 gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChefHat className="w-5 h-5" />}
            {loading ? 'Gerando ideias mágicas...' : 'Pedir Sugestões'}
          </Button>

          <AnimatePresence>
            {suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 pt-4 border-t border-gray-100"
              >
                {suggestions.map((s, i) => (
                  <motion.div
                    key={s.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-gray-50 border border-gray-100 rounded-xl p-4 transition-all hover:bg-white hover:shadow-sm"
                  >
                    <div className="flex flex-col gap-3">
                      <div>
                        <h4 className="font-display font-bold text-gray-900 text-sm">{s.title}</h4>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">{s.description}</p>
                      </div>
                      
                      <div className="flex flex-wrap gap-1.5">
                        {s.ingredients.map(ing => (
                          <span key={ing} className="text-[10px] uppercase font-medium tracking-wider bg-white text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full">
                            {ing}
                          </span>
                        ))}
                      </div>

                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleUseSuggestion(s)} 
                        className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg mt-1"
                      >
                        Adicionar ao Cardápio
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
