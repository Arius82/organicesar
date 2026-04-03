import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import PageTransition from '@/components/PageTransition';
import { Shield, User as UserIcon, Pencil, Trash2, Mail, Star, Flame, Search, Send } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useNotifications } from '@/context/NotificationContext';
import InviteMemberDialog from '@/components/InviteMemberDialog';
import type { User, UserType } from '@/types';

interface UserFormData {
  nome: string;
  email: string;
  tipo: UserType;
  saldo: string;
  ativo: boolean;
}

const UserForm = ({ form, setForm, onSubmit, submitLabel }: {
  form: UserFormData;
  setForm: (fn: (f: UserFormData) => UserFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel: string;
}) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <div className="space-y-2">
      <Label>Nome completo</Label>
      <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: João Silva" required maxLength={100} />
    </div>
    <div className="space-y-2">
      <Label>E-mail</Label>
      <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="joao@familia.com" required disabled={submitLabel === 'Salvar Alterações'} className={submitLabel === 'Salvar Alterações' ? 'opacity-50 cursor-not-allowed' : ''} />
      {submitLabel === 'Salvar Alterações' && <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado.</p>}
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-2">
        <Label>Tipo de usuário</Label>
        <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v as UserType }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="master">Master</SelectItem>
            <SelectItem value="simples">Simples</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Saldo inicial (R$)</Label>
        <Input type="number" step="0.01" min="0" value={form.saldo} onChange={e => setForm(f => ({ ...f, saldo: e.target.value }))} />
      </div>
    </div>
    <div className="flex items-center justify-between rounded-lg border border-input p-3">
      <Label className="cursor-pointer">Usuário ativo</Label>
      <Switch checked={form.ativo} onCheckedChange={v => setForm(f => ({ ...f, ativo: v }))} />
    </div>
    <Button type="submit" className="w-full gradient-primary text-primary-foreground">{submitLabel}</Button>
  </form>
);

const UsersPage = () => {
  const { users, currentUser, isMaster, editUser, deleteUser } = useApp();
  const { addNotification } = useNotifications();
  const [showInvite, setShowInvite] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [editForm, setEditForm] = useState<UserFormData>({ nome: '', email: '', tipo: 'simples', saldo: '', ativo: true });

  const filteredUsers = users.filter(u =>
    u.nome.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (user: User) => {
    setEditForm({ nome: user.nome, email: user.email, tipo: user.tipo, saldo: user.saldo.toString(), ativo: user.ativo });
    setEditing(user);
  };


  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    editUser(editing.id, { nome: editForm.nome.trim(), email: editForm.email.trim(), tipo: editForm.tipo, saldo: parseFloat(editForm.saldo) || 0, ativo: editForm.ativo });
    addNotification(`Usuário "${editForm.nome}" atualizado`, 'info');
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    const user = users.find(u => u.id === id);
    deleteUser(id);
    addNotification(`Usuário "${user?.nome}" removido`, 'warning');
    setDeleteConfirm(null);
  };

  return (
    <PageTransition>
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar usuário..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        {isMaster && (
          <Button variant="outline" className="gap-1.5" onClick={() => setShowInvite(true)}>
            <Send className="w-4 h-4" /> Convidar Membro
          </Button>
        )}
      </div>

      <p className="text-sm text-muted-foreground">{filteredUsers.length} membro{filteredUsers.length !== 1 ? 's' : ''}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredUsers.map(user => (
          <div key={user.id} className={`glass-card rounded-xl p-5 animate-fade-in relative ${!user.ativo ? 'opacity-50' : ''}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${user.tipo === 'master' ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                  {user.nome[0]}
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground">{user.nome}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" /> {user.email}</p>
                </div>
              </div>
              {isMaster && user.id !== currentUser?.id && (
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openEdit(user)}><Pencil className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteConfirm(user.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1 ${
                user.tipo === 'master' ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
              }`}>
                {user.tipo === 'master' ? <Shield className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                {user.tipo === 'master' ? 'Master' : 'Simples'}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1"><Star className="w-3 h-3" /> {user.nivel}</span>
              <span className="text-xs font-medium text-primary">{user.pontos} pts</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1"><Flame className="w-3 h-3" /> {user.sequencia_dias}d</span>
              {user.tipo === 'simples' && <span className="text-xs font-medium text-reward">R$ {user.saldo.toFixed(2)}</span>}
              {!user.ativo && <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">Inativo</span>}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-display">Novo Usuário</DialogTitle></DialogHeader>
          <UserForm form={addForm} setForm={setAddForm} onSubmit={handleAdd} submitLabel="Criar Usuário" />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-display">Editar Usuário</DialogTitle></DialogHeader>
          <UserForm form={editForm} setForm={setEditForm} onSubmit={handleEdit} submitLabel="Salvar Alterações" />
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={o => !o && setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Excluir Usuário?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">O usuário e todas as suas tarefas serão removidos. Esta ação não pode ser desfeita.</p>
          <div className="flex gap-2 justify-end mt-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>

      <InviteMemberDialog open={showInvite} onOpenChange={setShowInvite} />
    </div>
    </PageTransition>
  );
};

export default UsersPage;
