import { useApp } from '@/context/AppContext';
import { Users, Shield, User as UserIcon } from 'lucide-react';

const UsersPage = () => {
  const { users } = useApp();

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{users.length} membros da família</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {users.map(user => (
          <div key={user.id} className="glass-card rounded-xl p-5 animate-fade-in">
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${user.tipo === 'master' ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                {user.nome[0]}
              </div>
              <div>
                <h3 className="font-display font-semibold text-foreground">{user.nome}</h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1 ${
                user.tipo === 'master' ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
              }`}>
                {user.tipo === 'master' ? <Shield className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                {user.tipo === 'master' ? 'Master' : 'Simples'}
              </span>
              <span className="text-xs text-muted-foreground">{user.nivel}</span>
              <span className="text-xs font-medium text-primary">{user.pontos} pts</span>
              {user.tipo === 'simples' && (
                <span className="text-xs font-medium text-reward">R$ {user.saldo.toFixed(2)}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UsersPage;
