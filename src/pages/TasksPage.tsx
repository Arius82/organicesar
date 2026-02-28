import { useApp } from '@/context/AppContext';
import { CheckCircle2, Clock, XCircle, AlertCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CreateTaskDialog from '@/components/CreateTaskDialog';

const statusConfig = {
  pendente: { label: 'Pendente', icon: Clock, className: 'bg-muted text-muted-foreground' },
  aguardando_aprovacao: { label: 'Aguardando', icon: AlertCircle, className: 'bg-warning/10 text-warning' },
  concluida: { label: 'Concluída', icon: CheckCircle2, className: 'bg-success/10 text-success' },
  rejeitada: { label: 'Rejeitada', icon: XCircle, className: 'bg-destructive/10 text-destructive' },
};

const freqLabels = { diaria: 'Diária', semanal: 'Semanal', mensal: 'Mensal', unica: 'Única' };

const TasksPage = () => {
  const { currentUser, tasks, users, isMaster, updateTaskStatus } = useApp();
  if (!currentUser) return null;

  const userTasks = isMaster ? tasks : tasks.filter(t => t.usuario_id === currentUser.id);

  const isOverdue = (task: typeof tasks[0]) => task.status === 'pendente' && new Date(task.data_limite) < new Date();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{userTasks.length} tarefa{userTasks.length !== 1 ? 's' : ''}</p>
        {isMaster && <CreateTaskDialog />}
      </div>

      <div className="space-y-3">
        {userTasks.map(task => {
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
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{task.descricao}</p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    {isMaster && user && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">{user.nome[0]}</div>
                        {user.nome}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">{freqLabels[task.frequencia]}</span>
                    <span className="text-xs font-medium text-reward flex items-center gap-1">
                      R$ {task.valor_recompensa.toFixed(2)}
                    </span>
                    <span className="text-xs text-muted-foreground">Prazo: {new Date(task.data_limite).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  {/* Simple user: mark as done */}
                  {!isMaster && task.status === 'pendente' && (
                    <Button size="sm" className="gradient-primary text-primary-foreground text-xs" onClick={() => updateTaskStatus(task.id, 'aguardando_aprovacao')}>
                      Concluir <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  )}
                  {/* Master: approve/reject */}
                  {isMaster && task.status === 'aguardando_aprovacao' && (
                    <>
                      <Button size="sm" className="gradient-primary text-primary-foreground text-xs" onClick={() => updateTaskStatus(task.id, 'concluida')}>
                        Aprovar
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs text-destructive border-destructive/30" onClick={() => updateTaskStatus(task.id, 'rejeitada')}>
                        Rejeitar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TasksPage;
