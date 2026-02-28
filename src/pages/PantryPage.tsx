import { useApp } from '@/context/AppContext';
import { Package, AlertTriangle } from 'lucide-react';
import AddPantryItemDialog from '@/components/AddPantryItemDialog';

const categoryEmoji: Record<string, string> = {
  'Grãos': '🌾', 'Laticínios': '🥛', 'Proteínas': '🥚', 'Padaria': '🍞',
  'Frutas': '🍎', 'Temperos': '🫒', 'Verduras': '🥬', 'Bebidas': '🥤',
};

const PantryPage = () => {
  const { pantry, isMaster } = useApp();

  const grouped = pantry.reduce((acc, item) => {
    if (!acc[item.categoria]) acc[item.categoria] = [];
    acc[item.categoria].push(item);
    return acc;
  }, {} as Record<string, typeof pantry>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{pantry.length} itens na despensa</p>
        {isMaster && <AddPantryItemDialog />}
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
                    {low && <AlertTriangle className="w-4 h-4 text-warning" />}
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className={`font-bold ${low ? 'text-warning' : 'text-primary'}`}>{item.quantidade}</span>
                    <span className="text-muted-foreground">/ mín. {item.quantidade_minima}</span>
                  </div>
                  {item.validade && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Validade: {new Date(item.validade).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {!isMaster && (
        <p className="text-xs text-muted-foreground text-center italic">Somente visualização</p>
      )}
    </div>
  );
};

export default PantryPage;
