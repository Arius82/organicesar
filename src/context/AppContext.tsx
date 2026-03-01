import React, { createContext, useContext, useState, useCallback } from 'react';
import type { User, Task, RewardHistory, PantryItem, ShoppingItem, MealPlan, TaskStatus, TaskFrequency } from '@/types';

const mockUsers: User[] = [
  { id: '1', nome: 'César', email: 'cesar@familia.com', tipo: 'master', saldo: 0, ativo: true, data_criacao: '2024-01-01', pontos: 450, nivel: 'Mestre da Casa', sequencia_dias: 15 },
  { id: '2', nome: 'Ana', email: 'ana@familia.com', tipo: 'master', saldo: 0, ativo: true, data_criacao: '2024-01-01', pontos: 380, nivel: 'Organizado', sequencia_dias: 10 },
  { id: '3', nome: 'Lucas', email: 'lucas@familia.com', tipo: 'simples', saldo: 45.50, ativo: true, data_criacao: '2024-02-01', pontos: 220, nivel: 'Organizado', sequencia_dias: 7 },
  { id: '4', nome: 'Sofia', email: 'sofia@familia.com', tipo: 'simples', saldo: 32.00, ativo: true, data_criacao: '2024-02-01', pontos: 150, nivel: 'Iniciante', sequencia_dias: 3 },
];

const mockTasks: Task[] = [
  { id: '1', titulo: 'Lavar a louça', descricao: 'Lavar toda a louça do almoço', usuario_id: '3', frequencia: 'diaria', valor_recompensa: 3.00, status: 'pendente', data_criacao: '2024-03-01', data_limite: '2024-03-01' },
  { id: '2', titulo: 'Arrumar o quarto', descricao: 'Arrumar a cama e organizar o quarto', usuario_id: '4', frequencia: 'diaria', valor_recompensa: 2.50, status: 'aguardando_aprovacao', data_criacao: '2024-03-01', data_limite: '2024-03-01' },
  { id: '3', titulo: 'Varrer a casa', descricao: 'Varrer todos os cômodos', usuario_id: '3', frequencia: 'diaria', valor_recompensa: 5.00, status: 'concluida', data_criacao: '2024-02-28', data_limite: '2024-02-28', data_conclusao: '2024-02-28' },
  { id: '4', titulo: 'Regar as plantas', descricao: 'Regar todas as plantas do jardim', usuario_id: '4', frequencia: 'semanal', valor_recompensa: 4.00, status: 'pendente', data_criacao: '2024-03-01', data_limite: '2024-03-07' },
  { id: '5', titulo: 'Organizar a garagem', descricao: 'Limpar e organizar a garagem', usuario_id: '3', frequencia: 'mensal', valor_recompensa: 15.00, status: 'pendente', data_criacao: '2024-03-01', data_limite: '2024-03-30' },
  { id: '6', titulo: 'Colocar lixo para fora', descricao: 'Levar o lixo até a calçada', usuario_id: '3', frequencia: 'diaria', valor_recompensa: 2.00, status: 'rejeitada', data_criacao: '2024-02-27', data_limite: '2024-02-27' },
];

const mockRewards: RewardHistory[] = [
  { id: '1', usuario_id: '3', valor: 5.00, tipo: 'credito', descricao: 'Varrer a casa - concluída', data: '2024-02-28' },
  { id: '2', usuario_id: '3', valor: 3.00, tipo: 'credito', descricao: 'Lavar a louça - concluída', data: '2024-02-27' },
  { id: '3', usuario_id: '4', valor: 2.50, tipo: 'credito', descricao: 'Arrumar o quarto - concluída', data: '2024-02-27' },
  { id: '4', usuario_id: '3', valor: 10.00, tipo: 'debito', descricao: 'Saque de recompensa', data: '2024-02-25' },
];

const mockPantry: PantryItem[] = [
  { id: '1', nome_item: 'Arroz', quantidade: 2, quantidade_minima: 1, categoria: 'Grãos', validade: '2025-06-01' },
  { id: '2', nome_item: 'Feijão', quantidade: 1, quantidade_minima: 2, categoria: 'Grãos', validade: '2025-05-01' },
  { id: '3', nome_item: 'Leite', quantidade: 3, quantidade_minima: 2, categoria: 'Laticínios', validade: '2024-03-15' },
  { id: '4', nome_item: 'Ovos', quantidade: 6, quantidade_minima: 12, categoria: 'Proteínas', validade: '2024-03-10' },
  { id: '5', nome_item: 'Pão de forma', quantidade: 1, quantidade_minima: 1, categoria: 'Padaria', validade: '2024-03-05' },
  { id: '6', nome_item: 'Maçã', quantidade: 4, quantidade_minima: 3, categoria: 'Frutas' },
  { id: '7', nome_item: 'Azeite', quantidade: 1, quantidade_minima: 1, categoria: 'Temperos', validade: '2025-12-01' },
];

const mockShopping: ShoppingItem[] = [
  { id: '1', nome_item: 'Feijão', quantidade: 2, status: 'pendente', gerado_automaticamente: true },
  { id: '2', nome_item: 'Ovos', quantidade: 12, status: 'pendente', gerado_automaticamente: true },
  { id: '3', nome_item: 'Detergente', quantidade: 2, status: 'pendente', gerado_automaticamente: false },
  { id: '4', nome_item: 'Sabão em pó', quantidade: 1, status: 'comprado', gerado_automaticamente: false },
];

const mockMeals: MealPlan[] = [
  { id: '1', data: '2024-03-04', refeicao: 'cafe', descricao: 'Pão com manteiga, café e frutas', ingredientes_relacionados: ['Pão de forma', 'Manteiga', 'Café', 'Maçã'] },
  { id: '2', data: '2024-03-04', refeicao: 'almoco', descricao: 'Arroz, feijão, frango grelhado e salada', ingredientes_relacionados: ['Arroz', 'Feijão', 'Frango', 'Alface'] },
  { id: '3', data: '2024-03-04', refeicao: 'jantar', descricao: 'Sopa de legumes', ingredientes_relacionados: ['Batata', 'Cenoura', 'Chuchu'] },
  { id: '4', data: '2024-03-05', refeicao: 'cafe', descricao: 'Ovos mexidos com torrada', ingredientes_relacionados: ['Ovos', 'Pão de forma'] },
  { id: '5', data: '2024-03-05', refeicao: 'almoco', descricao: 'Macarrão à bolonhesa', ingredientes_relacionados: ['Macarrão', 'Carne moída', 'Molho de tomate'] },
  { id: '6', data: '2024-03-05', refeicao: 'jantar', descricao: 'Sanduíche natural e suco', ingredientes_relacionados: ['Pão de forma', 'Frango desfiado', 'Maçã'] },
];

interface AppContextType {
  currentUser: User | null;
  users: User[];
  tasks: Task[];
  rewards: RewardHistory[];
  pantry: PantryItem[];
  shopping: ShoppingItem[];
  meals: MealPlan[];
  login: (email: string) => boolean;
  logout: () => void;
  isMaster: boolean;
  updateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  toggleShoppingItem: (itemId: string) => void;
  addTask: (task: Omit<Task, 'id' | 'status' | 'data_criacao'>) => void;
  editTask: (taskId: string, data: Partial<Omit<Task, 'id' | 'status' | 'data_criacao'>>) => void;
  deleteTask: (taskId: string) => void;
  addPantryItem: (item: Omit<PantryItem, 'id'>) => void;
  editPantryItem: (itemId: string, data: Partial<Omit<PantryItem, 'id'>>) => void;
  deletePantryItem: (itemId: string) => void;
  addShoppingItem: (item: { nome_item: string; quantidade: number }) => void;
  editShoppingItem: (itemId: string, data: Partial<Omit<ShoppingItem, 'id'>>) => void;
  deleteShoppingItem: (itemId: string) => void;
  addMeal: (meal: Omit<MealPlan, 'id'>) => void;
  addUser: (user: Omit<User, 'id' | 'data_criacao' | 'pontos' | 'nivel' | 'sequencia_dias'>) => void;
  editUser: (userId: string, data: Partial<Omit<User, 'id' | 'data_criacao'>>) => void;
  deleteUser: (userId: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [rewards] = useState<RewardHistory[]>(mockRewards);
  const [pantry, setPantry] = useState<PantryItem[]>(mockPantry);
  const [shopping, setShopping] = useState<ShoppingItem[]>(mockShopping);
  const [meals, setMeals] = useState<MealPlan[]>(mockMeals);

  const isMaster = currentUser?.tipo === 'master';

  const login = useCallback((email: string) => {
    const user = users.find(u => u.email === email);
    if (user) { setCurrentUser(user); return true; }
    return false;
  }, [users]);

  const logout = useCallback(() => setCurrentUser(null), []);

  const updateTaskStatus = useCallback((taskId: string, newStatus: TaskStatus) => {
    setTasks(prev => {
      const updated = prev.map(t => {
        if (t.id !== taskId) return t;
        const task = { ...t, status: newStatus };
        if (newStatus === 'concluida') {
          task.data_conclusao = new Date().toISOString().split('T')[0];
          setUsers(u => u.map(user =>
            user.id === t.usuario_id ? { ...user, saldo: user.saldo + t.valor_recompensa, pontos: user.pontos + 10 } : user
          ));
        }
        return task;
      });
      return updated;
    });
  }, []);

  const toggleShoppingItem = useCallback((itemId: string) => {
    setShopping(prev => prev.map(i =>
      i.id === itemId ? { ...i, status: i.status === 'pendente' ? 'comprado' : 'pendente' } : i
    ));
  }, []);

  const addTask = useCallback((task: Omit<Task, 'id' | 'status' | 'data_criacao'>) => {
    setTasks(prev => [...prev, {
      ...task, id: Date.now().toString(), status: 'pendente' as const,
      data_criacao: new Date().toISOString().split('T')[0],
    }]);
  }, []);

  const editTask = useCallback((taskId: string, data: Partial<Omit<Task, 'id' | 'status' | 'data_criacao'>>) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...data } : t));
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  }, []);

  const addPantryItem = useCallback((item: Omit<PantryItem, 'id'>) => {
    setPantry(prev => [...prev, { ...item, id: Date.now().toString() }]);
  }, []);

  const editPantryItem = useCallback((itemId: string, data: Partial<Omit<PantryItem, 'id'>>) => {
    setPantry(prev => prev.map(i => i.id === itemId ? { ...i, ...data } : i));
  }, []);

  const deletePantryItem = useCallback((itemId: string) => {
    setPantry(prev => prev.filter(i => i.id !== itemId));
  }, []);

  const addShoppingItem = useCallback((item: { nome_item: string; quantidade: number }) => {
    setShopping(prev => [...prev, {
      ...item, id: Date.now().toString(), status: 'pendente' as const, gerado_automaticamente: false,
    }]);
  }, []);

  const editShoppingItem = useCallback((itemId: string, data: Partial<Omit<ShoppingItem, 'id'>>) => {
    setShopping(prev => prev.map(i => i.id === itemId ? { ...i, ...data } : i));
  }, []);

  const deleteShoppingItem = useCallback((itemId: string) => {
    setShopping(prev => prev.filter(i => i.id !== itemId));
  }, []);

  const addMeal = useCallback((meal: Omit<MealPlan, 'id'>) => {
    setMeals(prev => [...prev, { ...meal, id: Date.now().toString() }]);
  }, []);

  const addUser = useCallback((user: Omit<User, 'id' | 'data_criacao' | 'pontos' | 'nivel' | 'sequencia_dias'>) => {
    setUsers(prev => [...prev, {
      ...user,
      id: Date.now().toString(),
      data_criacao: new Date().toISOString().split('T')[0],
      pontos: 0,
      nivel: 'Iniciante' as const,
      sequencia_dias: 0,
    }]);
  }, []);

  const editUser = useCallback((userId: string, data: Partial<Omit<User, 'id' | 'data_criacao'>>) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...data } : u));
  }, []);

  const deleteUser = useCallback((userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    setTasks(prev => prev.filter(t => t.usuario_id !== userId));
  }, []);

  return (
    <AppContext.Provider value={{
      currentUser, users, tasks, rewards, pantry, shopping, meals,
      login, logout, isMaster, updateTaskStatus, toggleShoppingItem,
      addTask, editTask, deleteTask,
      addPantryItem, editPantryItem, deletePantryItem,
      addShoppingItem, editShoppingItem, deleteShoppingItem,
      addMeal,
      addUser, editUser, deleteUser,
    }}>
      {children}
    </AppContext.Provider>
  );
};
