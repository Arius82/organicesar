import { useApp } from '@/context/AppContext';
import PageTransition from '@/components/PageTransition';
import { Trophy, ArrowUpCircle, ArrowDownCircle, Gift } from 'lucide-react';
import confetti from 'canvas-confetti';
import { supabase } from '@/integrations/supabase/client';
import { useNotifications } from '@/context/NotificationContext';

const REWARD_CATALOG = [
  { id: '1', title: '1 Hora a mais de Game', price: 10, icon: '🎮', color: 'bg-blue-50 text-blue-600 border-blue-200' },
  { id: '2', title: 'Escolher o Jantar', price: 30, icon: '🍕', color: 'bg-orange-50 text-orange-600 border-orange-200' },
  { id: '3', title: 'Sessão de Cinema', price: 50, icon: '🍿', color: 'bg-purple-50 text-purple-600 border-purple-200' },
  { id: '4', title: 'Fugir de uma Tarefa', price: 100, icon: '🏃‍♂️', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
];

const RewardsPage = () => {
  const { currentUser, rewards, users, isMaster, editUser, refreshData } = useApp();
  const { addNotification } = useNotifications();
  if (!currentUser) return null;

  const userRewards = isMaster ? rewards : rewards.filter(r => r.usuario_id === currentUser.id);

  const handleRedeem = async (item: typeof REWARD_CATALOG[0]) => {
    if (!currentUser) return;
    if (currentUser.saldo < item.price) {
      addNotification(`Saldo insuficiente para resgatar "${item.title}". Você precisa de ${item.price.toFixed(2)} Césares.`, 'error');
      return;
    }
    
    // Aniversário / Sucesso (Dopamina da gamificação)
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 }
    });

    const newSaldo = currentUser.saldo - item.price;
    await editUser(currentUser.id, { saldo: newSaldo });
    
    await supabase.from('rewards').insert({
      usuario_id: currentUser.id,
      valor: item.price,
      tipo: 'debito',
      descricao: `Resgate: ${item.title}`
    });
    
    addNotification(`Boa! Você resgatou "${item.title}".`, 'success');
    refreshData();
  };

  return (
    <PageTransition>
    <div className="space-y-8 pb-10">
      {/* Balance card */}
      {!isMaster && (
        <div className="gradient-reward rounded-2xl p-6 text-reward-foreground animate-scale-in">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-6 h-6" />
            <span className="text-sm font-medium opacity-80">Seu saldo</span>
          </div>
          <p className="text-3xl font-display font-bold">{currentUser.saldo.toFixed(2)} Césares</p>
        </div>
      )}

      {/* Vitrine de Prêmios */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" /> Vitrine de Prêmios
          </h3>
          {isMaster && <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-1 rounded-full uppercase tracking-wider">Modo Visualização</span>}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {REWARD_CATALOG.map(item => (
            <div key={item.id} className="glass-card rounded-2xl p-4 flex flex-col items-center text-center transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98]">
               <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-3 border ${item.color} shadow-sm`}>
                 {item.icon}
               </div>
               <h4 className="font-display font-semibold text-sm mb-1 text-foreground leading-tight">{item.title}</h4>
               <p className="font-bold text-reward mb-4">{item.price.toFixed(2)} Césares</p>
               
               {!isMaster && (
                 <button 
                   onClick={() => handleRedeem(item)}
                   className="w-full mt-auto gradient-primary text-primary-foreground text-xs font-bold py-2 rounded-xl transition-transform hover:opacity-95"
                 >
                   Resgatar
                 </button>
               )}
            </div>
          ))}
        </div>
      </div>

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
                  {reward.tipo === 'credito' ? '+' : '-'} {reward.valor.toFixed(2)} Césares
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
    </PageTransition>
  );
};

export default RewardsPage;
