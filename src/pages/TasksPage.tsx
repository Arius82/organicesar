import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import PageTransition from '@/components/PageTransition';
import { motion, PanInfo } from 'framer-motion';
import { CheckCircle2, Clock, XCircle, AlertCircle, ChevronRight, ChevronLeft, Pencil, Trash2, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import CreateTaskDialog from '@/components/CreateTaskDialog';
import WeekdayPicker from '@/components/WeekdayPicker';
import ModernTimePicker from '@/components/ui/ModernTimePicker';
import { useToast } from '@/hooks/use-toast';
import { useAlarms } from '@/context/AlarmContext';
import { Switch } from '@/components/ui/switch';
import { Loader2, Bell, Volume2 } from 'lucide-react';
import { formatCesares } from '@/utils/format';
import { TASK_FREQUENCIES } from '@/constants';
import type { Task, TaskFrequency } from '@/types';

const statusConfig = {
  pendente:             { label: 'Pendente',   icon: Clock,        className: 'bg-muted text-muted-foreground' },
  aguardando_aprovacao: { label: 'Aguardando', icon: AlertCircle,  className: 'bg-warning/10 text-warning' },
  concluida:            { label: 'Concluída',  icon: CheckCircle2, className: 'bg-success/10 text-success' },
  rejeitada:            { label: 'Rejeitada',  icon: XCircle,      className: 'bg-destructive/10 text-destructive' },
};

const freqLabels: Record<TaskFrequency, string> = { diaria: 'Diária', semanal: 'Semanal', mensal: 'Mensal', unica: 'Única' };
const weekdayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const weekdayFull  = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

const toDateStr = (d: Date) => d.toISOString().split('T')[0];

const getWeekDates = (offset: number) => {
  const now   = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay() + offset * 7);
  start.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
};

/**
 * Returns true if task should appear on date `d`.
 * - Tasks with dias_semana appear on every matching weekday between
 *   data_criacao and data_limite.
 * - Tasks without dias_semana appear only on data_limite (original behaviour).
 */
const taskVisibleOnDate = (task: Task, dateStr: string, date: Date): boolean => {
  if (task.excecoes?.includes(dateStr)) return false;

  if (task.dias_semana && task.dias_semana.length > 0) {
    return (
      dateStr >= task.data_criacao &&
      dateStr <= task.data_limite &&
      task.dias_semana.includes(date.getDay())
    );
  }
  return task.data_limite === dateStr;
};

const TasksPage = () => {
  const { currentUser, tasks, users, isMaster, updateTaskStatus, editTask, deleteTask } = useApp();
  const { soundOptions } = useAlarms();
  const { toast } = useToast();
  const [weekOffset,   setWeekOffset]   = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [editingTask,  setEditingTask]  = useState<Task | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Task | null>(null);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    titulo: '', descricao: '', usuario_id: '', frequencia: 'diaria' as TaskFrequency,
    valor_recompensa: '', data_limite: '', dias_semana: [] as number[],
    alarme_ativo: false, alarme_hora: '08:00', alarme_som: 1,
  });

  const weekDates      = getWeekDates(weekOffset);
  const selectedDateStr = toDateStr(selectedDate);
  const todayStr        = toDateStr(new Date());

  const userTasks = isMaster ? tasks : tasks.filter(t => t.usuario_id === currentUser?.id);
  const activeUsers = users.filter(u => u.ativo);
  const showWeekdayPicker = editForm.frequencia === 'diaria' || editForm.frequencia === 'semanal';

  // Tasks for selected day (respects dias_semana)
  const dayTasks = useMemo(() =>
    userTasks.filter(t => taskVisibleOnDate(t, selectedDateStr, selectedDate)),
    [userTasks, selectedDateStr, selectedDate]
  );

  // Week overview map (respects dias_semana)
  const weekTasksByDay = useMemo(() => {
    const map: Record<string, typeof userTasks> = {};
    weekDates.forEach(d => {
      const ds = toDateStr(d);
      map[ds] = userTasks.filter(t => taskVisibleOnDate(t, ds, d));
    });
    return map;
  }, [userTasks, weekDates]);

  const taskCountByDay = useMemo(() => {
    const counts: Record<string, { total: number; pending: number; done: number }> = {};
    weekDates.forEach(d => {
      const ds   = toDateStr(d);
      const dayT = weekTasksByDay[ds] || [];
      counts[ds] = {
        total:   dayT.length,
        pending: dayT.filter(t => t.status === 'pendente').length,
        done:    dayT.filter(t => t.status === 'concluida').length,
      };
    });
    return counts;
  }, [weekTasksByDay, weekDates]);

  const isOverdue = (task: Task) => task.status === 'pendente' && new Date(task.data_limite) < new Date();

  if (!currentUser) return null;

  const openEdit = (task: Task) => {
    setEditForm({
      titulo: task.titulo, descricao: task.descricao, usuario_id: task.usuario_id,
      frequencia: task.frequencia, valor_recompensa: task.valor_recompensa.toString(),
      data_limite: task.data_limite, dias_semana: task.dias_semana ?? [],
      alarme_ativo: task.alarme_ativo || false,
      alarme_hora: task.alarme_hora || '08:00',
      alarme_som: task.alarme_som || 1,
    });
    setEditingTask(task);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    
    setSaving(true);
    const success = await editTask(editingTask.id, {
      titulo: editForm.titulo.trim(), descricao: editForm.descricao.trim(),
      usuario_id: editForm.usuario_id, frequencia: editForm.frequencia,
      valor_recompensa: parseFloat(editForm.valor_recompensa) || 0,
      data_limite: editForm.data_limite,
      dias_semana: showWeekdayPicker ? editForm.dias_semana : [],
      alarme_ativo: editForm.alarme_ativo,
      alarme_hora: editForm.alarme_hora,
      alarme_som: editForm.alarme_som,
    });
    setSaving(false);

    if (!success) {
      toast({
        title: 'Erro ao editar tarefa',
        description: 'Não foi possível salvar as alterações. Tente novamente.',
        variant: 'destructive',
      });
      return;
    }

    setEditingTask(null);
  };

  const handleConfirmDelete = async (taskId: string, onlyToday?: boolean) => {
    setSaving(true);
    const success = await deleteTask(taskId, onlyToday ? selectedDateStr : undefined);
    setSaving(false);
    
    if (success) {
      toast({ title: onlyToday ? 'Instância removida' : 'Tarefa excluída', description: 'Alteração salva com sucesso.' });
      setDeleteConfirm(null);
    } else {
      toast({ title: 'Erro ao excluir', description: 'Tente novamente.', variant: 'destructive' });
    }
  };

  const weekStart = weekDates[0];
  const weekEnd   = weekDates[6];

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
              const ds         = toDateStr(date);
              const isSelected = ds === selectedDateStr;
              const isToday    = ds === todayStr;
              const counts     = taskCountByDay[ds];

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
                  <span className="text-lg font-display font-bold mt-0.5">
                    {date.getDate()}
                  </span>
                  {/* Task dots */}
                  <div className="flex gap-0.5 mt-1 h-1.5">
                    {counts && counts.total > 0 && (
                      <>
                        {counts.pending > 0 && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-primary-foreground/60' : 'bg-warning'}`} />}
                        {counts.done    > 0 && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-primary-foreground/80' : 'bg-success'}`} />}
                        {counts.total - counts.pending - counts.done > 0 && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-primary-foreground/40' : 'bg-muted-foreground/40'}`} />}
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Week overview */}
        <div className="glass-card rounded-xl p-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Resumo da semana</h3>
          <div className="space-y-1.5">
            {weekDates.map(date => {
              const ds       = toDateStr(date);
              const dayItems = weekTasksByDay[ds] || [];
              if (dayItems.length === 0) return null;
              const doneCount = dayItems.filter(t => t.status === 'concluida').length;
              const isToday   = ds === todayStr;
              return (
                <button
                  key={ds}
                  onClick={() => setSelectedDate(date)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                    ds === selectedDateStr ? 'bg-primary/10' : 'hover:bg-muted/50'
                  }`}
                >
                  <span className={`text-xs font-semibold w-8 ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                    {weekdayNames[date.getDay()]}
                  </span>
                  <span className={`text-xs ${isToday ? 'font-bold text-foreground' : 'text-foreground'}`}>
                    {date.getDate()}/{(date.getMonth()+1).toString().padStart(2,'0')}
                  </span>
                  <div className="flex-1 flex gap-1 items-center">
                    {dayItems.slice(0, 3).map(t => (
                      <span key={`${t.id}-${ds}`} className={`text-[10px] px-1.5 py-0.5 rounded-full truncate max-w-[80px] ${
                        t.status === 'concluida' ? 'bg-success/10 text-success line-through' :
                        t.status === 'pendente'  ? 'bg-warning/10 text-warning' :
                        'bg-muted text-muted-foreground'
                      }`}>{t.titulo}</span>
                    ))}
                    {dayItems.length > 3 && <span className="text-[10px] text-muted-foreground">+{dayItems.length - 3}</span>}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{doneCount}/{dayItems.length}</span>
                </button>
              );
            })}
            {weekDates.every(d => (weekTasksByDay[toDateStr(d)] || []).length === 0) && (
              <p className="text-xs text-muted-foreground text-center py-2">Nenhuma tarefa nesta semana</p>
            )}
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
            const status    = statusConfig[task.status];
            const StatusIcon = status.icon;
            const user       = users.find(u => u.id === task.usuario_id);
            const overdue    = isOverdue(task);
            const canComplete = task.status === 'pendente' && task.usuario_id === currentUser?.id;

            return (
              <div key={`${task.id}-${selectedDateStr}`} className={`relative overflow-hidden rounded-xl animate-fade-in ${overdue ? 'border border-destructive/30' : ''} ${task.status === 'concluida' ? 'opacity-60' : ''}`}>
                {canComplete && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center px-5">
                    <CheckCircle2 className="w-5 h-5 text-primary opacity-80" />
                    <span className="ml-2 text-sm font-semibold tracking-wide text-primary opacity-80">Finalizar Tarefa</span>
                  </div>
                )}
                <motion.div
                  drag={canComplete ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={{ left: 0, right: 0.4 }}
                  onDragEnd={(_, info: PanInfo) => {
                    if (canComplete && info.offset.x > 80) {
                      updateTaskStatus(task.id, 'aguardando_aprovacao');
                    }
                  }}
                  className={`glass-card p-4 relative z-10 w-full h-full ${canComplete ? 'cursor-grab active:cursor-grabbing' : ''}`}
                  whileDrag={canComplete ? { scale: 0.98, x: 2 } : {}}
                >
                  <div className="flex items-start gap-3">
                    {/* Check / status icon */}
                    {task.status === 'pendente' && task.usuario_id === currentUser?.id ? (
                      <button
                        onClick={() => updateTaskStatus(task.id, 'aguardando_aprovacao')}
                        className="mt-0.5 w-8 h-8 rounded-lg border-2 border-primary/30 flex items-center justify-center flex-shrink-0 hover:bg-primary/10 hover:border-primary transition-colors cursor-pointer"
                        title="Marcar como concluída"
                      >
                        <CheckCircle2 className="w-4 h-4 text-primary/40" />
                      </button>
                    ) : (
                      <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${status.className}`}>
                        <StatusIcon className="w-4 h-4" />
                      </div>
                    )}

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
                          <span className="text-xs font-bold text-reward px-2 py-0.5 rounded-full bg-reward/10">
                            {formatCesares(task.valor_recompensa)}
                          </span>
                        )}
                        {/* Weekday chips */}
                        {task.dias_semana && task.dias_semana.length > 0 && (
                          <div className="flex gap-0.5 flex-wrap">
                            {task.dias_semana.map(d => (
                              <span
                                key={d}
                                className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                                  d === selectedDate.getDay()
                                    ? 'gradient-primary text-primary-foreground'
                                    : 'bg-primary/10 text-primary'
                                }`}
                              >
                                {weekdayNames[d]}
                              </span>
                            ))}
                          </div>
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
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteConfirm(task)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>

        {/* Edit Dialog */}
        <Dialog open={!!editingTask} onOpenChange={o => !o && setEditingTask(null)}>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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
                  <Select value={editForm.frequencia} onValueChange={v => setEditForm(f => ({ ...f, frequencia: v as TaskFrequency, dias_semana: [] }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TASK_FREQUENCIES.map(freq => (
                        <SelectItem key={freq.value} value={freq.value}>{freq.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Weekday picker */}
              {showWeekdayPicker && (
                <div className="animate-fade-in">
                  <WeekdayPicker
                    value={editForm.dias_semana}
                    onChange={days => setEditForm(f => ({ ...f, dias_semana: days }))}
                    label="Dias da semana *"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Recompensa (Césares)</Label><Input type="number" step="0.50" min="0" value={editForm.valor_recompensa} onChange={e => setEditForm(f => ({ ...f, valor_recompensa: e.target.value }))} /></div>
                <div className="space-y-2">
                  <Label>{editForm.frequencia === 'unica' ? 'Data' : 'Prazo final'}</Label>
                  <Input type="date" value={editForm.data_limite} onChange={e => setEditForm(f => ({ ...f, data_limite: e.target.value }))} required />
                </div>
              </div>

              {/* Alarm Settings */}
              <div className="space-y-4 p-4 rounded-2xl border-2 border-primary/10 bg-primary/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className={`w-4 h-4 ${editForm.alarme_ativo ? 'text-primary' : 'text-muted-foreground'}`} />
                    <Label className="font-semibold">Acionar Alarme</Label>
                  </div>
                  <Switch 
                    checked={editForm.alarme_ativo} 
                    onCheckedChange={v => setEditForm(f => ({ ...f, alarme_ativo: v }))} 
                  />
                </div>

                {editForm.alarme_ativo && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 pt-2 border-t border-primary/10"
                  >
                    <div className="grid grid-cols-2 gap-3 items-end">
                      <div className="space-y-2">
                        <Label className="text-xs">Horário</Label>
                        <ModernTimePicker 
                          value={editForm.alarme_hora} 
                          onChange={val => setEditForm(f => ({ ...f, alarme_hora: val }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Toque</Label>
                        <Select 
                          value={editForm.alarme_som.toString()} 
                          onValueChange={v => setEditForm(f => ({ ...f, alarme_som: Number(v) }))}
                        >
                          <SelectTrigger className="bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {soundOptions.map(s => (
                              <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-xs h-8 gap-2 border-primary/20 hover:bg-primary/10 transition-colors"
                      onClick={() => {
                        const sound = soundOptions.find(s => s.id === editForm.alarme_som);
                        if (sound) {
                          try {
                            const audio = new Audio(sound.url);
                            audio.crossOrigin = "anonymous";
                            audio.volume = 1.0;
                            const playPromise = audio.play();
                            if (playPromise !== undefined) {
                              playPromise.catch(e => {
                                console.error('Preview error:', e);
                                toast({ title: 'Aviso de Áudio', description: 'Clique novamente para reproduzir.' });
                              });
                            }
                            setTimeout(() => {
                              audio.pause();
                              audio.src = "";
                            }, 4000);
                            toast({ title: 'Prévia do Som', description: `Tocando: ${sound.name}` });
                          } catch (err) {
                            console.error('Audio Setup Error:', err);
                          }
                        }
                      }}
                    >
                      <Volume2 className="w-3 h-3" /> Testar Som Selecionado
                    </Button>
                  </motion.div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full gradient-primary text-primary-foreground"
                disabled={(showWeekdayPicker && editForm.dias_semana.length === 0) || saving}
              >
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</> : 'Salvar Alterações'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirm */}
        <Dialog open={!!deleteConfirm} onOpenChange={o => !o && setDeleteConfirm(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>{deleteConfirm?.dias_semana && deleteConfirm.dias_semana.length > 0 ? 'Excluir Tarefa Recorrente?' : 'Excluir Tarefa?'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {deleteConfirm?.dias_semana && deleteConfirm.dias_semana.length > 0 
                  ? 'Esta é uma tarefa recorrente. Você deseja excluir apenas a ocorrência de hoje ou toda a série?'
                  : 'Esta ação não pode ser desfeita.'}
              </p>
              
              <div className="flex flex-col gap-2 pt-2">
                {deleteConfirm?.dias_semana && deleteConfirm.dias_semana.length > 0 && (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-foreground" 
                    onClick={() => deleteConfirm && handleConfirmDelete(deleteConfirm.id, true)}
                    disabled={saving}
                  >
                    <div className="flex items-center gap-2">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4 text-warning" />}
                      <span>Excluir apenas hoje ({selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })})</span>
                    </div>
                  </Button>
                )}
                
                <Button 
                  variant="destructive" 
                  className="w-full justify-start" 
                  onClick={() => deleteConfirm && handleConfirmDelete(deleteConfirm.id, false)}
                  disabled={saving}
                >
                  <div className="flex items-center gap-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    <span>{deleteConfirm?.dias_semana && deleteConfirm.dias_semana.length > 0 ? 'Excluir toda a série (Permanente)' : 'Excluir Permanentemente'}</span>
                  </div>
                </Button>
                
                <Button variant="ghost" className="w-full" onClick={() => setDeleteConfirm(null)} disabled={saving}>
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
};

export default TasksPage;
