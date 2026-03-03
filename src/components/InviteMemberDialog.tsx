import { useState } from 'react';
import { Mail, User, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const InviteMemberDialog = ({ open, onOpenChange }: InviteMemberDialogProps) => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'master' | 'simples'>('simples');
  const [loading, setLoading] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke('invite-member', {
        body: { email: email.trim(), nome: nome.trim(), role },
      });

      if (res.error) {
        toast.error(res.error.message || 'Erro ao enviar convite');
      } else if (res.data?.error) {
        toast.error(res.data.error);
      } else {
        toast.success(`Convite enviado para ${email}!`);
        setNome('');
        setEmail('');
        setRole('simples');
        onOpenChange(false);
      }
    } catch (err) {
      toast.error('Erro ao enviar convite');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" />
            Convidar Membro da Família
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleInvite} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome completo</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Nome do membro"
                className="pl-10"
                required
                maxLength={100}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>E-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
                className="pl-10"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tipo de usuário</Label>
            <Select value={role} onValueChange={v => setRole(v as 'master' | 'simples')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="simples">Simples</SelectItem>
                <SelectItem value="master">Master</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            Um email de convite será enviado para o membro se cadastrar na família.
          </p>
          <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar Convite'} <Send className="w-4 h-4 ml-2" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InviteMemberDialog;
