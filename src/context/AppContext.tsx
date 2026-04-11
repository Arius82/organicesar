import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import type { User, Task, RewardHistory, PantryItem, ShoppingItem, MealPlan, TaskStatus } from '@/types';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  tasks: Task[];
  rewards: RewardHistory[];
  pantry: PantryItem[];
  shopping: ShoppingItem[];
  meals: MealPlan[];
  isMaster: boolean;
  loading: boolean;
  logout: () => Promise<void>;
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
  editMeal: (mealId: string, data: Partial<Omit<MealPlan, 'id'>>) => void;
  deleteMeal: (mealId: string) => void;
  addUser: (user: Omit<User, 'id' | 'data_criacao' | 'pontos' | 'nivel' | 'sequencia_dias'>) => void;
  editUser: (userId: string, data: Partial<Omit<User, 'id' | 'data_criacao'>>) => void;
  deleteUser: (userId: string) => void;
  refreshData: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: authUser, signOut } = useAuth();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [rewards, setRewards] = useState<RewardHistory[]>([]);
  const [pantry, setPantry] = useState<PantryItem[]>([]);
  const [shopping, setShopping] = useState<ShoppingItem[]>([]);
  const [meals, setMeals] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const isMaster = currentUser?.tipo === 'master';

  const fetchUsers = useCallback(async () => {
    const { data: profiles } = await supabase.from('profiles').select('*');
    const { data: roles } = await supabase.from('user_roles').select('*');
    if (!profiles) return [];
    
    const mapped: User[] = profiles.map(p => {
      const role = roles?.find(r => r.user_id === p.id);
      return {
        id: p.id,
        nome: p.nome,
        email: p.email,
        tipo: (role?.role as 'master' | 'simples') || 'simples',
        saldo: Number(p.saldo) || 0,
        ativo: p.ativo,
        data_criacao: p.created_at?.split('T')[0] || '',
        pontos: p.pontos || 0,
        nivel: (p.nivel as User['nivel']) || 'Iniciante',
        sequencia_dias: p.sequencia_dias || 0,
        avatar: p.avatar || undefined,
      };
    });
    setUsers(mapped);
    return mapped;
  }, []);

  const fetchAll = useCallback(async () => {
    if (!authUser) { console.log('[AppContext] No authUser'); setLoading(false); return; }
    console.log('[AppContext] fetchAll for:', authUser.id);
    setLoading(true);
    
    try {
      const usersData = await fetchUsers();
      console.log('[AppContext] users:', usersData.length);
      const me = usersData.find(u => u.id === authUser.id) || null;
      console.log('[AppContext] me:', me?.nome);
      setCurrentUser(me);

      const [tasksRes, rewardsRes, pantryRes, shoppingRes, mealsRes] = await Promise.all([
        supabase.from('tasks').select('*').order('data_criacao', { ascending: false }),
        supabase.from('rewards').select('*').order('data', { ascending: false }),
        supabase.from('pantry_items').select('*').order('categoria'),
        supabase.from('shopping_items').select('*').order('created_at', { ascending: false }),
        supabase.from('meal_plans').select('*').order('data'),
      ]);
      console.log('[AppContext] data loaded, tasks:', tasksRes.data?.length, 'error:', tasksRes.error?.message);

      if (tasksRes.data) setTasks(tasksRes.data.map(t => ({
        id: t.id, titulo: t.titulo, descricao: t.descricao, usuario_id: t.usuario_id,
        frequencia: t.frequencia as Task['frequencia'], valor_recompensa: Number(t.valor_recompensa),
        status: t.status as Task['status'], data_criacao: t.data_criacao, data_limite: t.data_limite || '',
        data_conclusao: t.data_conclusao || undefined,
      })));
      if (rewardsRes.data) setRewards(rewardsRes.data.map(r => ({
        id: r.id, usuario_id: r.usuario_id, valor: Number(r.valor),
        tipo: r.tipo as 'credito' | 'debito', descricao: r.descricao, data: r.data,
      })));
      if (pantryRes.data) setPantry(pantryRes.data.map(p => ({
        id: p.id, nome_item: p.nome_item, quantidade: p.quantidade,
        quantidade_minima: p.quantidade_minima, categoria: p.categoria,
        validade: p.validade || undefined,
      })));
      if (shoppingRes.data) setShopping(shoppingRes.data.map(s => ({
        id: s.id, nome_item: s.nome_item, quantidade: s.quantidade,
        status: s.status as 'pendente' | 'comprado', gerado_automaticamente: s.gerado_automaticamente,
      })));
      if (mealsRes.data) setMeals(mealsRes.data.map(m => ({
        id: m.id, data: m.data, refeicao: m.refeicao as 'cafe' | 'almoco' | 'jantar',
        descricao: m.descricao, ingredientes_relacionados: m.ingredientes_relacionados || [],
      })));
    } catch (err) {
      console.error('[AppContext] fetchAll error:', err);
    }

    setLoading(false);
  }, [authUser, fetchUsers]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const fetchTasks = useCallback(async () => {
    const { data } = await supabase.from('tasks').select('*').order('data_criacao', { ascending: false });
    if (data) setTasks(data.map(t => ({
      id: t.id, titulo: t.titulo, descricao: t.descricao, usuario_id: t.usuario_id,
      frequencia: t.frequencia as Task['frequencia'], valor_recompensa: Number(t.valor_recompensa),
      status: t.status as Task['status'], data_criacao: t.data_criacao, data_limite: t.data_limite || '',
      data_conclusao: t.data_conclusao || undefined,
    })));
  }, []);

  const fetchRewards = useCallback(async () => {
    const { data } = await supabase.from('rewards').select('*').order('data', { ascending: false });
    if (data) setRewards(data.map(r => ({
      id: r.id, usuario_id: r.usuario_id, valor: Number(r.valor),
      tipo: r.tipo as 'credito' | 'debito', descricao: r.descricao, data: r.data,
    })));
  }, []);

  const fetchPantry = useCallback(async () => {
    const { data } = await supabase.from('pantry_items').select('*').order('categoria');
    if (data) setPantry(data.map(p => ({
      id: p.id, nome_item: p.nome_item, quantidade: p.quantidade,
      quantidade_minima: p.quantidade_minima, categoria: p.categoria, validade: p.validade || undefined,
    })));
  }, []);

  const fetchShopping = useCallback(async () => {
    const { data } = await supabase.from('shopping_items').select('*').order('created_at', { ascending: false });
    if (data) setShopping(data.map(s => ({
      id: s.id, nome_item: s.nome_item, quantidade: s.quantidade,
      status: s.status as 'pendente' | 'comprado', gerado_automaticamente: s.gerado_automaticamente,
    })));
  }, []);

  const fetchMeals = useCallback(async () => {
    const { data } = await supabase.from('meal_plans').select('*').order('data');
    if (data) setMeals(data.map(m => ({
      id: m.id, data: m.data, refeicao: m.refeicao as 'cafe' | 'almoco' | 'jantar',
      descricao: m.descricao, ingredientes_relacionados: m.ingredientes_relacionados || [],
    })));
  }, []);

  // Realtime subscriptions
  useEffect(() => {
    if (!authUser) return;

    const channel = supabase
      .channel('app-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => { fetchTasks(); fetchRewards(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meal_plans' }, () => fetchMeals())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pantry_items' }, () => { fetchPantry(); fetchShopping(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shopping_items' }, () => { fetchShopping(); fetchPantry(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rewards' }, () => fetchRewards())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchUsers().then(usersData => {
        const me = usersData.find(u => u.id === authUser.id) || null;
        setCurrentUser(me);
      }))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [authUser, fetchUsers, fetchTasks, fetchRewards, fetchPantry, fetchShopping, fetchMeals]);

  const logout = useCallback(async () => {
    await signOut();
    setCurrentUser(null);
  }, [signOut]);

  const updateTaskStatus = useCallback(async (taskId: string, newStatus: TaskStatus) => {
    const { error } = await supabase.rpc('update_task_status', { _task_id: taskId, _new_status: newStatus });
    if (error) { console.error('Error updating task status:', error); return; }
    fetchAll();
  }, [fetchAll]);

  const toggleShoppingItem = useCallback(async (itemId: string) => {
    const item = shopping.find(i => i.id === itemId);
    if (!item) return;
    await supabase.from('shopping_items').update({
      status: item.status === 'pendente' ? 'comprado' : 'pendente',
    }).eq('id', itemId);
  }, [shopping]);

  const addTask = useCallback(async (task: Omit<Task, 'id' | 'status' | 'data_criacao'>) => {
    const { error } = await supabase.from('tasks').insert({
      titulo: task.titulo, descricao: task.descricao, usuario_id: task.usuario_id,
      frequencia: task.frequencia, valor_recompensa: task.valor_recompensa,
      data_limite: task.data_limite, created_by: authUser?.id,
    });
    if (error) {
      console.error('Error adding task:', error);
      return;
    }
    await fetchTasks();
  }, [authUser, fetchTasks]);

  const editTask = useCallback(async (taskId: string, data: Partial<Omit<Task, 'id' | 'status' | 'data_criacao'>>) => {
    const { error } = await supabase.from('tasks').update(data).eq('id', taskId);
    if (error) console.error('Error editing task:', error);
    else await fetchTasks();
  }, [fetchTasks]);

  const deleteTask = useCallback(async (taskId: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) console.error('Error deleting task:', error);
    else await fetchTasks();
  }, [fetchTasks]);

  const addPantryItem = useCallback(async (item: Omit<PantryItem, 'id'>) => {
    const { error } = await supabase.from('pantry_items').insert(item);
    if (error) console.error('Error adding pantry item:', error);
    else await fetchPantry();
  }, [fetchPantry]);

  const editPantryItem = useCallback(async (itemId: string, data: Partial<Omit<PantryItem, 'id'>>) => {
    const { error } = await supabase.from('pantry_items').update(data).eq('id', itemId);
    if (error) console.error('Error editing pantry item:', error);
    else await fetchPantry();
  }, [fetchPantry]);

  const deletePantryItem = useCallback(async (itemId: string) => {
    const { error } = await supabase.from('pantry_items').delete().eq('id', itemId);
    if (error) console.error('Error deleting pantry item:', error);
    else await fetchPantry();
  }, [fetchPantry]);

  const addShoppingItem = useCallback(async (item: { nome_item: string; quantidade: number }) => {
    const { error } = await supabase.from('shopping_items').insert(item);
    if (error) console.error('Error adding shopping item:', error);
    else await fetchShopping();
  }, [fetchShopping]);

  const editShoppingItem = useCallback(async (itemId: string, data: Partial<Omit<ShoppingItem, 'id'>>) => {
    const { error } = await supabase.from('shopping_items').update(data).eq('id', itemId);
    if (error) console.error('Error editing shopping item:', error);
    else await fetchShopping();
  }, [fetchShopping]);

  const deleteShoppingItem = useCallback(async (itemId: string) => {
    const { error } = await supabase.from('shopping_items').delete().eq('id', itemId);
    if (error) console.error('Error deleting shopping item:', error);
    else await fetchShopping();
  }, [fetchShopping]);

  const addMeal = useCallback(async (meal: Omit<MealPlan, 'id'>) => {
    const { error } = await supabase.from('meal_plans').insert(meal);
    if (error) console.error('Error adding meal:', error);
    else await fetchMeals();
  }, [fetchMeals]);

  const editMeal = useCallback(async (mealId: string, data: Partial<Omit<MealPlan, 'id'>>) => {
    const { error } = await supabase.from('meal_plans').update(data).eq('id', mealId);
    if (error) console.error('Error editing meal:', error);
    else await fetchMeals();
  }, [fetchMeals]);

  const deleteMeal = useCallback(async (mealId: string) => {
    const { error } = await supabase.from('meal_plans').delete().eq('id', mealId);
    if (error) console.error('Error deleting meal:', error);
    else await fetchMeals();
  }, [fetchMeals]);

  const addUser = useCallback(async (_user: Omit<User, 'id' | 'data_criacao' | 'pontos' | 'nivel' | 'sequencia_dias'>) => {
    // Users are now created through signup - this is a placeholder
    fetchAll();
  }, [fetchAll]);

  const editUser = useCallback(async (userId: string, data: Partial<Omit<User, 'id' | 'data_criacao'>>) => {
    const { tipo, ...profileData } = data as any;
    if (Object.keys(profileData).length > 0) {
      await supabase.from('profiles').update(profileData).eq('id', userId);
    }
    // Update role if tipo changed
    if (tipo) {
      await supabase.from('user_roles').update({ role: tipo }).eq('user_id', userId);
    }
    fetchAll();
  }, [fetchAll]);

  const deleteUser = useCallback(async (userId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await supabase.functions.invoke('delete-user', {
      body: { user_id: userId },
    });
    if (res.error) {
      console.error('Error deleting user:', res.error);
      return;
    }
    fetchAll();
  }, [fetchAll]);

  return (
    <AppContext.Provider value={{
      currentUser, users, tasks, rewards, pantry, shopping, meals,
      isMaster, loading, logout, updateTaskStatus, toggleShoppingItem,
      addTask, editTask, deleteTask,
      addPantryItem, editPantryItem, deletePantryItem,
      addShoppingItem, editShoppingItem, deleteShoppingItem,
      addMeal, editMeal, deleteMeal, addUser, editUser, deleteUser, refreshData: fetchAll,
    }}>
      {children}
    </AppContext.Provider>
  );
};
