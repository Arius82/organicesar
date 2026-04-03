import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import PageTransition from '@/components/PageTransition';
import { ShoppingCart, Check, Zap, Pencil, Trash2, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import AddShoppingItemDialog from '@/components/AddShoppingItemDialog';
import type { ShoppingItem } from '@/types';

const ShoppingListPage = () => {
  const { shopping, isMaster, toggleShoppingItem, editShoppingItem, deleteShoppingItem } = useApp();
  const [editing, setEditing] = useState<ShoppingItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ nome_item: '', quantidade: '' });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [sourceFilter, setSourceFilter] = useState('todos');

  const filtered = shopping.filter(item => {
    const matchesSearch = item.nome_item.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || item.status === statusFilter;
    const matchesSource = sourceFilter === 'todos' || (sourceFilter === 'auto' && item.gerado_automaticamente) || (sourceFilter === 'manual' && !item.gerado_automaticamente);
    return matchesSearch && matchesStatus && matchesSource;
  });

  const pendingItems = filtered.filter(i => i.status === 'pendente');
  const boughtItems = filtered.filter(i => i.status === 'comprado');

  const openEdit = (item: ShoppingItem) => {
    setEditForm({ nome_item: item.nome_item, quantidade: item.quantidade.toString() });
    setEditing(item);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    editShoppingItem(editing.id, { nome_item: editForm.nome_item.trim(), quantidade: parseInt(editForm.quantidade) || 1 });
    setEditing(null);
  };

  const renderItem = (item: ShoppingItem, bought: boolean) => (
    <div key={item.id} className={`glass-card rounded-xl p-4 flex items-center gap-3 animate-fade-in ${bought ? 'opacity-60' : ''}`}>
      <button
        onClick={() => toggleShoppingItem(item.id)}
        className={`w-6 h-6 rounded-md flex items-center justify-center transition-all flex-shrink-0 cursor-pointer ${
          bought ? 'gradient-primary' : 'border-2 border-primary/30 hover:border-primary'
        }`}
      >
        {bought && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`font-medium text-foreground ${bought ? 'line-through' : ''}`}>{item.nome_item}</p>
        <p className="text-xs text-muted-foreground">Qtd: {item.quantidade}</p>
      </div>
      {item.gerado_automaticamente && (
        <span className="text-xs bg-info/10 text-info px-2 py-0.5 rounded-full flex items-center gap-1"><Zap className="w-3 h-3" /> Auto</span>
      )}
      {isMaster && (
        <div className="flex gap-1 flex-shrink-0">
          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => openEdit(item)}><Pencil className="w-3.5 h-3.5" /></Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteConfirm(item.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
        </div>
      )}
    </div>
  );

  return (
    <PageTransition>
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar item..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <AddShoppingItemDialog />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos status</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="comprado">Comprado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Origem" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas origens</SelectItem>
              <SelectItem value="auto">Automático</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground ml-auto">{pendingItems.length} pendente{pendingItems.length !== 1 ? 's' : ''} • {boughtItems.length} comprado{boughtItems.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {pendingItems.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-display font-semibold text-foreground flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-primary" /> A comprar</h3>
          {pendingItems.map(item => renderItem(item, false))}
        </div>
      )}

      {boughtItems.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-display font-semibold text-muted-foreground flex items-center gap-2"><Check className="w-4 h-4" /> Comprados</h3>
          {boughtItems.map(item => renderItem(item, true))}
        </div>
      )}

      {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhum item encontrado.</p>}

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle className="font-display">Editar Item</DialogTitle></DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2"><Label>Nome</Label><Input value={editForm.nome_item} onChange={e => setEditForm(f => ({ ...f, nome_item: e.target.value }))} required /></div>
            <div className="space-y-2"><Label>Quantidade</Label><Input type="number" min="1" value={editForm.quantidade} onChange={e => setEditForm(f => ({ ...f, quantidade: e.target.value }))} /></div>
            <Button type="submit" className="w-full gradient-primary text-primary-foreground">Salvar</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={o => !o && setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Excluir Item?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita.</p>
          <div className="flex gap-2 justify-end mt-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => { deleteConfirm && deleteShoppingItem(deleteConfirm); setDeleteConfirm(null); }}>Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </PageTransition>
  );
};

export default ShoppingListPage;
