import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useAlarms } from '@/context/AlarmContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { User, Camera, Lock, Save, Trophy, Flame, Star, Pencil, Bell, BellOff, Volume2, VolumeX, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import AvatarPicker from '@/components/AvatarPicker';
import PageTransition from '@/components/PageTransition';

const ProfilePage = () => {
  const { currentUser, refreshData } = useApp();
  const { updatePassword } = useAuth();
  const { isMuted, toggleMute, notificationPermission, requestNotificationPermission } = useAlarms();
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

  if (!currentUser) return null;

  return (
    <PageTransition>
    <div className="max-w-2xl mx-auto space-y-6">
      
      {/* Premium Notification Banner - RACE Framework (Convert) */}
      {notificationPermission !== 'granted' && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary/10 border-2 border-primary/30 rounded-2xl p-5 relative overflow-hidden ring-4 ring-primary/5 mb-6 shadow-sm"
        >
          <div className="absolute -top-4 -right-2 p-4 opacity-5 pointer-events-none">
             <Bell className="w-32 h-32 text-primary" />
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row gap-4 items-center">
            <div className={`p-3 rounded-full animate-pulse shadow-lg ${notificationPermission === 'denied' ? 'bg-destructive/20 shadow-destructive/20' : 'bg-primary/20 shadow-primary/20'}`}>
              <Bell className={`w-7 h-7 ${notificationPermission === 'denied' ? 'text-destructive' : 'text-primary'}`} />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-display font-bold text-lg text-primary leading-none mb-1">
                {notificationPermission === 'denied' ? 'Notificações Bloqueadas' : 'Ative seus Alarmes'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {notificationPermission === 'denied' 
                  ? 'Você bloqueou as notificações. Para receber os alarmes, é necessário liberá-las manualmente no navegador.'
                  : 'Para garantir que as tarefas sejam cumpridas no horário, ative as notificações push agora.'}
              </p>
            </div>
            <Button 
              onClick={notificationPermission === 'denied' 
                ? () => toast({ title: 'Ação necessária', description: 'Libere as notificações nas configurações do navegador.' })
                : requestNotificationPermission
              }
              className="font-bold shadow-md hover:scale-105 transition-all px-8 h-11 gradient-primary text-primary-foreground min-w-[170px]"
            >
              {notificationPermission === 'denied' ? 'Como liberar?' : 'Ativar Agora'}
            </Button>
          </div>
        </motion.div>
      )}

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
          <div className="grid grid-cols-3 gap-4 text-center" >
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
            <Label className="flex items-center gap-2">
              <Camera className="w-4 h-4" /> Avatar
            </Label>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start"
              onClick={() => setAvatarPickerOpen(true)}
            >
              {avatarUrl ? (
                <div className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback>?</AvatarFallback>
                  </Avatar>
                  <span>Avatar selecionado</span>
                </div>
              ) : (
                <span>Escolher avatar</span>
              )}
            </Button>
          </div>
          <Button onClick={handleSaveProfile} disabled={savingProfile} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            {savingProfile ? 'Salvando...' : 'Salvar Perfil'}
          </Button>

          <div className="pt-4 border-t border-border/50">
            <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/30">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isMuted ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                  {isMuted ? <VolumeX className="w-5 h-5 text-destructive" /> : <Volume2 className="w-5 h-5 text-primary" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Sons do Alarme</p>
                  <p className="text-xs text-muted-foreground">{isMuted ? 'Silenciados' : 'Ativos'}</p>
                </div>
              </div>
              <Switch checked={!isMuted} onCheckedChange={toggleMute} />
            </div>
          </div>
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

      <AvatarPicker
        open={avatarPickerOpen}
        onOpenChange={setAvatarPickerOpen}
        currentAvatar={avatarUrl}
        onSelect={(url) => setAvatarUrl(url)}
      />
    </div>
    </PageTransition>
  );
};

export default ProfilePage;
