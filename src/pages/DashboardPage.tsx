import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { CheckSquare, Clock, AlertTriangle, Trophy, Users, TrendingUp, Star, Zap, CheckCircle, XCircle, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import type { Task } from '@/types';
import { toast } from '@/hooks/use-toast';

const toDateStr = (d: Date) => d.toISOString().split('T')[0];

const StatCard = ({ icon: Icon, label, value, subtitle, variant = 'default', onClick }: {
  icon: React.ElementType; label: string; value: string | number; subtitle?: string;
  variant?: 'default' | 'primary' | 'warning' | 'reward';
  onClick?: () => void;
}) => {
  const variantStyles = {
    default: 'bg-card border-border',
    primary: 'gradient-primary text-primary-foreground border-transparent',
    warning: 'bg-warning/10 border-warning/20',
    reward: 'bg-secondary border-border',
  };
  return (
    <div
      className={`rounded-xl border p-4 ${variantStyles[variant]} animate-scale-in ${onClick ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3 mb-2">
        <Icon className={`w-5 h-5 ${variant === 'primary' ? 'text-primary-foreground/80' : variant === 'warning' ? 'text-warning' : 'text-primary'}`} />
        <span className={`text-sm font-medium ${variant === 'primary' ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{label}</span>
      </div>
      <p className={`text-2xl font-display font-bold ${variant === 'primary' ? '' : 'text-foreground'}`}>{value}</p>
      {subtitle && <p className={`text-xs mt-1 ${variant === 'primary' ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>{subtitle}</p>}
    </div>
  );
};

const statusLabel: Record<string, string> = {
  pendente: 'Pendente',
  aguardando_aprovacao: 'Aguardando aprovação',
  concluida: 'Concluída',
  rejeitada: 'Rejeitada',
};

const DashboardPage = () => {
  const { currentUser, tasks, users, isMaster, rewards, updateTaskStatus, editTask, deleteTask } = useApp();
  const navigate = useNavigate();
  const [taskDialog, setTaskDialog] = useState<{ title: string; filterFn: (t: Task) => boolean } | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editForm, setEditForm] = useState({ titulo: '', descricao: '', valor_recompensa: 0, data_limite: '' });

  if (!currentUser) return null;

  const todayStr = toDateStr(new Date());
  const userTasks = isMaster ? tasks : tasks.filter(t => t.usuario_id === currentUser.id);
  const pendingTasks = userTasks.filter(t => t.status === 'pendente');
  const awaitingTasks = userTasks.filter(t => t.status === 'aguardando_aprovacao');
  const completedTasks = userTasks.filter(t => t.status === 'concluida');
  const overdueTasks = userTasks.filter(t => t.status === 'pendente' && new Date(t.data_limite) < new Date());

  const myTodayTasks = tasks
    .filter(t => t.usuario_id === currentUser.id && t.data_limite === todayStr && t.status !== 'concluida')
    .sort((a, b) => {
      const order: Record<string, number> = { pendente: 0, aguardando_aprovacao: 1, rejeitada: 2 };
      return (order[a.status] ?? 3) - (order[b.status] ?? 3);
    });

  const totalPaid = rewards.filter(r => r.tipo === 'credito').reduce((acc, r) => acc + r.valor, 0);
  const nivelEmoji: Record<string, string> = { 'Iniciante': '🌱', 'Organizado': '🌿', 'Mestre da Casa': '🌳' };

  const todayStatusLabel: Record<string, string> = {
    pendente: 'A fazer',
    aguardando_aprovacao: 'Aguardando aprovação',
    rejeitada: 'Rejeitada - refazer',
  };

  return (
    <PageTransition>
    <div className="space-y-6">
      {/* Welcome */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">
              Olá, {currentUser.nome}! 👋
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {myTodayTasks.length > 0
                ? `Você tem ${myTodayTasks.length} tarefa${myTodayTasks.length > 1 ? 's' : ''} para hoje.`
                : 'Tudo em dia! Continue assim! 🎉'}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-secondary rounded-xl px-4 py-2">
            <span className="text-2xl">{nivelEmoji[currentUser.nivel]}</span>
            <div>
              <p className="text-xs text-muted-foreground">Nível</p>
              <p className="text-sm font-bold text-foreground">{currentUser.nivel}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's tasks */}
      {myTodayTasks.length > 0 && (
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Tarefas de hoje
            </h3>
            <Button variant="ghost" size="sm" className="text-xs h-7 text-primary" onClick={() => navigate('/tasks')}>
              Ver todas <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
          <div className="space-y-2">
            {myTodayTasks.map(task => (
              <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 transition-colors">
                {task.status === 'pendente' ? (
                  <button
                    onClick={() => updateTaskStatus(task.id, 'aguardando_aprovacao')}
                    className="w-7 h-7 rounded-full border-2 border-primary/40 flex items-center justify-center flex-shrink-0 hover:bg-primary/10 hover:border-primary transition-colors cursor-pointer"
                    title="Marcar como concluída"
                  >
                    <CheckCircle className="w-4 h-4 text-primary/40 hover:text-primary" />
                  </button>
                ) : (
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    task.status === 'aguardando_aprovacao' ? 'bg-warning/20' : 'bg-destructive/20'
                  }`}>
                    {task.status === 'aguardando_aprovacao'
                      ? <Clock className="w-4 h-4 text-warning" />
                      : <XCircle className="w-4 h-4 text-destructive" />
                    }
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{task.titulo}</p>
                  <p className="text-xs text-muted-foreground">{todayStatusLabel[task.status] || task.status}</p>
                </div>
                {task.valor_recompensa > 0 && (
                  <span className="text-xs font-semibold text-reward flex-shrink-0">R$ {task.valor_recompensa.toFixed(2)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats - clickable */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Clock} label="Pendentes" value={pendingTasks.length} variant="default"
          onClick={() => setTaskDialog({ title: 'Tarefas Pendentes', filterFn: t => t.status === 'pendente' })} />
        <StatCard icon={CheckSquare} label="Concluídas" value={completedTasks.length} variant="primary"
          onClick={() => setTaskDialog({ title: 'Tarefas Concluídas', filterFn: t => t.status === 'concluida' })} />
        <StatCard icon={AlertTriangle} label="Atrasadas" value={overdueTasks.length} variant="warning"
          onClick={() => setTaskDialog({ title: 'Tarefas Atrasadas', filterFn: t => t.status === 'pendente' && new Date(t.data_limite) < new Date() })} />
        {isMaster ? (
          <StatCard icon={Trophy} label="Pago total" value={`R$ ${totalPaid.toFixed(2)}`} variant="reward" />
        ) : (
          <StatCard icon={Trophy} label="Saldo" value={`R$ ${currentUser.saldo.toFixed(2)}`} variant="reward" />
        )}
      </div>

      {/* Task list dialog */}
      <Dialog open={!!taskDialog} onOpenChange={o => !o && { ...setTaskDialog(null), ...setEditingTask(null) }}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{taskDialog?.title}</DialogTitle>
          </DialogHeader>

          {/* Edit form */}
          {editingTask && (
            <div className="border border-primary/20 rounded-lg p-4 space-y-3 bg-muted/30">
              <p className="text-sm font-semibold text-foreground">Editar tarefa</p>
              <Input value={editForm.titulo} onChange={e => setEditForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Título" />
              <Input value={editForm.descricao} onChange={e => setEditForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Descrição" />
              <div className="flex gap-2">
                <Input type="number" value={editForm.valor_recompensa} onChange={e => setEditForm(f => ({ ...f, valor_recompensa: Number(e.target.value) }))} placeholder="Recompensa" className="flex-1" />
                <Input type="date" value={editForm.data_limite} onChange={e => setEditForm(f => ({ ...f, data_limite: e.target.value }))} className="flex-1" />
              </div>
              <DialogFooter className="flex-row gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setEditingTask(null)}>Cancelar</Button>
                <Button size="sm" onClick={async () => {
                  await editTask(editingTask.id, {
                    titulo: editForm.titulo,
                    descricao: editForm.descricao,
                    valor_recompensa: editForm.valor_recompensa,
                    data_limite: editForm.data_limite,
                  });
                  toast({ title: 'Tarefa atualizada' });
                  setEditingTask(null);
                }}>Salvar</Button>
              </DialogFooter>
            </div>
          )}

          <div className="space-y-2 mt-2">
            {(() => {
              const filtered = taskDialog ? userTasks.filter(taskDialog.filterFn) : [];
              if (filtered.length === 0) return <p className="text-sm text-muted-foreground text-center py-4">Nenhuma tarefa encontrada</p>;
              return filtered.map(task => {
                const user = users.find(u => u.id === task.usuario_id);
                const overdue = task.status === 'pendente' && new Date(task.data_limite) < new Date();
                return (
                  <div key={task.id} className={`flex items-center gap-3 p-3 rounded-lg bg-muted/50 ${overdue ? 'border border-destructive/30' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium text-foreground ${task.status === 'concluida' ? 'line-through opacity-60' : ''}`}>{task.titulo}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {user && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Avatar className="w-4 h-4">
                              {user.avatar && <AvatarImage src={user.avatar} />}
                              <AvatarFallback className="text-[8px] font-bold bg-primary/20 text-primary">{user.nome[0]}</AvatarFallback>
                            </Avatar>
                            {user.nome}
                          </span>
                        )}
                        {task.data_limite && <span className="text-xs text-muted-foreground">{new Date(task.data_limite + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>}
                        {overdue && <span className="text-xs bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-full">Atrasada</span>}
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{statusLabel[task.status] || task.status}</span>
                      </div>
                    </div>
                    {task.valor_recompensa > 0 && (
                      <span className="text-xs font-semibold text-reward flex-shrink-0 mr-1">R$ {task.valor_recompensa.toFixed(2)}</span>
                    )}
                    {isMaster && (
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => { setEditingTask(task); setEditForm({ titulo: task.titulo, descricao: task.descricao, valor_recompensa: task.valor_recompensa, data_limite: task.data_limite }); }}
                          className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm('Excluir esta tarefa?')) {
                              await deleteTask(task.id);
                              toast({ title: 'Tarefa excluída' });
                            }
                          }}
                          className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Awaiting approval (master) */}
      {isMaster && awaitingTasks.length > 0 && (
        <div className="glass-card rounded-xl p-4">
          <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-warning" /> Aguardando aprovação ({awaitingTasks.length})
          </h3>
          <div className="space-y-2">
            {awaitingTasks.map(task => {
              const user = users.find(u => u.id === task.usuario_id);
              return (
                 <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                   <div>
                     <p className="text-sm font-medium text-foreground">{task.titulo}</p>
                     <p className="text-xs text-muted-foreground">{user?.nome} • R$ {task.valor_recompensa.toFixed(2)}</p>
                   </div>
                   <div className="flex gap-1.5">
                     <Button size="sm" variant="outline" className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10" onClick={() => updateTaskStatus(task.id, 'rejeitada')}>
                       <XCircle className="w-3.5 h-3.5 mr-1" /> Rejeitar
                     </Button>
                     <Button size="sm" className="h-7 px-2 text-xs gradient-primary text-primary-foreground" onClick={() => updateTaskStatus(task.id, 'concluida')}>
                       <CheckCircle className="w-3.5 h-3.5 mr-1" /> Aprovar
                     </Button>
                   </div>
                 </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Gamification */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card rounded-xl p-4">
          <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-reward" /> Pontuação
          </h3>
          <div className="flex items-center gap-4">
            <div className="text-3xl font-display font-bold text-primary">{currentUser.pontos}</div>
            <div className="text-sm text-muted-foreground">pontos acumulados</div>
          </div>
          <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full gradient-primary rounded-full transition-all" style={{ width: `${Math.min(100, (currentUser.pontos / 500) * 100)}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{Math.max(0, 500 - currentUser.pontos)} pontos para o próximo nível</p>
        </div>

        <div className="glass-card rounded-xl p-4">
          <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Sequência
          </h3>
          <div className="flex items-center gap-4">
            <div className="text-3xl font-display font-bold text-primary">{currentUser.sequencia_dias}</div>
            <div className="text-sm text-muted-foreground">dias consecutivos</div>
          </div>
          <div className="flex gap-1 mt-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className={`h-6 flex-1 rounded ${i < Math.min(7, currentUser.sequencia_dias) ? 'gradient-primary' : 'bg-muted'}`} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Última semana</p>
        </div>
      </div>

      {/* Ranking (master) */}
      {isMaster && (
        <div className="glass-card rounded-xl p-4">
          <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> Ranking da família
          </h3>
          <div className="space-y-2">
            {[...users].filter(u => u.ativo).sort((a, b) => b.pontos - a.pontos).map((user, i) => (
               <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                 <span className="text-lg w-8 text-center">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}º`}</span>
                 <Avatar className="w-8 h-8">
                   {user.avatar && <AvatarImage src={user.avatar} alt={user.nome} />}
                   <AvatarFallback className={`text-xs font-bold ${user.tipo === 'master' ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                     {user.nome[0]}
                   </AvatarFallback>
                 </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{user.nome}</p>
                  <p className="text-xs text-muted-foreground">{user.nivel}</p>
                </div>
                <span className="text-sm font-bold text-primary">{user.pontos} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
    </PageTransition>
  );
};

export default DashboardPage;
