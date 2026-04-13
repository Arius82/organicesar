import { useApp } from '@/context/AppContext';
import PageTransition from '@/components/PageTransition';
import { BarChart3, CheckSquare, Trophy, ShoppingCart, TrendingUp } from 'lucide-react';

const ReportsPage = () => {
  const { tasks, users, rewards, shopping } = useApp();

  const completedByUser = users.map(user => ({
    user,
    completed: tasks.filter(t => t.usuario_id === user.id && t.status === 'concluida').length,
    pending: tasks.filter(t => t.usuario_id === user.id && t.status === 'pendente').length,
    overdue: tasks.filter(t => t.usuario_id === user.id && t.status === 'pendente' && new Date(t.data_limite) < new Date()).length,
  }));

  const totalPaid = rewards.filter(r => r.tipo === 'credito').reduce((acc, r) => acc + r.valor, 0);
  const totalCompleted = tasks.filter(t => t.status === 'concluida').length;
  const totalOverdue = tasks.filter(t => t.status === 'pendente' && new Date(t.data_limite) < new Date()).length;
  const boughtItems = shopping.filter(i => i.status === 'comprado').length;

  return (
    <PageTransition>
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass-card rounded-xl p-4 animate-scale-in">
          <CheckSquare className="w-5 h-5 text-primary mb-2" />
          <p className="text-2xl font-display font-bold text-foreground">{totalCompleted}</p>
          <p className="text-xs text-muted-foreground">Tarefas concluídas</p>
        </div>
        <div className="glass-card rounded-xl p-4 animate-scale-in">
          <Trophy className="w-5 h-5 text-reward mb-2" />
          <p className="text-2xl font-display font-bold text-foreground">{totalPaid.toFixed(2)} Césares</p>
          <p className="text-xs text-muted-foreground">Recompensas pagas</p>
        </div>
        <div className="glass-card rounded-xl p-4 animate-scale-in">
          <TrendingUp className="w-5 h-5 text-destructive mb-2" />
          <p className="text-2xl font-display font-bold text-foreground">{totalOverdue}</p>
          <p className="text-xs text-muted-foreground">Tarefas atrasadas</p>
        </div>
        <div className="glass-card rounded-xl p-4 animate-scale-in">
          <ShoppingCart className="w-5 h-5 text-info mb-2" />
          <p className="text-2xl font-display font-bold text-foreground">{boughtItems}</p>
          <p className="text-xs text-muted-foreground">Itens comprados</p>
        </div>
      </div>

      {/* Per user */}
      <div className="glass-card rounded-xl p-4">
        <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" /> Desempenho por membro
        </h3>
        <div className="space-y-4">
          {completedByUser.map(({ user, completed, pending, overdue }) => {
            const total = completed + pending;
            const pct = total > 0 ? (completed / total) * 100 : 0;
            return (
              <div key={user.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${user.tipo === 'master' ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                      {user.nome[0]}
                    </div>
                    <span className="text-sm font-medium text-foreground">{user.nome}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="text-success">{completed} ✓</span>
                    <span>{pending} pendentes</span>
                    {overdue > 0 && <span className="text-destructive">{overdue} atrasadas</span>}
                  </div>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full gradient-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
    </PageTransition>
  );
};

export default ReportsPage;
