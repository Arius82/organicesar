import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import PageTransition from '@/components/PageTransition';
import { AlertTriangle, Pencil, Trash2, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import AddPantryItemDialog from '@/components/AddPantryItemDialog';
import type { PantryItem } from '@/types';

const categories = ['Grãos', 'Laticínios', 'Proteínas', 'Padaria', 'Frutas', 'Temperos', 'Verduras', 'Bebidas', 'Limpeza', 'Outros'];
const categoryEmoji: Record<string, string> = {
  'Grãos': '🌾', 'Laticínios': '🥛', 'Proteínas': '🥚', 'Padaria': '🍞',
  'Frutas': '🍎', 'Temperos': '🫒', 'Verduras': '🥬', 'Bebidas': '🥤',
};

const PantryPage = () => {
  const { pantry, isMaster, editPantryItem, deletePantryItem } = useApp();
  const [editing, setEditing] = useState<PantryItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ nome_item: '', quantidade: '', quantidade_minima: '', categoria: '', validade: '' });
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('todos');
  const [stockFilter, setStockFilter] = useState('todos');

  const filtered = pantry.filter(item => {
    const matchesSearch = item.nome_item.toLowerCase().includes(search.toLowerCase());
    const matchesCat = catFilter === 'todos' || item.categoria === catFilter;
    const low = item.quantidade <= item.quantidade_minima;
    const matchesStock = stockFilter === 'todos' || (stockFilter === 'baixo' && low) || (stockFilter === 'ok' && !low);
    return matchesSearch && matchesCat && matchesStock;
  });

  const grouped = filtered.reduce((acc, item) => {
    if (!acc[item.categoria]) acc[item.categoria] = [];
    acc[item.categoria].push(item);
    return acc;
  }, {} as Record<string, typeof pantry>);

  const openEdit = (item: PantryItem) => {
    setEditForm({ nome_item: item.nome_item, quantidade: item.quantidade.toString(), quantidade_minima: item.quantidade_minima.toString(), categoria: item.categoria, validade: item.validade || '' });
    setEditing(item);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    editPantryItem(editing.id, {
      nome_item: editForm.nome_item.trim(), quantidade: parseInt(editForm.quantidade) || 0,
      quantidade_minima: parseInt(editForm.quantidade_minima) || 1, categoria: editForm.categoria,
      validade: editForm.validade || undefined,
    });
    setEditing(null);
  };

  return (
    <PageTransition>
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar item..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          {isMaster && <AddPantryItemDialog />}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas categorias</SelectItem>
              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={stockFilter} onValueChange={setStockFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Estoque" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todo estoque</SelectItem>
              <SelectItem value="baixo">Estoque baixo</SelectItem>
              <SelectItem value="ok">Estoque OK</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground ml-auto">{filtered.length} itens</p>
        </div>
      </div>

      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat}>
          <h3 className="font-display font-semibold text-foreground mb-2 flex items-center gap-2">
            <span>{categoryEmoji[cat] || '📦'}</span> {cat}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map(item => {
              const low = item.quantidade <= item.quantidade_minima;
              return (
                <div key={item.id} className={`glass-card rounded-xl p-4 animate-fade-in ${low ? 'border-warning/40' : ''}`}>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-foreground">{item.nome_item}</h4>
                    <div className="flex items-center gap-1">
                      {low && <AlertTriangle className="w-4 h-4 text-warning" />}
                      {isMaster && (
                        <>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => openEdit(item)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteConfirm(item.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className={`font-bold ${low ? 'text-warning' : 'text-primary'}`}>{item.quantidade}</span>
                    <span className="text-muted-foreground">/ mín. {item.quantidade_minima}</span>
                  </div>
                  {item.validade && <p className="text-xs text-muted-foreground mt-2">Validade: {new Date(item.validade).toLocaleDateString('pt-BR')}</p>}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhum item encontrado.</p>}
      {!isMaster && <p className="text-xs text-muted-foreground text-center italic">Somente visualização</p>}

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-display">Editar Item</DialogTitle></DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2"><Label>Nome</Label><Input value={editForm.nome_item} onChange={e => setEditForm(f => ({ ...f, nome_item: e.target.value }))} required /></div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={editForm.categoria} onValueChange={v => setEditForm(f => ({ ...f, categoria: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Quantidade</Label><Input type="number" min="0" value={editForm.quantidade} onChange={e => setEditForm(f => ({ ...f, quantidade: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Qtd Mínima</Label><Input type="number" min="0" value={editForm.quantidade_minima} onChange={e => setEditForm(f => ({ ...f, quantidade_minima: e.target.value }))} /></div>
            </div>
            <div className="space-y-2"><Label>Validade</Label><Input type="date" value={editForm.validade} onChange={e => setEditForm(f => ({ ...f, validade: e.target.value }))} /></div>
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
            <Button variant="destructive" onClick={() => { deleteConfirm && deletePantryItem(deleteConfirm); setDeleteConfirm(null); }}>Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </PageTransition>
  );
};

export default PantryPage;
