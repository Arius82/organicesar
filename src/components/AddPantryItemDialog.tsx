import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useNotifications } from '@/context/NotificationContext';

const categories = ['Grãos', 'Laticínios', 'Proteínas', 'Padaria', 'Frutas', 'Temperos', 'Verduras', 'Bebidas', 'Limpeza', 'Outros'];

const AddPantryItemDialog = () => {
  const { addPantryItem } = useApp();
  const { addNotification } = useNotifications();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nome_item: '', quantidade: '', quantidade_minima: '', categoria: '', validade: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome_item.trim() || !form.categoria) return;
    addPantryItem({
      nome_item: form.nome_item.trim(),
      quantidade: parseInt(form.quantidade) || 0,
      quantidade_minima: parseInt(form.quantidade_minima) || 1,
      categoria: form.categoria,
      validade: form.validade || undefined,
    });
    addNotification(`"${form.nome_item}" adicionado à despensa`, 'success');
    setForm({ nome_item: '', quantidade: '', quantidade_minima: '', categoria: '', validade: '' });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-primary text-primary-foreground gap-1.5">
          <Plus className="w-4 h-4" /> Adicionar Item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Novo Item na Despensa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome do Item</Label>
            <Input value={form.nome_item} onChange={e => setForm(f => ({ ...f, nome_item: e.target.value }))} placeholder="Ex: Arroz" required maxLength={100} />
          </div>
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={form.categoria} onValueChange={v => setForm(f => ({ ...f, categoria: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Quantidade</Label>
              <Input type="number" min="0" value={form.quantidade} onChange={e => setForm(f => ({ ...f, quantidade: e.target.value }))} placeholder="5" />
            </div>
            <div className="space-y-2">
              <Label>Qtd Mínima</Label>
              <Input type="number" min="0" value={form.quantidade_minima} onChange={e => setForm(f => ({ ...f, quantidade_minima: e.target.value }))} placeholder="2" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Validade (opcional)</Label>
            <Input type="date" value={form.validade} onChange={e => setForm(f => ({ ...f, validade: e.target.value }))} />
          </div>
          <Button type="submit" className="w-full gradient-primary text-primary-foreground">Adicionar</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPantryItemDialog;
