import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useNotifications } from '@/context/NotificationContext';

const AddShoppingItemDialog = () => {
  const { addShoppingItem } = useApp();
  const { addNotification } = useNotifications();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nome_item: '', quantidade: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome_item.trim()) return;
    addShoppingItem({
      nome_item: form.nome_item.trim(),
      quantidade: parseInt(form.quantidade) || 1,
    });
    addNotification(`"${form.nome_item}" adicionado à lista de compras`, 'info');
    setForm({ nome_item: '', quantidade: '' });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-primary text-primary-foreground gap-1.5">
          <Plus className="w-4 h-4" /> Adicionar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display">Novo Item na Lista</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome do Item</Label>
            <Input value={form.nome_item} onChange={e => setForm(f => ({ ...f, nome_item: e.target.value }))} placeholder="Ex: Detergente" required maxLength={100} />
          </div>
          <div className="space-y-2">
            <Label>Quantidade</Label>
            <Input type="number" min="1" value={form.quantidade} onChange={e => setForm(f => ({ ...f, quantidade: e.target.value }))} placeholder="1" />
          </div>
          <Button type="submit" className="w-full gradient-primary text-primary-foreground">Adicionar</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddShoppingItemDialog;
