import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useNotifications } from '@/context/NotificationContext';
import WeekdayPicker from '@/components/WeekdayPicker';
import type { TaskFrequency } from '@/types';

interface CreateTaskDialogProps {
  defaultDate?: string;
}

const CreateTaskDialog = ({ defaultDate }: CreateTaskDialogProps) => {
  const { users, currentUser, isMaster, addTask } = useApp();
  const { addNotification } = useNotifications();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    titulo: '', descricao: '', usuario_id: '', frequencia: 'unica' as TaskFrequency,
    valor_recompensa: '', data_limite: defaultDate || new Date().toISOString().split('T')[0],
    dias_semana: [] as number[],
  });

  const activeUsers = users.filter(u => u.ativo);
  const showWeekdayPicker = form.frequencia === 'diaria' || form.frequencia === 'semanal';

  // Update date when defaultDate changes and dialog is closed
  useEffect(() => {
    if (defaultDate && !open) {
      setForm(f => ({ ...f, data_limite: defaultDate }));
    }
  }, [defaultDate, open]);

  // Clear dias_semana when switching to non-recurring frequency
  useEffect(() => {
    if (!showWeekdayPicker) {
      setForm(f => ({ ...f, dias_semana: [] }));
    }
  }, [form.frequencia, showWeekdayPicker]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo.trim() || (!isMaster && !currentUser) || (isMaster && !form.usuario_id) || !form.data_limite) return;
    if (showWeekdayPicker && form.dias_semana.length === 0) return; // require at least one day

    addTask({
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim(),
      usuario_id: isMaster ? form.usuario_id : currentUser!.id,
      frequencia: form.frequencia,
      valor_recompensa: isMaster ? (parseFloat(form.valor_recompensa) || 0) : 0,
      data_limite: form.data_limite,
      dias_semana: showWeekdayPicker ? form.dias_semana : undefined,
    });
    const userName = isMaster ? users.find(u => u.id === form.usuario_id)?.nome : currentUser?.nome;
    addNotification(`Nova tarefa "${form.titulo}" atribuída a ${userName}`, 'info');
    setForm({ titulo: '', descricao: '', usuario_id: '', frequencia: 'unica', valor_recompensa: '', data_limite: defaultDate || new Date().toISOString().split('T')[0], dias_semana: [] });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gradient-primary text-primary-foreground gap-1 h-8 text-xs">
          <Plus className="w-3.5 h-3.5" /> Nova Tarefa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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
            {isMaster ? (
              <div className="space-y-2">
                <Label>Responsável</Label>
                <Select value={form.usuario_id} onValueChange={v => setForm(f => ({ ...f, usuario_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {activeUsers.map(u => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Responsável</Label>
                <Input value={currentUser?.nome || ''} disabled />
              </div>
            )}
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

          {/* Weekday picker — visible only for recurring tasks */}
          {showWeekdayPicker && (
            <div className="animate-fade-in">
              <WeekdayPicker
                value={form.dias_semana}
                onChange={days => setForm(f => ({ ...f, dias_semana: days }))}
                label="Dias da semana *"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {isMaster && (
              <div className="space-y-2">
                <Label>Recompensa (R$)</Label>
                <Input type="number" step="0.50" min="0" value={form.valor_recompensa} onChange={e => setForm(f => ({ ...f, valor_recompensa: e.target.value }))} placeholder="5.00" />
              </div>
            )}
            <div className="space-y-2">
              <Label>{form.frequencia === 'unica' ? 'Data' : 'Prazo final'}</Label>
              <Input type="date" value={form.data_limite} onChange={e => setForm(f => ({ ...f, data_limite: e.target.value }))} required />
            </div>
          </div>
          <Button
            type="submit"
            className="w-full gradient-primary text-primary-foreground"
            disabled={showWeekdayPicker && form.dias_semana.length === 0}
          >
            Criar Tarefa
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskDialog;
