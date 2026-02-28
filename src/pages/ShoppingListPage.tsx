import { useApp } from '@/context/AppContext';
import { ShoppingCart, Check, Zap } from 'lucide-react';

const ShoppingListPage = () => {
  const { shopping, isMaster, toggleShoppingItem } = useApp();

  const pendingItems = shopping.filter(i => i.status === 'pendente');
  const boughtItems = shopping.filter(i => i.status === 'comprado');

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{pendingItems.length} pendente{pendingItems.length !== 1 ? 's' : ''} • {boughtItems.length} comprado{boughtItems.length !== 1 ? 's' : ''}</p>

      {pendingItems.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-primary" /> A comprar
          </h3>
          {pendingItems.map(item => (
            <div key={item.id} className="glass-card rounded-xl p-4 flex items-center gap-3 animate-fade-in">
              <button
                onClick={() => isMaster && toggleShoppingItem(item.id)}
                className={`w-6 h-6 rounded-md border-2 border-primary/30 flex items-center justify-center transition-all ${isMaster ? 'hover:border-primary cursor-pointer' : 'cursor-default'}`}
              />
              <div className="flex-1">
                <p className="font-medium text-foreground">{item.nome_item}</p>
                <p className="text-xs text-muted-foreground">Qtd: {item.quantidade}</p>
              </div>
              {item.gerado_automaticamente && (
                <span className="text-xs bg-info/10 text-info px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Auto
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {boughtItems.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-display font-semibold text-muted-foreground flex items-center gap-2">
            <Check className="w-4 h-4" /> Comprados
          </h3>
          {boughtItems.map(item => (
            <div key={item.id} className="glass-card rounded-xl p-4 flex items-center gap-3 opacity-60">
              <button
                onClick={() => isMaster && toggleShoppingItem(item.id)}
                className="w-6 h-6 rounded-md gradient-primary flex items-center justify-center cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 text-primary-foreground" />
              </button>
              <p className="font-medium text-foreground line-through">{item.nome_item}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShoppingListPage;
