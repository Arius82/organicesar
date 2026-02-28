import { useApp } from '@/context/AppContext';
import { Trophy, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

const RewardsPage = () => {
  const { currentUser, rewards, users, isMaster } = useApp();
  if (!currentUser) return null;

  const userRewards = isMaster ? rewards : rewards.filter(r => r.usuario_id === currentUser.id);

  return (
    <div className="space-y-6">
      {/* Balance card */}
      {!isMaster && (
        <div className="gradient-reward rounded-2xl p-6 text-reward-foreground animate-scale-in">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-6 h-6" />
            <span className="text-sm font-medium opacity-80">Seu saldo</span>
          </div>
          <p className="text-3xl font-display font-bold">R$ {currentUser.saldo.toFixed(2)}</p>
        </div>
      )}

      {/* History */}
      <div>
        <h3 className="font-display font-semibold text-foreground mb-3">Histórico</h3>
        <div className="space-y-2">
          {userRewards.map(reward => {
            const user = users.find(u => u.id === reward.usuario_id);
            return (
              <div key={reward.id} className="glass-card rounded-xl p-4 flex items-center gap-3 animate-fade-in">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${reward.tipo === 'credito' ? 'bg-success/10' : 'bg-destructive/10'}`}>
                  {reward.tipo === 'credito' ? (
                    <ArrowUpCircle className="w-4 h-4 text-success" />
                  ) : (
                    <ArrowDownCircle className="w-4 h-4 text-destructive" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{reward.descricao}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {isMaster && user && <span>{user.nome}</span>}
                    <span>{new Date(reward.data).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
                <span className={`font-display font-bold text-sm ${reward.tipo === 'credito' ? 'text-success' : 'text-destructive'}`}>
                  {reward.tipo === 'credito' ? '+' : '-'} R$ {reward.valor.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RewardsPage;
