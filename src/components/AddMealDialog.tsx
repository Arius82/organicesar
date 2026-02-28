import { useState } from 'react';
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

const AddMealDialog = () => {
  const { addMeal } = useApp();
  const { addNotification } = useNotifications();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    data: '', refeicao: 'almoco' as MealType, descricao: '', ingrediente: '',
  });
  const [ingredientes, setIngredientes] = useState<string[]>([]);

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
    const labels = { cafe: 'Café', almoco: 'Almoço', jantar: 'Jantar' };
    addNotification(`${labels[form.refeicao]} adicionado ao cardápio`, 'success');
    setForm({ data: '', refeicao: 'almoco', descricao: '', ingrediente: '' });
    setIngredientes([]);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-primary text-primary-foreground gap-1.5">
          <Plus className="w-4 h-4" /> Nova Refeição
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Planejar Refeição</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>Refeição</Label>
              <Select value={form.refeicao} onValueChange={v => setForm(f => ({ ...f, refeicao: v as MealType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cafe">Café da Manhã</SelectItem>
                  <SelectItem value="almoco">Almoço</SelectItem>
                  <SelectItem value="jantar">Jantar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Ex: Arroz, feijão e frango grelhado" required maxLength={300} />
          </div>
          <div className="space-y-2">
            <Label>Ingredientes</Label>
            <div className="flex gap-2">
              <Input value={form.ingrediente} onChange={e => setForm(f => ({ ...f, ingrediente: e.target.value }))} placeholder="Adicionar ingrediente" maxLength={50}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addIngrediente(); } }} />
              <Button type="button" variant="outline" size="icon" onClick={addIngrediente}><Plus className="w-4 h-4" /></Button>
            </div>
            {ingredientes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {ingredientes.map(ing => (
                  <span key={ing} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full flex items-center gap-1">
                    {ing}
                    <button type="button" onClick={() => setIngredientes(prev => prev.filter(i => i !== ing))}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <Button type="submit" className="w-full gradient-primary text-primary-foreground">Salvar Refeição</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddMealDialog;
