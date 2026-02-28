import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Leaf, Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const LoginPage = () => {
  const { login, users } = useApp();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!login(email)) {
      setError('Email não encontrado. Tente um dos emails abaixo.');
    }
  };

  const quickLogin = (userEmail: string) => {
    login(userEmail);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4">
            <Leaf className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">OrganiCésar</h1>
          <p className="text-muted-foreground mt-2">Gestão doméstica inteligente</p>
        </div>

        <div className="glass-card rounded-2xl p-6 space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  className="pl-10"
                />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full gradient-primary text-primary-foreground">
              Entrar <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          <div className="border-t border-border pt-4">
            <p className="text-xs text-muted-foreground mb-3 text-center">Acesso rápido (demo)</p>
            <div className="grid grid-cols-2 gap-2">
              {users.map(u => (
                <button
                  key={u.id}
                  onClick={() => quickLogin(u.email)}
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${u.tipo === 'master' ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                    {u.nome[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{u.nome}</p>
                    <p className="text-xs text-muted-foreground capitalize">{u.tipo}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
