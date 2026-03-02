import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import logo from '@/assets/logo.png';

const ForgotPasswordPage = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await resetPassword(email);
    if (error) setError(error);
    else setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/10 p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <img src={logo} alt="OrganiCésar" className="w-24 h-24 mx-auto mb-2 object-contain drop-shadow-lg" />
          <h2 className="font-display font-bold text-xl text-foreground">Esqueci a Senha</h2>
          <p className="text-muted-foreground text-sm mt-1">Enviaremos um link para redefinir</p>
        </div>

        <div className="glass-card rounded-2xl p-6 space-y-6">
          {sent ? (
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                <Send className="w-5 h-5 text-success" />
              </div>
              <h3 className="font-display font-semibold text-foreground">Email enviado!</h3>
              <p className="text-sm text-muted-foreground">
                Verifique sua caixa de entrada em <strong>{email}</strong> e clique no link para redefinir sua senha.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} placeholder="seu@email.com" className="pl-10" required />
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar Link'}
              </Button>
            </form>
          )}

          <div className="text-center">
            <Link to="/login" className="text-sm text-primary hover:underline flex items-center justify-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar para Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
