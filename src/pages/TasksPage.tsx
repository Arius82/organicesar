import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import PageTransition from '@/components/PageTransition';
import { CheckCircle2, Clock, XCircle, AlertCircle, ChevronRight, ChevronLeft, Pencil, Trash2, Plus, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import CreateTaskDialog from '@/components/CreateTaskDialog';
import type { Task, TaskFrequency, TaskStatus } from '@/types';

const statusConfig = {
  pendente: { label: 'Pendente', icon: Clock, className: 'bg-muted text-muted-foreground' },
  aguardando_aprovacao: { label: 'Aguardando', icon: AlertCircle, className: 'bg-warning/10 text-warning' },
  concluida: { label: 'Concluída', icon: CheckCircle2, className: 'bg-success/10 text-success' },
  rejeitada: { label: 'Rejeitada', icon: XCircle, className: 'bg-destructive/10 text-destructive' },
};

const freqLabels = { diaria: 'Diária', semanal: 'Semanal', mensal: 'Mensal', unica: 'Única' };
const weekdayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const weekdayFull = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

const toDateStr = (d: Date) => d.toISOString().split('T')[0];

const getWeekDates = (offset: number) => {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay() + offset * 7);
  start.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
};

const TasksPage = () => {
  const { currentUser, tasks, users, isMaster, updateTaskStatus, editTask, deleteTask } = useApp();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ titulo: '', descricao: '', usuario_id: '', frequencia: 'diaria' as TaskFrequency, valor_recompensa: '', data_limite: '' });

  if (!currentUser) return null;

  const weekDates = getWeekDates(weekOffset);
  const selectedDateStr = toDateStr(selectedDate);
  const todayStr = toDateStr(new Date());

  const userTasks = isMaster ? tasks : tasks.filter(t => t.usuario_id === currentUser.id);

  // Tasks for the selected day (by data_limite)
  const dayTasks = useMemo(() =>
    userTasks.filter(t => t.data_limite === selectedDateStr),
    [userTasks, selectedDateStr]
  );

  // Count tasks per day for the week (for dots)
  const taskCountByDay = useMemo(() => {
    const counts: Record<string, { total: number; pending: number; done: number }> = {};
    weekDates.forEach(d => {
      const ds = toDateStr(d);
      const dayT = userTasks.filter(t => t.data_limite === ds);
      counts[ds] = {
        total: dayT.length,
        pending: dayT.filter(t => t.status === 'pendente').length,
        done: dayT.filter(t => t.status === 'concluida').length,
      };
    });
    return counts;
  }, [userTasks, weekDates]);

  const activeUsers = users.filter(u => u.ativo);
  const isOverdue = (task: Task) => task.status === 'pendente' && new Date(task.data_limite) < new Date();

  const openEdit = (task: Task) => {
    setEditForm({
      titulo: task.titulo, descricao: task.descricao, usuario_id: task.usuario_id,
      frequencia: task.frequencia, valor_recompensa: task.valor_recompensa.toString(), data_limite: task.data_limite,
    });
    setEditingTask(task);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    editTask(editingTask.id, {
      titulo: editForm.titulo.trim(), descricao: editForm.descricao.trim(), usuario_id: editForm.usuario_id,
      frequencia: editForm.frequencia, valor_recompensa: parseFloat(editForm.valor_recompensa) || 0, data_limite: editForm.data_limite,
    });
    setEditingTask(null);
  };

  const handleDelete = (id: string) => { deleteTask(id); setDeleteConfirm(null); };

  const weekStart = weekDates[0];
  const weekEnd = weekDates[6];

  return (
    <PageTransition>
      <div className="space-y-4">
        {/* Week navigation */}
        <div className="glass-card rounded-xl p-3">
          <div className="flex items-center justify-between mb-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setWeekOffset(w => w - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="text-center">
              <p className="text-sm font-display font-semibold text-foreground">
                {weekStart.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} — {weekEnd.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {weekOffset !== 0 && (
                <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={() => { setWeekOffset(0); setSelectedDate(new Date()); }}>Hoje</Button>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setWeekOffset(w => w + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Day pills */}
          <div className="grid grid-cols-7 gap-1">
            {weekDates.map((date) => {
              const ds = toDateStr(date);
              const isSelected = ds === selectedDateStr;
              const isToday = ds === todayStr;
              const counts = taskCountByDay[ds];

              return (
                <button
                  key={ds}
                  onClick={() => setSelectedDate(date)}
                  className={`flex flex-col items-center py-2 px-1 rounded-xl transition-all cursor-pointer ${
                    isSelected
                      ? 'gradient-primary text-primary-foreground shadow-md'
                      : isToday
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-muted/60 text-foreground'
                  }`}
                >
                  <span className={`text-[10px] font-medium uppercase ${isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {weekdayNames[date.getDay()]}
                  </span>
                  <span className={`text-lg font-display font-bold mt-0.5 ${isSelected ? '' : ''}`}>
                    {date.getDate()}
                  </span>
                  {/* Task dots */}
                  <div className="flex gap-0.5 mt-1 h-1.5">
                    {counts && counts.total > 0 && (
                      <>
                        {counts.pending > 0 && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-primary-foreground/60' : 'bg-warning'}`} />}
                        {counts.done > 0 && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-primary-foreground/80' : 'bg-success'}`} />}
                        {counts.total - counts.pending - counts.done > 0 && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-primary-foreground/40' : 'bg-muted-foreground/40'}`} />}
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected day header + add button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-primary" />
            <h2 className="font-display font-semibold text-foreground text-sm">
              {weekdayFull[selectedDate.getDay()]}, {selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{dayTasks.length} tarefa{dayTasks.length !== 1 ? 's' : ''}</span>
            <CreateTaskDialog defaultDate={selectedDateStr} />
          </div>
        </div>

        {/* Task list for selected day */}
        <div className="space-y-3">
          {dayTasks.length === 0 && (
            <div className="glass-card rounded-xl p-8 text-center">
              <CalendarDays className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma tarefa para este dia</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Toque em "Nova Tarefa" para adicionar</p>
            </div>
          )}

          {dayTasks.map(task => {
            const status = statusConfig[task.status];
            const StatusIcon = status.icon;
            const user = users.find(u => u.id === task.usuario_id);
            const overdue = isOverdue(task);

            return (
              <div key={task.id} className={`glass-card rounded-xl p-4 animate-fade-in ${overdue ? 'border-destructive/30' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${status.className}`}>
                    <StatusIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-foreground">{task.titulo}</h3>
                      {overdue && <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">Atrasada</span>}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${status.className}`}>{status.label}</span>
                    </div>
                    {task.descricao && <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{task.descricao}</p>}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {user && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Avatar className="w-4 h-4">
                            {user.avatar && <AvatarImage src={user.avatar} />}
                            <AvatarFallback className="text-[8px] font-bold bg-primary/20 text-primary">{user.nome[0]}</AvatarFallback>
                          </Avatar>
                          {user.nome}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">{freqLabels[task.frequencia]}</span>
                      {task.valor_recompensa > 0 && (
                        <span className="text-xs font-medium text-reward">R$ {task.valor_recompensa.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    {!isMaster && task.status === 'pendente' && (
                      <Button size="sm" className="gradient-primary text-primary-foreground text-xs" onClick={() => updateTaskStatus(task.id, 'aguardando_aprovacao')}>
                        Concluir <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    )}
                    {isMaster && task.status === 'aguardando_aprovacao' && (
                      <>
                        <Button size="sm" className="gradient-primary text-primary-foreground text-xs" onClick={() => updateTaskStatus(task.id, 'concluida')}>Aprovar</Button>
                        <Button size="sm" variant="outline" className="text-xs text-destructive border-destructive/30" onClick={() => updateTaskStatus(task.id, 'rejeitada')}>Rejeitar</Button>
                      </>
                    )}
                    {isMaster && (
                      <div className="flex gap-1 mt-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => openEdit(task)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteConfirm(task.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Edit Dialog */}
        <Dialog open={!!editingTask} onOpenChange={o => !o && setEditingTask(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle className="font-display">Editar Tarefa</DialogTitle></DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2"><Label>Título</Label><Input value={editForm.titulo} onChange={e => setEditForm(f => ({ ...f, titulo: e.target.value }))} required /></div>
              <div className="space-y-2"><Label>Descrição</Label><Textarea value={editForm.descricao} onChange={e => setEditForm(f => ({ ...f, descricao: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Responsável</Label>
                  <Select value={editForm.usuario_id} onValueChange={v => setEditForm(f => ({ ...f, usuario_id: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{activeUsers.map(u => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Frequência</Label>
                  <Select value={editForm.frequencia} onValueChange={v => setEditForm(f => ({ ...f, frequencia: v as TaskFrequency }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diaria">Diária</SelectItem><SelectItem value="semanal">Semanal</SelectItem>
                      <SelectItem value="mensal">Mensal</SelectItem><SelectItem value="unica">Única</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Recompensa (R$)</Label><Input type="number" step="0.50" min="0" value={editForm.valor_recompensa} onChange={e => setEditForm(f => ({ ...f, valor_recompensa: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Prazo</Label><Input type="date" value={editForm.data_limite} onChange={e => setEditForm(f => ({ ...f, data_limite: e.target.value }))} required /></div>
              </div>
              <Button type="submit" className="w-full gradient-primary text-primary-foreground">Salvar Alterações</Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirm */}
        <Dialog open={!!deleteConfirm} onOpenChange={o => !o && setDeleteConfirm(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader><DialogTitle>Excluir Tarefa?</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-2 justify-end mt-2">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
              <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Excluir</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
};

export default TasksPage;
