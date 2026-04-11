import { useState, useEffect, useRef } from 'react';
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
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Props {
  defaultDate?: string;
  defaultMeal?: MealType;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

export default function AddMealDialog({ defaultDate, defaultMeal, open: controlledOpen, onOpenChange, children }: Props) {
  const { addMeal, pantry, addShoppingItem } = useApp();
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
  
  // Shopping list prompt state
  const [showShoppingPrompt, setShowShoppingPrompt] = useState(false);
  const [missingItems, setMissingItems] = useState<string[]>([]);

  // Autocomplete UI state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setForm(f => ({
        ...f,
        data: defaultDate || new Date().toISOString().split('T')[0],
        refeicao: defaultMeal || 'almoco',
        descricao: '',
      }));
      setIngredientes([]);
      setShowShoppingPrompt(false);
      setMissingItems([]);
    }
  }, [open, defaultDate, defaultMeal]);

  // Click outside to close autocomplete
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addIngrediente = (ing?: string) => {
    const toAdd = (ing || form.ingrediente).trim();
    if (toAdd && !ingredientes.includes(toAdd)) {
      setIngredientes(prev => [...prev, toAdd]);
      setForm(f => ({ ...f, ingrediente: '' }));
      setShowSuggestions(false);
    }
  };

  const filteredPantry = form.ingrediente 
    ? pantry.filter(p => p.nome_item.toLowerCase().includes(form.ingrediente.toLowerCase()) && !ingredientes.includes(p.nome_item))
    : [];

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.data || !form.descricao.trim()) return;

    // Check against pantry
    const missing = ingredientes.filter(ing => 
      !pantry.some(p => p.nome_item.toLowerCase() === ing.toLowerCase())
    );

    if (missing.length > 0) {
      setMissingItems(missing);
      setShowShoppingPrompt(true);
    } else {
      executeSave([]);
    }
  };

  const executeSave = async (itemsToBuy: string[]) => {
    await addMeal({
      data: form.data,
      refeicao: form.refeicao,
      descricao: form.descricao.trim(),
      ingredientes_relacionados: ingredientes,
    });
    
    // Add missing items to shopping list if any
    if (itemsToBuy.length > 0) {
      // Loop sequence to preserve reactivity via Context
      for (const item of itemsToBuy) {
        await addShoppingItem({ nome_item: item, quantidade: 1 });
      }
      addNotification('Refeição salva e itens adicionados à lista de compras!', 'success');
    } else {
      addNotification('Refeição salva com sucesso!', 'success');
    }

    setOpen(false);
    setShowShoppingPrompt(false);
  };

  return (
    <>
      <Dialog open={open && !showShoppingPrompt} onOpenChange={(o) => {
        if (!o && showShoppingPrompt) return; // Block close if prompt is active
        setOpen(o);
      }}>
        {children && <DialogTrigger asChild>{children}</DialogTrigger>}
        <DialogContent className="sm:max-w-md bg-white border-none shadow-xl rounded-2xl">
          <DialogHeader className="pb-4 border-b border-gray-100">
            <DialogTitle className="font-display text-gray-900 text-xl font-semibold">Planejar Refeição</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePreSubmit} className="space-y-5 mt-4">
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

            <div className="space-y-2.5 relative" ref={suggestionsRef}>
              <Label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest block">Ingredientes</Label>
              <div className="flex gap-2 relative">
                <Input 
                  value={form.ingrediente} 
                  onChange={e => {
                    setForm(f => ({ ...f, ingrediente: e.target.value }));
                    setShowSuggestions(true);
                  }} 
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Adicionar ingrediente (opcional)" 
                  maxLength={50}
                  className="bg-gray-50/50 border-gray-200 focus-visible:ring-emerald-600 shadow-sm rounded-xl pr-12 py-5"
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addIngrediente(); } }} 
                  autoComplete="off"
                />
                <button 
                  type="button" 
                  onClick={() => addIngrediente()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors p-1.5 rounded-md hover:bg-emerald-50"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Autocomplete Dropdown */}
              {showSuggestions && filteredPantry.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {filteredPantry.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addIngrediente(p.nome_item)}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
                    >
                      {p.nome_item}
                    </button>
                  ))}
                </div>
              )}
              
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

      {/* Shopping List Missing Items Prompt */}
      <AlertDialog open={showShoppingPrompt} onOpenChange={setShowShoppingPrompt}>
        <AlertDialogContent className="bg-white border-0 shadow-xl rounded-2xl w-[90vw] sm:max-w-[420px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-gray-900 text-xl font-semibold">Itens Faltantes</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500 mt-2">
              Você não possui estes ingredientes na sua despensa. Tem certeza que deseja adicioná-los à lista de compras?
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-2">
            <div className="flex flex-wrap gap-1.5 p-3 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              {missingItems.map(item => (
                <span key={item} className="text-xs font-semibold uppercase tracking-wider bg-white text-emerald-700 border border-emerald-100 px-2 py-1 rounded-lg">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <AlertDialogFooter className="mt-4 flex flex-row sm:flex-row gap-2 sm:gap-2 justify-end">
            <Button 
              variant="outline" 
              onClick={() => executeSave([])}
              className="flex-1 sm:flex-none border-gray-200"
            >
              Não, apenas salvar
            </Button>
            <Button 
              onClick={() => executeSave(missingItems)}
              className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              Sim, adicionar à lista
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
