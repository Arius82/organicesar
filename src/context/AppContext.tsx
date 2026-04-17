import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { PANTRY_CATEGORIES } from '@/constants';
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
  addTask: (task: Omit<Task, 'id' | 'status' | 'data_criacao'>) => Promise<boolean>;
  editTask: (taskId: string, data: Partial<Omit<Task, 'id' | 'status' | 'data_criacao'>>) => Promise<boolean>;
  deleteTask: (taskId: string, onlyDate?: string) => Promise<boolean>;
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
  autoSyncShoppingList: () => Promise<{ added: number }>;
  clearBoughtItems: () => Promise<void>;
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

  // Helper to parse/stringify metadata in description
  const parseTask = (t: any): Task => {
    let dias_semana: number[] | undefined = undefined;
    let excecoes: string[] | undefined = undefined;
    let descricao = t.descricao || '';
    
    // Parse days
    const daysMatch = descricao.match(/\[meta:days:([\d,]+)\]/);
    if (daysMatch) {
      dias_semana = daysMatch[1].split(',').map(Number);
      descricao = descricao.replace(/\[meta:days:[\d,]+\]/, '').trim();
    }

    // Parse exceptions
    const exMatch = descricao.match(/\[meta:ex:([\d\-,]+)\]/);
    if (exMatch) {
      excecoes = exMatch[1].split(',');
      descricao = descricao.replace(/\[meta:ex:[\d\-,]+\]/, '').trim();
    }

    // Parse alarm
    let alarme_ativo = false;
    let alarme_hora = '';
    let alarme_som = 1;

    const alMatch = descricao.match(/\[meta:al:(\d),([\d:]+),(\d)\]/);
    if (alMatch) {
      alarme_ativo = alMatch[1] === '1';
      alarme_hora = alMatch[2];
      alarme_som = Number(alMatch[3]);
      descricao = descricao.replace(/\[meta:al:[\d,:]+\]/, '').trim();
    }

    return {
      id: t.id, 
      titulo: t.titulo, 
      descricao, 
      usuario_id: t.usuario_id,
      frequencia: t.frequencia as Task['frequencia'], 
      valor_recompensa: Number(t.valor_recompensa),
      status: t.status as Task['status'], 
      data_criacao: t.data_criacao, 
      data_limite: t.data_limite || '',
      data_conclusao: t.data_conclusao || undefined,
      dias_semana: dias_semana,
      excecoes: excecoes,
      alarme_ativo,
      alarme_hora,
      alarme_som,
    };
  };

  const stringifyTask = (desc: string, days?: number[], ex?: string[], al?: { ativo?: boolean; hora?: string; som?: number }) => {
    let finalDesc = desc;
    if (days && days.length > 0) {
      finalDesc += `\n\n[meta:days:${days.join(',')}]`;
    }
    if (ex && ex.length > 0) {
      finalDesc += `\n\n[meta:ex:${ex.join(',')}]`;
    }
    if (al?.ativo) {
      finalDesc += `\n\n[meta:al:1,${al.hora || '08:00'},${al.som || 1}]`;
    }
    return finalDesc.trim();
  };

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

  const fetchAll = useCallback(async (silent = false) => {
    if (!authUser) { console.log('[AppContext] No authUser'); setLoading(false); return; }
    
    if (!silent) {
      console.log('[AppContext] fetchAll (visible) for:', authUser.id);
      setLoading(true);
    } else {
      console.log('[AppContext] fetchAll (silent) for:', authUser.id);
    }
    
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

      if (tasksRes.data) setTasks(tasksRes.data.map(parseTask));
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
    if (data) setTasks(data.map(parseTask));
  }, [parseTask]);

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
    // Optimistic UI update
    const previousTasks = [...tasks];
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

    const { error } = await supabase.rpc('update_task_status', { _task_id: taskId, _new_status: newStatus });
    if (error) { 
      console.error('Error updating task status:', error); 
      setTasks(previousTasks); // Rollback
      return; 
    }
    // fetchAll() removed - realtime handles this
  }, [tasks]);

  const toggleShoppingItem = useCallback(async (itemId: string) => {
    const item = shopping.find(i => i.id === itemId);
    if (!item) return;

    const previousShopping = [...shopping];
    const newStatus = item.status === 'pendente' ? 'comprado' : 'pendente';

    // Optimistic Update
    setShopping(prev => prev.map(s => s.id === itemId ? { ...s, status: newStatus } : s));

    try {
      if (item.status === 'pendente') {
        const normalizedReqName = item.nome_item.trim().toLowerCase();
        const existingInPantry = pantry.find(p => p.nome_item.trim().toLowerCase() === normalizedReqName);

        if (existingInPantry) {
          await supabase.from('pantry_items')
            .update({ quantidade: existingInPantry.quantidade + item.quantidade })
            .eq('id', existingInPantry.id);
        } else {
          await supabase.from('pantry_items')
            .insert({
              nome_item: item.nome_item,
              quantidade: item.quantidade,
              quantidade_minima: 1,
              categoria: 'Outros'
            });
        }
      }

      const { error } = await supabase.from('shopping_items').update({
        status: newStatus,
      }).eq('id', itemId);

      if (error) throw error;
    } catch (err) {
      console.error('Error toggling shopping item:', err);
      setShopping(previousShopping); // Rollback
    }
  }, [shopping, pantry]);

  const addTask = useCallback(async (task: Omit<Task, 'id' | 'status' | 'data_criacao'>): Promise<boolean> => {
    // Optimistic Update
    const tempId = `temp-${Date.now()}`;
    const newTask: Task = {
      ...task,
      id: tempId,
      status: 'pendente',
      data_criacao: new Date().toISOString()
    };
    
    setTasks(prev => [newTask, ...prev]);

    const { error } = await supabase.from('tasks').insert({
      titulo: task.titulo, 
      descricao: stringifyTask(task.descricao, task.dias_semana, task.excecoes, { 
        ativo: task.alarme_ativo, 
        hora: task.alarme_hora, 
        som: task.alarme_som 
      }), 
      usuario_id: task.usuario_id,
      frequencia: task.frequencia, 
      valor_recompensa: task.valor_recompensa,
      data_limite: task.data_limite, 
      created_by: authUser?.id,
    });

    if (error) {
      console.error('Error adding task:', error);
      setTasks(prev => prev.filter(t => t.id !== tempId)); // Rollback
      return false;
    }

    // Refresh to get real ID and finalized data
    fetchTasks();
    return true;
  }, [authUser, stringifyTask, fetchTasks]);

  const editTask = useCallback(async (taskId: string, data: Partial<Omit<Task, 'id' | 'status' | 'data_criacao'>>): Promise<boolean> => {
    // Optimistic Update
    const previousTasks = [...tasks];
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...data } : t));

    const payload: any = { ...data };
    
    // Tunnel dias_semana/excecoes into descricao if provided
    if (data.dias_semana !== undefined || data.descricao !== undefined || data.excecoes !== undefined) {
      const currentTask = previousTasks.find(t => t.id === taskId);
      const finalDesc = data.descricao !== undefined ? data.descricao : (currentTask?.descricao || '');
      const finalDays = data.dias_semana !== undefined ? data.dias_semana : currentTask?.dias_semana;
      const finalEx = data.excecoes !== undefined ? data.excecoes : currentTask?.excecoes;
      const finalAl = {
        ativo: data.alarme_ativo !== undefined ? data.alarme_ativo : currentTask?.alarme_ativo,
        hora: data.alarme_hora !== undefined ? data.alarme_hora : currentTask?.alarme_hora,
        som: data.alarme_som !== undefined ? data.alarme_som : currentTask?.alarme_som,
      };
      payload.descricao = stringifyTask(finalDesc, finalDays, finalEx, finalAl);
      delete payload.dias_semana;
      delete payload.excecoes;
      delete payload.alarme_ativo;
      delete payload.alarme_hora;
      delete payload.alarme_som;
    }

    const { error } = await supabase.from('tasks').update(payload).eq('id', taskId);
    if (error) {
      console.error('Error editing task:', error);
      setTasks(previousTasks); // Rollback
      return false;
    }
    return true;
  }, [stringifyTask, tasks]);

  const deleteTask = useCallback(async (taskId: string, onlyDate?: string): Promise<boolean> => {
    const previousTasks = [...tasks];
    
    if (onlyDate) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        const newEx = [...(task.excecoes || []), onlyDate];
        return await editTask(taskId, { excecoes: newEx });
      }
    }

    // Optimistic Update
    setTasks(prev => prev.filter(t => t.id !== taskId));

    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) {
      console.error('Error deleting task:', error);
      setTasks(previousTasks); // Rollback
      return false;
    }
    return true;
  }, [tasks, editTask]);

  const addPantryItem = useCallback(async (item: Omit<PantryItem, 'id'>) => {
    const { error } = await supabase.from('pantry_items').insert(item);
    if (error) console.error('Error adding pantry item:', error);
  }, []);

  const editPantryItem = useCallback(async (itemId: string, data: Partial<Omit<PantryItem, 'id'>>) => {
    const { error } = await supabase.from('pantry_items').update(data).eq('id', itemId);
    if (error) console.error('Error editing pantry item:', error);
  }, []);

  const deletePantryItem = useCallback(async (itemId: string) => {
    const { error } = await supabase.from('pantry_items').delete().eq('id', itemId);
    if (error) console.error('Error deleting pantry item:', error);
  }, []);

  const addShoppingItem = useCallback(async (item: { nome_item: string; quantidade: number }) => {
    const { error } = await supabase.from('shopping_items').insert(item);
    if (error) console.error('Error adding shopping item:', error);
  }, []);

  const editShoppingItem = useCallback(async (itemId: string, data: Partial<Omit<ShoppingItem, 'id'>>) => {
    const { error } = await supabase.from('shopping_items').update(data).eq('id', itemId);
    if (error) console.error('Error editing shopping item:', error);
  }, []);

  const deleteShoppingItem = useCallback(async (itemId: string) => {
    const { error } = await supabase.from('shopping_items').delete().eq('id', itemId);
    if (error) console.error('Error deleting shopping item:', error);
  }, []);

  const addMeal = useCallback(async (meal: Omit<MealPlan, 'id'>) => {
    const { error } = await supabase.from('meal_plans').insert(meal);
    if (error) console.error('Error adding meal:', error);
  }, []);

  const editMeal = useCallback(async (mealId: string, data: Partial<Omit<MealPlan, 'id'>>) => {
    const { error } = await supabase.from('meal_plans').update(data).eq('id', mealId);
    if (error) console.error('Error editing meal:', error);
  }, []);

  const deleteMeal = useCallback(async (mealId: string) => {
    const { error } = await supabase.from('meal_plans').delete().eq('id', mealId);
    if (error) console.error('Error deleting meal:', error);
  }, []);

  const addUser = useCallback(async (_user: Omit<User, 'id' | 'data_criacao' | 'pontos' | 'nivel' | 'sequencia_dias'>) => {
    // Users are now created through signup - this is a placeholder
    fetchAll(true);
  }, [fetchAll]);

  const editUser = useCallback(async (userId: string, data: Partial<Omit<User, 'id' | 'data_criacao'>>) => {
    // Optimistic Update
    const previousUsers = [...users];
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...data } : u));
    
    const { tipo, ...profileData } = data as any;
    try {
      if (Object.keys(profileData).length > 0) {
        await supabase.from('profiles').update(profileData).eq('id', userId);
      }
      // Update role if tipo changed
      if (tipo) {
        await supabase.from('user_roles').update({ role: tipo }).eq('user_id', userId);
      }
    } catch (err) {
      console.error('Error editing user:', err);
      setUsers(previousUsers); // Rollback
    }
    fetchAll(true);
  }, [fetchAll, users]);

  const autoSyncShoppingList = useCallback(async () => {
    const lowStockItems = pantry.filter(item => item.quantidade <= item.quantidade_minima);
    let addedCount = 0;

    for (const item of lowStockItems) {
      const alreadyInList = shopping.find(s => 
        s.nome_item.toLowerCase() === item.nome_item.toLowerCase() && s.status === 'pendente'
      );

      if (!alreadyInList) {
        await supabase.from('shopping_items').insert({
          nome_item: item.nome_item,
          quantidade: item.quantidade_minima - item.quantidade + 1, // Sugestão simples
          status: 'pendente',
          gerado_automaticamente: true
        });
        addedCount++;
      }
    }
    
    if (addedCount > 0) fetchShopping();
    return { added: addedCount };
  }, [pantry, shopping, fetchShopping]);

  const clearBoughtItems = useCallback(async () => {
    const { error } = await supabase.from('shopping_items').delete().eq('status', 'comprado');
    if (error) console.error('Error clearing bought items:', error);
    else fetchShopping();
  }, [fetchShopping]);

  const deleteUser = useCallback(async (userId: string) => {
    const previousUsers = [...users];
    // Optimistic Update
    setUsers(prev => prev.filter(u => u.id !== userId));

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setUsers(previousUsers);
      return;
    }
    
    const res = await supabase.functions.invoke('delete-user', {
      body: { user_id: userId },
    });
    
    if (res.error) {
      console.error('Error deleting user:', res.error);
      setUsers(previousUsers); // Rollback
      return;
    }
    fetchAll(true);
  }, [fetchAll, users]);

  return (
    <AppContext.Provider value={{
      currentUser, users, tasks, rewards, pantry, shopping, meals,
      isMaster, loading, logout, updateTaskStatus, toggleShoppingItem,
      addTask, editTask, deleteTask,
      addPantryItem, editPantryItem, deletePantryItem,
      addShoppingItem, editShoppingItem, deleteShoppingItem,
      autoSyncShoppingList, clearBoughtItems,
      addMeal, editMeal, deleteMeal, addUser, editUser, deleteUser, refreshData: () => fetchAll(true),
    }}>
      {children}
    </AppContext.Provider>
  );
};
