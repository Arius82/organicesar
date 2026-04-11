import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useNotifications } from '@/context/NotificationContext';
import type { MealType } from '@/types';

interface Props {
  defaultDate?: string;
  defaultMeal?: MealType;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

export default function AddMealDialog({ defaultDate, defaultMeal, open: controlledOpen, onOpenChange, children }: Props) {
  const { addMeal } = useApp();
  const { addNotification } = useNotifications();
  const [internalOpen, setInternalOpen] = useState(false);
  
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled && onOpenChange ? onOpenChange : setInternalOpen;

  const [form, setForm] = useState({
    data: defaultDate || new Date().toISOString().split('T')[0],
    refeicao: defaultMeal || ('almoco' as MealType),
    descricao: '',
    ingrediente: '',
  });
  const [ingredientes, setIngredientes] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setForm(f => ({
        ...f,
        data: defaultDate || new Date().toISOString().split('T')[0],
        refeicao: defaultMeal || 'almoco',
        descricao: '',
      }));
      setIngredientes([]);
    }
  }, [open, defaultDate, defaultMeal]);

  const addIngrediente = () => {
    if (form.ingrediente.trim() && !ingredientes.includes(form.ingrediente.trim())) {
      setIngredientes(prev => [...prev, form.ingrediente.trim()]);
      setForm(f => ({ ...f, ingrediente: '' }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.data || !form.descricao.trim()) return;
    addMeal({
      data: form.data,
      refeicao: form.refeicao,
      descricao: form.descricao.trim(),
      ingredientes_relacionados: ingredientes,
    });
    const labels = { cafe: 'Café da Manhã', almoco: 'Almoço', jantar: 'Jantar' };
    addNotification(`${labels[form.refeicao]} adicionado ao cardápio`, 'success');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-md bg-white border-none shadow-xl rounded-2xl">
        <DialogHeader className="pb-4 border-b border-gray-100">
          <DialogTitle className="font-display text-gray-900 text-xl font-semibold">Planejar Refeição</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2.5">
              <Label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest block">Data</Label>
              <Input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} required className="bg-gray-50/50 border-gray-200 focus-visible:ring-emerald-600 shadow-sm rounded-xl py-5" />
            </div>
            <div className="space-y-2.5">
              <Label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest block">Refeição</Label>
              <Select value={form.refeicao} onValueChange={v => setForm(f => ({ ...f, refeicao: v as MealType }))}>
                <SelectTrigger className="bg-gray-50/50 border-gray-200 focus:ring-emerald-600 shadow-sm rounded-xl py-5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-gray-100 shadow-xl rounded-xl">
                  <SelectItem value="cafe" className="focus:bg-emerald-50 py-2.5 cursor-pointer">☕ Café da Manhã</SelectItem>
                  <SelectItem value="almoco" className="focus:bg-emerald-50 py-2.5 cursor-pointer">🍽️ Almoço</SelectItem>
                  <SelectItem value="jantar" className="focus:bg-emerald-50 py-2.5 cursor-pointer">🌙 Jantar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2.5">
            <Label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest block">Descrição do Prato</Label>
            <Textarea 
              value={form.descricao} 
              onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} 
              placeholder="Ex: Filé de frango grelhado com salada de folhas e arroz" 
              required 
              maxLength={300}
              className="resize-none h-24 bg-gray-50/50 border-gray-200 focus-visible:ring-emerald-600 shadow-sm rounded-xl placeholder:text-gray-400 py-3"
            />
          </div>

          <div className="space-y-2.5">
            <Label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest block">Ingredientes</Label>
            <div className="flex gap-2 relative">
              <Input 
                value={form.ingrediente} 
                onChange={e => setForm(f => ({ ...f, ingrediente: e.target.value }))} 
                placeholder="Adicionar ingrediente (opcional)" 
                maxLength={50}
                className="bg-gray-50/50 border-gray-200 focus-visible:ring-emerald-600 shadow-sm rounded-xl pr-12 py-5"
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addIngrediente(); } }} 
              />
              <button 
                type="button" 
                onClick={addIngrediente}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors p-1.5 rounded-md hover:bg-emerald-50"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            
            {ingredientes.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 p-3 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 min-h-[56px]">
                {ingredientes.map(ing => (
                  <span key={ing} className="text-sm bg-white text-gray-700 pl-3 pr-1 py-1 rounded-full flex items-center gap-1.5 border border-gray-100 shadow-sm transition-all hover:border-gray-200">
                    {ing}
                    <button type="button" onClick={() => setIngredientes(prev => prev.filter(i => i !== ing))} className="text-gray-300 hover:text-red-500 rounded-full hover:bg-red-50 p-1 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <div className="pt-2">
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200/50 rounded-xl py-6 text-base font-medium transition-all active:scale-[0.98]">
              Salvar Refeição
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
