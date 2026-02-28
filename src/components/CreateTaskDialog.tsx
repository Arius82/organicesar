import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useNotifications } from '@/context/NotificationContext';
import type { TaskFrequency } from '@/types';

const CreateTaskDialog = () => {
  const { users, addTask } = useApp();
  const { addNotification } = useNotifications();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    titulo: '', descricao: '', usuario_id: '', frequencia: 'diaria' as TaskFrequency,
    valor_recompensa: '', data_limite: '',
  });

  const simpleUsers = users.filter(u => u.tipo === 'simples');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo.trim() || !form.usuario_id || !form.data_limite) return;
    addTask({
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim(),
      usuario_id: form.usuario_id,
      frequencia: form.frequencia,
      valor_recompensa: parseFloat(form.valor_recompensa) || 0,
      data_limite: form.data_limite,
    });
    const userName = users.find(u => u.id === form.usuario_id)?.nome;
    addNotification(`Nova tarefa "${form.titulo}" atribuída a ${userName}`, 'info');
    setForm({ titulo: '', descricao: '', usuario_id: '', frequencia: 'diaria', valor_recompensa: '', data_limite: '' });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-primary text-primary-foreground gap-1.5">
          <Plus className="w-4 h-4" /> Nova Tarefa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Nova Tarefa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Ex: Lavar a louça" required maxLength={100} />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Detalhes..." maxLength={500} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Responsável</Label>
              <Select value={form.usuario_id} onValueChange={v => setForm(f => ({ ...f, usuario_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {simpleUsers.map(u => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Frequência</Label>
              <Select value={form.frequencia} onValueChange={v => setForm(f => ({ ...f, frequencia: v as TaskFrequency }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="diaria">Diária</SelectItem>
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="unica">Única</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Recompensa (R$)</Label>
              <Input type="number" step="0.50" min="0" value={form.valor_recompensa} onChange={e => setForm(f => ({ ...f, valor_recompensa: e.target.value }))} placeholder="5.00" />
            </div>
            <div className="space-y-2">
              <Label>Prazo</Label>
              <Input type="date" value={form.data_limite} onChange={e => setForm(f => ({ ...f, data_limite: e.target.value }))} required />
            </div>
          </div>
          <Button type="submit" className="w-full gradient-primary text-primary-foreground">Criar Tarefa</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskDialog;
