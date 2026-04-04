import { useApp } from '@/context/AppContext';
import { CheckSquare, Clock, AlertTriangle, Trophy, Users, TrendingUp, Star, Zap, CheckCircle, XCircle } from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

const StatCard = ({ icon: Icon, label, value, subtitle, variant = 'default' }: {
  icon: React.ElementType; label: string; value: string | number; subtitle?: string;
  variant?: 'default' | 'primary' | 'warning' | 'reward';
}) => {
  const variantStyles = {
    default: 'bg-card border-border',
    primary: 'gradient-primary text-primary-foreground border-transparent',
    warning: 'bg-warning/10 border-warning/20',
    reward: 'bg-secondary border-border',
  };
  return (
    <div className={`rounded-xl border p-4 ${variantStyles[variant]} animate-scale-in`}>
      <div className="flex items-center gap-3 mb-2">
        <Icon className={`w-5 h-5 ${variant === 'primary' ? 'text-primary-foreground/80' : variant === 'warning' ? 'text-warning' : 'text-primary'}`} />
        <span className={`text-sm font-medium ${variant === 'primary' ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{label}</span>
      </div>
      <p className={`text-2xl font-display font-bold ${variant === 'primary' ? '' : 'text-foreground'}`}>{value}</p>
      {subtitle && <p className={`text-xs mt-1 ${variant === 'primary' ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>{subtitle}</p>}
    </div>
  );
};

const DashboardPage = () => {
  const { currentUser, tasks, users, isMaster, rewards, updateTaskStatus } = useApp();
  if (!currentUser) return null;

  const userTasks = isMaster ? tasks : tasks.filter(t => t.usuario_id === currentUser.id);
  const pending = userTasks.filter(t => t.status === 'pendente').length;
  const awaiting = userTasks.filter(t => t.status === 'aguardando_aprovacao').length;
  const completed = userTasks.filter(t => t.status === 'concluida').length;
  const overdue = userTasks.filter(t => t.status === 'pendente' && new Date(t.data_limite) < new Date()).length;

  const totalPaid = rewards.filter(r => r.tipo === 'credito').reduce((acc, r) => acc + r.valor, 0);

  const nivelEmoji = { 'Iniciante': '🌱', 'Organizado': '🌿', 'Mestre da Casa': '🌳' };

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
              {pending > 0 ? `Você tem ${pending} tarefa${pending > 1 ? 's' : ''} pendente${pending > 1 ? 's' : ''}.` : 'Tudo em dia! Continue assim! 🎉'}
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

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Clock} label="Pendentes" value={pending} variant="default" />
        <StatCard icon={CheckSquare} label="Concluídas" value={completed} variant="primary" />
        <StatCard icon={AlertTriangle} label="Atrasadas" value={overdue} variant="warning" />
        {isMaster ? (
          <StatCard icon={Trophy} label="Pago total" value={`R$ ${totalPaid.toFixed(2)}`} variant="reward" />
        ) : (
          <StatCard icon={Trophy} label="Saldo" value={`R$ ${currentUser.saldo.toFixed(2)}`} variant="reward" />
        )}
      </div>

      {/* Awaiting approval (master) */}
      {isMaster && awaiting > 0 && (
        <div className="glass-card rounded-xl p-4">
          <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-warning" /> Aguardando aprovação ({awaiting})
          </h3>
          <div className="space-y-2">
            {tasks.filter(t => t.status === 'aguardando_aprovacao').map(task => {
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
            {[...users].sort((a, b) => b.pontos - a.pontos).map((user, i) => (
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
