import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { User, Camera, Lock, Save, Trophy, Flame, Star, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import AvatarPicker from '@/components/AvatarPicker';

const ProfilePage = () => {
  const { currentUser, refreshData } = useApp();
  const { updatePassword } = useAuth();
  const { toast } = useToast();

  const [nome, setNome] = useState(currentUser?.nome || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatar || '');
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const handleSaveProfile = async () => {
    if (!nome.trim()) {
      toast({ title: 'Nome é obrigatório', variant: 'destructive' });
      return;
    }
    setSavingProfile(true);
    const { error } = await supabase.from('profiles').update({
      nome: nome.trim(),
      avatar: avatarUrl.trim() || null,
    }).eq('id', currentUser!.id);

    if (error) {
      toast({ title: 'Erro ao salvar perfil', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Perfil atualizado com sucesso!' });
      refreshData();
    }
    setSavingProfile(false);
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: 'A nova senha deve ter pelo menos 6 caracteres', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'As senhas não coincidem', variant: 'destructive' });
      return;
    }
    setSavingPassword(true);
    const { error } = await updatePassword(newPassword);
    if (error) {
      toast({ title: 'Erro ao alterar senha', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Senha alterada com sucesso!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
    setSavingPassword(false);
  };

  if (!currentUser) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Stats Card */}
      <Card className="glass-card overflow-hidden">
        <div className="gradient-primary p-6 flex items-center gap-5">
          <div className="relative group cursor-pointer" onClick={() => setAvatarPickerOpen(true)}>
            <Avatar className="w-20 h-20 border-4 border-primary-foreground/20">
              <AvatarImage src={avatarUrl || currentUser.avatar} />
              <AvatarFallback className="text-2xl font-bold bg-primary-foreground/20 text-primary-foreground">
                {currentUser.nome[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Pencil className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="text-primary-foreground">
            <h2 className="font-display text-2xl font-bold">{currentUser.nome}</h2>
            <p className="text-primary-foreground/70 text-sm">{currentUser.email}</p>
            <Badge variant="secondary" className="mt-2 capitalize">{currentUser.tipo}</Badge>
          </div>
        </div>
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <Trophy className="w-5 h-5 mx-auto text-accent" />
              <p className="text-lg font-bold text-foreground">{currentUser.pontos}</p>
              <p className="text-xs text-muted-foreground">Pontos</p>
            </div>
            <div className="space-y-1">
              <Star className="w-5 h-5 mx-auto text-accent" />
              <p className="text-lg font-bold text-foreground">{currentUser.nivel}</p>
              <p className="text-xs text-muted-foreground">Nível</p>
            </div>
            <div className="space-y-1">
              <Flame className="w-5 h-5 mx-auto text-destructive" />
              <p className="text-lg font-bold text-foreground">{currentUser.sequencia_dias}</p>
              <p className="text-xs text-muted-foreground">Sequência</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="w-5 h-5 text-primary" />
            Editar Perfil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="avatar" className="flex items-center gap-2">
              <Camera className="w-4 h-4" /> URL do Avatar
            </Label>
            <Input id="avatar" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://exemplo.com/foto.jpg" />
            <p className="text-xs text-muted-foreground">Cole o link de uma imagem para usar como avatar</p>
          </div>
          <Button onClick={handleSaveProfile} disabled={savingProfile} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            {savingProfile ? 'Salvando...' : 'Salvar Perfil'}
          </Button>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lock className="w-5 h-5 text-primary" />
            Alterar Senha
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nova Senha</Label>
            <Input id="newPassword" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
            <Input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repita a nova senha" />
          </div>
          <Button onClick={handleChangePassword} disabled={savingPassword} variant="outline" className="w-full">
            <Lock className="w-4 h-4 mr-2" />
            {savingPassword ? 'Alterando...' : 'Alterar Senha'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
