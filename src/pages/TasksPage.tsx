import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import PageTransition from '@/components/PageTransition';
import { CheckCircle2, Clock, XCircle, AlertCircle, ChevronRight, Pencil, Trash2, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import CreateTaskDialog from '@/components/CreateTaskDialog';
import type { Task, TaskFrequency, TaskStatus } from '@/types';

const statusConfig = {
  pendente: { label: 'Pendente', icon: Clock, className: 'bg-muted text-muted-foreground' },
  aguardando_aprovacao: { label: 'Aguardando', icon: AlertCircle, className: 'bg-warning/10 text-warning' },
  concluida: { label: 'Concluída', icon: CheckCircle2, className: 'bg-success/10 text-success' },
  rejeitada: { label: 'Rejeitada', icon: XCircle, className: 'bg-destructive/10 text-destructive' },
};

const freqLabels = { diaria: 'Diária', semanal: 'Semanal', mensal: 'Mensal', unica: 'Única' };

const TasksPage = () => {
  const { currentUser, tasks, users, isMaster, updateTaskStatus, editTask, deleteTask } = useApp();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ titulo: '', descricao: '', usuario_id: '', frequencia: 'diaria' as TaskFrequency, valor_recompensa: '', data_limite: '' });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [freqFilter, setFreqFilter] = useState<string>('todos');

  if (!currentUser) return null;

  const userTasks = isMaster ? tasks : tasks.filter(t => t.usuario_id === currentUser.id);
  const activeUsers = users.filter(u => u.ativo);
  const isOverdue = (task: Task) => task.status === 'pendente' && new Date(task.data_limite) < new Date();

  const filteredTasks = userTasks.filter(t => {
    const matchesSearch = t.titulo.toLowerCase().includes(search.toLowerCase()) || t.descricao.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || t.status === statusFilter;
    const matchesFreq = freqFilter === 'todos' || t.frequencia === freqFilter;
    return matchesSearch && matchesStatus && matchesFreq;
  });

  const openEdit = (task: Task) => {
    setEditForm({
      titulo: task.titulo, descricao: task.descricao, usuario_id: task.usuario_id,
      frequencia: task.frequencia, valor_recompensa: task.valor_recompensa.toString(), data_limite: task.data_limite,
    });
    setEditingTask(task);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    editTask(editingTask.id, {
      titulo: editForm.titulo.trim(), descricao: editForm.descricao.trim(), usuario_id: editForm.usuario_id,
      frequencia: editForm.frequencia, valor_recompensa: parseFloat(editForm.valor_recompensa) || 0, data_limite: editForm.data_limite,
    });
    setEditingTask(null);
  };

  const handleDelete = (id: string) => { deleteTask(id); setDeleteConfirm(null); };

  return (
    <PageTransition>
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar tarefa..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          {isMaster && <CreateTaskDialog />}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos status</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="aguardando_aprovacao">Aguardando</SelectItem>
              <SelectItem value="concluida">Concluída</SelectItem>
              <SelectItem value="rejeitada">Rejeitada</SelectItem>
            </SelectContent>
          </Select>
          <Select value={freqFilter} onValueChange={setFreqFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Frequência" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas freq.</SelectItem>
              <SelectItem value="diaria">Diária</SelectItem>
              <SelectItem value="semanal">Semanal</SelectItem>
              <SelectItem value="mensal">Mensal</SelectItem>
              <SelectItem value="unica">Única</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground ml-auto">{filteredTasks.length} tarefa{filteredTasks.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="space-y-3">
        {filteredTasks.map(task => {
          const status = statusConfig[task.status];
          const StatusIcon = status.icon;
          const user = users.find(u => u.id === task.usuario_id);
          const overdue = isOverdue(task);

          return (
            <div key={task.id} className={`glass-card rounded-xl p-4 animate-fade-in ${overdue ? 'border-destructive/30' : ''}`}>
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${status.className}`}>
                  <StatusIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-foreground">{task.titulo}</h3>
                    {overdue && <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">Atrasada</span>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{task.descricao}</p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    {isMaster && user && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">{user.nome[0]}</div>
                        {user.nome}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">{freqLabels[task.frequencia]}</span>
                    <span className="text-xs font-medium text-reward flex items-center gap-1">R$ {task.valor_recompensa.toFixed(2)}</span>
                    <span className="text-xs text-muted-foreground">Prazo: {new Date(task.data_limite).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  {!isMaster && task.status === 'pendente' && (
                    <Button size="sm" className="gradient-primary text-primary-foreground text-xs" onClick={() => updateTaskStatus(task.id, 'aguardando_aprovacao')}>
                      Concluir <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  )}
                  {isMaster && task.status === 'aguardando_aprovacao' && (
                    <>
                      <Button size="sm" className="gradient-primary text-primary-foreground text-xs" onClick={() => updateTaskStatus(task.id, 'concluida')}>Aprovar</Button>
                      <Button size="sm" variant="outline" className="text-xs text-destructive border-destructive/30" onClick={() => updateTaskStatus(task.id, 'rejeitada')}>Rejeitar</Button>
                    </>
                  )}
                  {isMaster && (
                    <div className="flex gap-1 mt-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => openEdit(task)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteConfirm(task.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filteredTasks.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhuma tarefa encontrada.</p>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingTask} onOpenChange={o => !o && setEditingTask(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-display">Editar Tarefa</DialogTitle></DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2"><Label>Título</Label><Input value={editForm.titulo} onChange={e => setEditForm(f => ({ ...f, titulo: e.target.value }))} required /></div>
            <div className="space-y-2"><Label>Descrição</Label><Textarea value={editForm.descricao} onChange={e => setEditForm(f => ({ ...f, descricao: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Responsável</Label>
                <Select value={editForm.usuario_id} onValueChange={v => setEditForm(f => ({ ...f, usuario_id: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{activeUsers.map(u => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Frequência</Label>
                <Select value={editForm.frequencia} onValueChange={v => setEditForm(f => ({ ...f, frequencia: v as TaskFrequency }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diaria">Diária</SelectItem><SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="mensal">Mensal</SelectItem><SelectItem value="unica">Única</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Recompensa (R$)</Label><Input type="number" step="0.50" min="0" value={editForm.valor_recompensa} onChange={e => setEditForm(f => ({ ...f, valor_recompensa: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Prazo</Label><Input type="date" value={editForm.data_limite} onChange={e => setEditForm(f => ({ ...f, data_limite: e.target.value }))} required /></div>
            </div>
            <Button type="submit" className="w-full gradient-primary text-primary-foreground">Salvar Alterações</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={o => !o && setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Excluir Tarefa?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita.</p>
          <div className="flex gap-2 justify-end mt-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </PageTransition>
  );
};

export default TasksPage;
