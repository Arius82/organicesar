import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import PageTransition from '@/components/PageTransition';
import {
  Shield, User as UserIcon, Pencil, Trash2, Mail, Star, Flame, Search, Send,
  CheckCircle2, Clock, XCircle, AlertCircle, ChevronRight, ClipboardList, Plus, X,
  Bell, Loader2, Volume2
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useNotifications } from '@/context/NotificationContext';
import InviteMemberDialog from '@/components/InviteMemberDialog';
import WeekdayPicker from '@/components/WeekdayPicker';
import ModernTimePicker from '@/components/ui/ModernTimePicker';
import { useAlarms } from '@/context/AlarmContext';
import { formatCesares } from '@/utils/format';
import { LEVEL_EMOJI } from '@/constants';
import { useToast } from '@/hooks/use-toast';
import type { User, UserType, Task, TaskFrequency, TaskStatus } from '@/types';
import ErrorBoundary from '@/components/ErrorBoundary';

const weekdayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// ─── Status config ───────────────────────────────────────────────────────────
const statusConfig: Record<TaskStatus, { label: string; icon: React.ElementType; className: string }> = {
  pendente:             { label: 'Pendente',    icon: Clock,         className: 'bg-muted text-muted-foreground' },
  aguardando_aprovacao: { label: 'Aguardando',  icon: AlertCircle,   className: 'bg-warning/10 text-warning' },
  concluida:            { label: 'Concluída',   icon: CheckCircle2,  className: 'bg-success/10 text-success' },
  rejeitada:            { label: 'Rejeitada',   icon: XCircle,       className: 'bg-destructive/10 text-destructive' },
};

const freqLabels: Record<TaskFrequency, string> = {
  diaria: 'Diária', semanal: 'Semanal', mensal: 'Mensal', unica: 'Única',
};

// ─── User edit form ──────────────────────────────────────────────────────────
interface UserFormData {
  nome: string;
  email: string;
  tipo: UserType;
  saldo: string;
  ativo: boolean;
}

const UserForm = ({ form, setForm, onSubmit, submitLabel }: {
  form: UserFormData;
  setForm: (fn: (f: UserFormData) => UserFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel: string;
}) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <div className="space-y-2">
      <Label>Nome completo</Label>
      <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: João Silva" required maxLength={100} />
    </div>
    <div className="space-y-2">
      <Label>E-mail</Label>
      <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="joao@familia.com" required
        disabled={submitLabel === 'Salvar Alterações'} className={submitLabel === 'Salvar Alterações' ? 'opacity-50 cursor-not-allowed' : ''} />
      {submitLabel === 'Salvar Alterações' && <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado.</p>}
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-2">
        <Label>Tipo de usuário</Label>
        <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v as UserType }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="master">Master</SelectItem>
            <SelectItem value="simples">Simples</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Saldo inicial (Césares)</Label>
        <Input type="number" step="0.01" min="0" value={form.saldo} onChange={e => setForm(f => ({ ...f, saldo: e.target.value }))} />
      </div>
    </div>
    <div className="flex items-center justify-between rounded-lg border border-input p-3">
      <Label className="cursor-pointer">Usuário ativo</Label>
      <Switch checked={form.ativo} onCheckedChange={v => setForm(f => ({ ...f, ativo: v }))} />
    </div>
    <Button type="submit" className="w-full gradient-primary text-primary-foreground">{submitLabel}</Button>
  </form>
);

// ─── Task edit form (inside user task panel) ─────────────────────────────────
interface TaskEditFormData {
  titulo: string;
  descricao: string;
  frequencia: TaskFrequency;
  valor_recompensa: string;
  data_limite: string;
  status: TaskStatus;
  dias_semana: number[];
  alarme_ativo: boolean;
  alarme_hora: string;
  alarme_som: number;
}

// ─── Main page ────────────────────────────────────────────────────────────────
const UsersPage = () => {
  const { users, tasks, currentUser, isMaster, editUser, deleteUser, updateTaskStatus, editTask, deleteTask, addTask } = useApp();
  const { soundOptions } = useAlarms();
  const { addNotification } = useNotifications();
  const { toast } = useToast();
  
  // User list state
  const [showInvite, setShowInvite] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleteUserConfirm, setDeleteUserConfirm] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editForm, setEditForm] = useState<UserFormData>({ nome: '', email: '', tipo: 'simples', saldo: '', ativo: true });

  // User tasks panel state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteTaskConfirm, setTaskDeleteConfirm] = useState<Task | null>(null);
  const [savingTask, setSavingTask] = useState(false);
  const [taskForm, setTaskForm] = useState<TaskEditFormData>({
    titulo: '', descricao: '', frequencia: 'unica', valor_recompensa: '', data_limite: '', status: 'pendente', dias_semana: [],
    alarme_ativo: false, alarme_hora: '08:00', alarme_som: 1,
  });
  // New task inside user panel
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({
    titulo: '', descricao: '', frequencia: 'unica' as TaskFrequency,
    valor_recompensa: '', data_limite: new Date().toISOString().split('T')[0],
    dias_semana: [] as number[],
    alarme_ativo: false,
    alarme_hora: '08:00',
    alarme_som: 1,
  });

  const newTaskShowWeekday  = newTaskForm.frequencia === 'diaria' || newTaskForm.frequencia === 'semanal';
  const editTaskShowWeekday = taskForm.frequencia === 'diaria' || taskForm.frequencia === 'semanal';

  const filteredUsers = users.filter(u => {
    const nomeNormal = (u.nome || '').toLowerCase();
    const emailNormal = (u.email || '').toLowerCase();
    const searchNormal = (search || '').toLowerCase();
    return nomeNormal.includes(searchNormal) || emailNormal.includes(searchNormal);
  });

  const userTasks = useMemo(() =>
    selectedUser ? tasks.filter(t => t.usuario_id === selectedUser.id) : [],
    [selectedUser, tasks]
  );

  // ─── User edit ──────────────────────────────────────────────────────────────
  const openEditUser = (e: React.MouseEvent, user: User) => {
    e.stopPropagation();
    setEditForm({ nome: user.nome, email: user.email, tipo: user.tipo, saldo: user.saldo.toString(), ativo: user.ativo });
    setEditing(user);
  };

  const handleEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    editUser(editing.id, { nome: editForm.nome.trim(), email: editForm.email.trim(), tipo: editForm.tipo, saldo: parseFloat(editForm.saldo) || 0, ativo: editForm.ativo });
    addNotification(`Usuário "${editForm.nome}" atualizado`, 'info');
    setEditing(null);
  };

  const handleDeleteUser = (id: string) => {
    const user = users.find(u => u.id === id);
    deleteUser(id);
    addNotification(`Usuário "${user?.nome}" removido`, 'warning');
    setDeleteUserConfirm(null);
    if (selectedUser?.id === id) setSelectedUser(null);
  };

  // ─── Task edit ──────────────────────────────────────────────────────────────
  const openEditTask = (task: Task) => {
    setTaskForm({
      titulo: task.titulo, descricao: task.descricao, frequencia: task.frequencia,
      valor_recompensa: task.valor_recompensa.toString(), data_limite: task.data_limite,
      status: task.status, dias_semana: task.dias_semana || [],
      alarme_ativo: task.alarme_ativo || false,
      alarme_hora: task.alarme_hora || '08:00',
      alarme_som: task.alarme_som || 1,
    });
    setEditingTask(task);
  };

  const handleEditTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    
    setSavingTask(true);
    const success = await editTask(editingTask.id, {
      titulo: taskForm.titulo.trim(), descricao: taskForm.descricao.trim(),
      frequencia: taskForm.frequencia, valor_recompensa: parseFloat(taskForm.valor_recompensa) || 0,
      data_limite: taskForm.data_limite,
      dias_semana: editTaskShowWeekday ? taskForm.dias_semana : [],
      alarme_ativo: taskForm.alarme_ativo,
      alarme_hora: taskForm.alarme_hora,
      alarme_som: taskForm.alarme_som,
    });
    setSavingTask(false);

    if (!success) {
      toast({
        title: 'Erro ao editar tarefa',
        description: 'Não foi possível salvar as alterações. Tente novamente.',
        variant: 'destructive',
      });
      return;
    }

    if (taskForm.status !== editingTask.status) {
      updateTaskStatus(editingTask.id, taskForm.status);
    }
    addNotification(`Tarefa "${taskForm.titulo}" atualizada`, 'info');
    setEditingTask(null);
  };

  const handleConfirmDeleteTask = async (taskId: string, onlyToday?: boolean) => {
    setSavingTask(true);
    const success = await deleteTask(taskId, onlyToday ? new Date().toISOString().split('T')[0] : undefined);
    setSavingTask(false);
    
    if (success) {
      toast({ title: onlyToday ? 'Instância removida' : 'Tarefa excluída', description: 'Alteração salva com sucesso.' });
      setTaskDeleteConfirm(null);
      addNotification(`Tarefa removida`, 'warning');
    } else {
      toast({ title: 'Erro ao excluir', description: 'Tente novamente.', variant: 'destructive' });
    }
  };

  // ─── New task for user ──────────────────────────────────────────────────────
    const taskToSave = {
      titulo: newTaskForm.titulo.trim(),
      descricao: newTaskForm.descricao.trim(),
      usuario_id: selectedUser.id,
      frequencia: newTaskForm.frequencia,
      valor_recompensa: parseFloat(newTaskForm.valor_recompensa) || 0,
      data_limite: newTaskForm.data_limite,
      dias_semana: newTaskShowWeekday ? newTaskForm.dias_semana : undefined,
      alarme_ativo: newTaskForm.alarme_ativo,
      alarme_hora: newTaskForm.alarme_hora,
      alarme_som: newTaskForm.alarme_som,
    };

    // Immediate UI feedback: close form and clear
    setShowNewTask(false);
    const taskName = newTaskForm.titulo;
    setNewTaskForm({ 
      titulo: '', descricao: '', frequencia: 'unica', 
      valor_recompensa: '', data_limite: new Date().toISOString().split('T')[0], 
      dias_semana: [], alarme_ativo: false, alarme_hora: '08:00', alarme_som: 1 
    });
    
    // Call addTask in background
    setSavingTask(true);
    const success = await addTask(taskToSave);
    setSavingTask(false);

    if (!success) {
      toast({
        title: 'Erro ao criar tarefa',
        description: 'Não foi possível salvar no servidor. A tarefa foi removida da lista.',
        variant: 'destructive',
      });
    } else {
      addNotification(`Nova tarefa "${taskName}" atribuída a ${selectedUser.nome}`, 'info');
    }
  };

  return (
    <ErrorBoundary fallbackTitle="Erro ao carregar aba Usuários">
      <PageTransition>
        <div className="space-y-4 pb-20 safe-area-pb">

      {/* Search + invite */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar usuário..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        {isMaster && (
          <Button variant="outline" className="gap-1.5" onClick={() => setShowInvite(true)}>
            <Send className="w-4 h-4" /> Convidar Membro
          </Button>
        )}
      </div>

      <p className="text-sm text-muted-foreground">{filteredUsers.length} membro{filteredUsers.length !== 1 ? 's' : ''} — clique para ver tarefas</p>

      {/* User cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredUsers.map(user => {
          const userTaskCount = tasks.filter(t => t.usuario_id === user.id).length;
          const pendingCount  = tasks.filter(t => t.usuario_id === user.id && t.status === 'pendente').length;
          return (
            <div
              key={user.id}
              onClick={() => setSelectedUser(user)}
              className={`glass-card rounded-xl p-5 animate-fade-in relative cursor-pointer transition-all hover:ring-2 hover:ring-primary/40 hover:shadow-lg ${!user.ativo ? 'opacity-50' : ''} ${selectedUser?.id === user.id ? 'ring-2 ring-primary shadow-lg' : ''}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    {user.avatar && <AvatarImage src={user.avatar} alt={user.nome} />}
                    <AvatarFallback className={`text-lg font-bold ${user.tipo === 'master' ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                      {user.nome[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-display font-semibold text-foreground">{user.nome}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" /> {user.email}</p>
                  </div>
                </div>
                {isMaster && user.id !== currentUser?.id && (
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-10 w-10 text-muted-foreground hover:text-primary active:scale-95 transition-all" 
                      onClick={e => openEditUser(e, user)}
                      title="Editar usuário"
                    >
                      <Pencil className="w-5 h-5" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-10 w-10 text-muted-foreground hover:text-destructive active:scale-95 transition-all" 
                      onClick={e => { e.stopPropagation(); setDeleteUserConfirm(user.id); }}
                      title="Remover usuário"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1 ${user.tipo === 'master' ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                  {user.tipo === 'master' ? <Shield className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                  {user.tipo === 'master' ? 'Master' : 'Simples'}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1"><Star className="w-3 h-3" /> {user.nivel} {LEVEL_EMOJI[user.nivel]}</span>
                <span className="text-xs font-medium text-primary">{user.pontos} pts</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1"><Flame className="w-3 h-3" /> {user.sequencia_dias}d</span>
                {user.tipo === 'simples' && <span className="text-xs font-medium text-reward">{formatCesares(user.saldo)}</span>}
                {!user.ativo && <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">Inativo</span>}
              </div>
              {/* Task summary strip */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/40">
                <ClipboardList className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{userTaskCount} tarefa{userTaskCount !== 1 ? 's' : ''}</span>
                {pendingCount > 0 && (
                  <span className="text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-full">{pendingCount} pendente{pendingCount !== 1 ? 's' : ''}</span>
                )}
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── USER TASKS PANEL ── */}
      <Dialog open={!!selectedUser} onOpenChange={o => !o && setSelectedUser(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[95vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2 border-b">
            {selectedUser && (
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  {selectedUser.avatar && <AvatarImage src={selectedUser.avatar} />}
                  <AvatarFallback className={`font-bold ${selectedUser.tipo === 'master' ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                    {selectedUser.nome[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <DialogTitle className="font-display">Tarefas de {selectedUser.nome}</DialogTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {userTasks.length} tarefa{userTasks.length !== 1 ? 's' : ''} · {userTasks.filter(t => t.status === 'concluida').length} concluída{userTasks.filter(t => t.status === 'concluida').length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            )}
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-6">

          {/* Add task button */}
          {isMaster && (
            <div className="flex-shrink-0">
              <Button
                size="sm"
                className="gradient-primary text-primary-foreground gap-1.5 w-full"
                onClick={() => setShowNewTask(v => !v)}
              >
                {showNewTask ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {showNewTask ? 'Cancelar' : 'Atribuir Nova Tarefa'}
              </Button>

              {showNewTask && (
                <form onSubmit={handleNewTask} className="mt-3 p-4 rounded-xl border border-border/50 bg-muted/30 space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Título</Label>
                    <Input value={newTaskForm.titulo} onChange={e => setNewTaskForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Ex: Lavar a louça" required maxLength={100} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Descrição</Label>
                    <Textarea value={newTaskForm.descricao} onChange={e => setNewTaskForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Detalhes..." maxLength={500} rows={2} />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Frequência</Label>
                      <Select value={newTaskForm.frequencia} onValueChange={v => setNewTaskForm(f => ({ ...f, frequencia: v as TaskFrequency, dias_semana: [] }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="diaria">Diária</SelectItem>
                          <SelectItem value="semanal">Semanal</SelectItem>
                          <SelectItem value="mensal">Mensal</SelectItem>
                          <SelectItem value="unica">Única</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Recompensa (Césares)</Label>
                      <Input type="number" step="0.50" min="0" value={newTaskForm.valor_recompensa} onChange={e => setNewTaskForm(f => ({ ...f, valor_recompensa: e.target.value }))} placeholder="0.00" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">{newTaskShowWeekday ? 'Prazo final' : 'Data'}</Label>
                      <Input type="date" value={newTaskForm.data_limite} onChange={e => setNewTaskForm(f => ({ ...f, data_limite: e.target.value }))} required />
                    </div>
                  </div>
                  {/* Weekday picker */}
                  {newTaskShowWeekday && (
                    <div className="space-y-1.5 col-span-2">
                      <Label className="text-xs">Dias da semana</Label>
                      <WeekdayPicker 
                        value={newTaskForm.dias_semana} 
                        onChange={days => setNewTaskForm(f => ({ ...f, dias_semana: days }))} 
                      />
                    </div>
                  )}

                  {/* Alarm Settings - New Task */}
                  <div className="space-y-3 p-3 rounded-xl border border-primary/10 bg-primary/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className={`w-3.5 h-3.5 ${newTaskForm.alarme_ativo ? 'text-primary' : 'text-muted-foreground'}`} />
                        <Label className="text-xs font-semibold">Acionar Alarme</Label>
                      </div>
                      <Switch 
                        checked={newTaskForm.alarme_ativo} 
                        onCheckedChange={v => setNewTaskForm(f => ({ ...f, alarme_ativo: v }))} 
                      />
                    </div>

                    {newTaskForm.alarme_ativo && (
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-primary/10">
                        <div className="space-y-1">
                          <Label className="text-[10px]">Horário</Label>
                          <ModernTimePicker 
                            value={newTaskForm.alarme_hora} 
                            onChange={val => setNewTaskForm(f => ({ ...f, alarme_hora: val }))}
                            className="scale-90 origin-left"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">Toque</Label>
                          <Select 
                            value={newTaskForm.alarme_som.toString()} 
                            onValueChange={v => setNewTaskForm(f => ({ ...f, alarme_som: Number(v) }))}
                          >
                            <SelectTrigger className="h-8 text-xs bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {soundOptions.map(s => (
                                <SelectItem key={s.id} value={s.id.toString()} className="text-xs">{s.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          className="col-span-2 h-7 text-[10px] gap-1.5 border-primary/20"
                          onClick={() => {
                            const sound = soundOptions.find(s => s.id === newTaskForm.alarme_som);
                            if (sound) {
                              try {
                                const audio = new Audio(sound.url);
                                audio.crossOrigin = "anonymous";
                                audio.volume = 1.0;
                                const playPromise = audio.play();
                                if (playPromise !== undefined) {
                                  playPromise.catch(e => {
                                    console.error('Preview error:', e);
                                    toast({ 
                                      title: 'Aviso de Áudio', 
                                      description: 'Interação necessária. Clique no botão de som no topo ou interaja com a página.' 
                                    });
                                  });
                                }
                                setTimeout(() => {
                                  audio.pause();
                                  audio.src = "";
                                }, 5000);
                                toast({ title: 'Prévia do Som', description: `Tocando: ${sound.name}` });
                              } catch (err) {
                                console.error('Audio Setup Error:', err);
                              }
                            }
                          }}
                        >
                          <Volume2 className="w-3 h-3" /> Testar Som
                        </Button>
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    size="sm"
                    className="w-full gradient-primary text-primary-foreground"
                    disabled={(newTaskShowWeekday && newTaskForm.dias_semana.length === 0) || savingTask}
                  >
                    {savingTask ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</> : 'Criar Tarefa'}
                  </Button>
                </form>
              )}
            </div>
          )}

          {/* Tasks list */}
          <div className="space-y-2.5">
            {userTasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ClipboardList className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">Nenhuma tarefa atribuída</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Clique em "Atribuir Nova Tarefa" para começar</p>
              </div>
            )}

            {userTasks
              .sort((a, b) => {
                const order: Record<TaskStatus, number> = { pendente: 0, aguardando_aprovacao: 1, rejeitada: 2, concluida: 3 };
                return order[a.status] - order[b.status] || a.data_limite.localeCompare(b.data_limite);
              })
              .map(task => {
                const cfg = statusConfig[task.status];
                const StatusIcon = cfg.icon;
                const isOverdue = task.status === 'pendente' && new Date(task.data_limite) < new Date();

                return (
                  <div key={task.id} className={`glass-card rounded-xl p-4 animate-fade-in ${isOverdue ? 'border border-destructive/30' : ''} ${task.status === 'concluida' ? 'opacity-60' : ''}`}>
                    <div className="flex items-start gap-3">
                      {/* Status icon */}
                      <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.className}`}>
                        <StatusIcon className="w-4 h-4" />
                      </div>

                      {/* Task info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium text-foreground text-sm">{task.titulo}</h4>
                          {isOverdue && <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">Atrasada</span>}
                        </div>
                        {task.descricao && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.descricao}</p>}
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.className}`}>{cfg.label}</span>
                          <span className="text-xs text-muted-foreground">{freqLabels[task.frequencia]}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(task.data_limite + 'T00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                          </span>
                          {task.valor_recompensa > 0 && (
                            <span className="text-xs font-medium text-reward">{formatCesares(task.valor_recompensa)}</span>
                          )}
                          {/* Weekday chips */}
                          {task.dias_semana && task.dias_semana.length > 0 && (
                            <div className="flex gap-0.5 flex-wrap mt-0.5">
                              {task.dias_semana.map(d => (
                                <span key={d} className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold bg-primary/10 text-primary">
                                  {weekdayNames[d]}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        {/* Status change buttons (master) */}
                        {isMaster && task.status === 'aguardando_aprovacao' && (
                          <div className="flex gap-1 mb-1">
                            <Button size="sm" className="gradient-primary text-primary-foreground text-xs h-7 px-2"
                              onClick={() => updateTaskStatus(task.id, 'concluida')}>Aprovar</Button>
                            <Button size="sm" variant="outline" className="text-xs text-destructive border-destructive/30 h-7 px-2"
                              onClick={() => updateTaskStatus(task.id, 'rejeitada')}>Rejeitar</Button>
                          </div>
                        )}
                        {/* Status quick-change select */}
                        {isMaster && task.status !== 'aguardando_aprovacao' && (
                          <Select value={task.status} onValueChange={v => updateTaskStatus(task.id, v as TaskStatus)}>
                            <SelectTrigger className="h-7 text-xs w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pendente">Pendente</SelectItem>
                              <SelectItem value="aguardando_aprovacao">Aguardando</SelectItem>
                              <SelectItem value="concluida">Concluída</SelectItem>
                              <SelectItem value="rejeitada">Rejeitada</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        <div className="flex gap-1 justify-end">
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-primary"
                            onClick={() => openEditTask(task)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => setTaskDeleteConfirm(task)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </DialogContent>
    </Dialog>

      {/* ── EDIT USER DIALOG ── */}
      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-display">Editar Usuário</DialogTitle></DialogHeader>
          <UserForm form={editForm} setForm={setEditForm} onSubmit={handleEditUser} submitLabel="Salvar Alterações" />
        </DialogContent>
      </Dialog>

      {/* ── DELETE USER CONFIRM ── */}
      <Dialog open={!!deleteUserConfirm} onOpenChange={o => !o && setDeleteUserConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Excluir Usuário?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">O usuário e todas as suas tarefas serão removidos. Esta ação não pode ser desfeita.</p>
          <div className="flex gap-2 justify-end mt-2">
            <Button variant="outline" onClick={() => setDeleteUserConfirm(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteUserConfirm && handleDeleteUser(deleteUserConfirm)}>Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── EDIT TASK DIALOG ── */}
      <Dialog open={!!editingTask} onOpenChange={o => !o && setEditingTask(null)}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display">Editar Tarefa</DialogTitle></DialogHeader>
          <form onSubmit={handleEditTaskSubmit} className="space-y-4">
            <div className="space-y-2"><Label>Título</Label><Input value={taskForm.titulo} onChange={e => setTaskForm(f => ({ ...f, titulo: e.target.value }))} required /></div>
            <div className="space-y-2"><Label>Descrição</Label><Textarea value={taskForm.descricao} onChange={e => setTaskForm(f => ({ ...f, descricao: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Frequência</Label>
                <Select value={taskForm.frequencia} onValueChange={v => setTaskForm(f => ({ ...f, frequencia: v as TaskFrequency, dias_semana: [] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diaria">Diária</SelectItem>
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="unica">Única</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={taskForm.status} onValueChange={v => setTaskForm(f => ({ ...f, status: v as TaskStatus }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="aguardando_aprovacao">Aguardando</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                    <SelectItem value="rejeitada">Rejeitada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Weekday picker */}
            {editTaskShowWeekday && (
              <div className="animate-fade-in">
                <WeekdayPicker
                  value={taskForm.dias_semana}
                  onChange={days => setTaskForm(f => ({ ...f, dias_semana: days }))}
                  label="Dias da semana *"
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Recompensa (Césares)</Label><Input type="number" step="0.50" min="0" value={taskForm.valor_recompensa} onChange={e => setTaskForm(f => ({ ...f, valor_recompensa: e.target.value }))} /></div>
              <div className="space-y-2">
                <Label>{taskForm.frequencia === 'unica' ? 'Data' : 'Prazo final'}</Label>
                <Input type="date" value={taskForm.data_limite} onChange={e => setTaskForm(f => ({ ...f, data_limite: e.target.value }))} required />
              </div>
            </div>

            {/* Alarm Settings - Edit Task */}
            <div className="space-y-4 p-4 rounded-2xl border-2 border-primary/10 bg-primary/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className={`w-4 h-4 ${taskForm.alarme_ativo ? 'text-primary' : 'text-muted-foreground'}`} />
                  <Label className="font-semibold">Acionar Alarme</Label>
                </div>
                <Switch 
                  checked={taskForm.alarme_ativo} 
                  onCheckedChange={v => setTaskForm(f => ({ ...f, alarme_ativo: v }))} 
                />
              </div>

              {taskForm.alarme_ativo && (
                <div className="space-y-4 pt-2 border-t border-primary/10">
                  <div className="grid grid-cols-2 gap-3 items-end">
                    <div className="space-y-2">
                      <Label className="text-xs">Horário</Label>
                      <ModernTimePicker 
                        value={taskForm.alarme_hora} 
                        onChange={val => setTaskForm(f => ({ ...f, alarme_hora: val }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Toque</Label>
                      <Select 
                        value={taskForm.alarme_som.toString()} 
                        onValueChange={v => setTaskForm(f => ({ ...f, alarme_som: Number(v) }))}
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
                      const sound = soundOptions.find(s => s.id === taskForm.alarme_som);
                      if (sound) {
                        try {
                          const audio = new Audio(sound.url);
                          audio.crossOrigin = "anonymous";
                          audio.volume = 1.0;
                          const playPromise = audio.play();
                          if (playPromise !== undefined) {
                            playPromise.catch(e => {
                                console.error('Preview error:', e);
                                toast({ 
                                  title: 'Aviso de Áudio', 
                                  description: 'Interação necessária. Clique no botão de som no topo ou interaja com a página.' 
                                });
                            });
                          }
                          setTimeout(() => {
                            audio.pause();
                            audio.src = "";
                          }, 5000);
                          toast({ title: 'Prévia do Som', description: `Tocando: ${sound.name}` });
                        } catch (err) {
                          console.error('Audio Setup Error:', err);
                        }
                      }
                    }}
                  >
                    <Volume2 className="w-3 h-3" /> Testar Som Selecionado
                  </Button>
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full gradient-primary text-primary-foreground"
              disabled={(editTaskShowWeekday && taskForm.dias_semana.length === 0) || savingTask}
            >
              {savingTask ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</> : 'Salvar Alterações'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── DELETE TASK CONFIRM ── */}
      <Dialog open={!!deleteTaskConfirm} onOpenChange={o => !o && setTaskDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{deleteTaskConfirm?.dias_semana && deleteTaskConfirm.dias_semana.length > 0 ? 'Excluir Tarefa Recorrente?' : 'Excluir Tarefa?'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {deleteTaskConfirm?.dias_semana && deleteTaskConfirm.dias_semana.length > 0 
                ? 'Esta é uma tarefa recorrente. Você deseja excluir apenas a ocorrência de hoje ou toda a série?'
                : 'Esta ação não pode ser desfeita.'}
            </p>
            
            <div className="flex flex-col gap-2 pt-2">
              {deleteTaskConfirm?.dias_semana && deleteTaskConfirm.dias_semana.length > 0 && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-foreground" 
                  onClick={() => deleteTaskConfirm && handleConfirmDeleteTask(deleteTaskConfirm.id, true)}
                  disabled={savingTask}
                >
                  <div className="flex items-center gap-2">
                    {savingTask ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4 text-warning" />}
                    <span>Excluir apenas hoje ({new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })})</span>
                  </div>
                </Button>
              )}
              
              <Button 
                variant="destructive" 
                className="w-full justify-start" 
                onClick={() => deleteTaskConfirm && handleConfirmDeleteTask(deleteTaskConfirm.id, false)}
                disabled={savingTask}
              >
                <div className="flex items-center gap-2">
                  {savingTask ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  <span>{deleteTaskConfirm?.dias_semana && deleteTaskConfirm.dias_semana.length > 0 ? 'Excluir toda a série (Permanente)' : 'Excluir Permanentemente'}</span>
                </div>
              </Button>
              
              <Button variant="ghost" className="w-full" onClick={() => setTaskDeleteConfirm(null)} disabled={savingTask}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <InviteMemberDialog open={showInvite} onOpenChange={setShowInvite} />
      </div>
    </PageTransition>
    </ErrorBoundary>
  );
};

export default UsersPage;
