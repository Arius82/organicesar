export type UserType = 'master' | 'simples';

export interface User {
  id: string;
  nome: string;
  email: string;
  tipo: UserType;
  saldo: number;
  ativo: boolean;
  data_criacao: string;
  avatar?: string;
  pontos: number;
  nivel: 'Iniciante' | 'Organizado' | 'Mestre da Casa';
  sequencia_dias: number;
}

export type TaskFrequency = 'diaria' | 'semanal' | 'mensal' | 'unica';
export type TaskStatus = 'pendente' | 'aguardando_aprovacao' | 'concluida' | 'rejeitada';

export interface Task {
  id: string;
  titulo: string;
  descricao: string;
  usuario_id: string;
  frequencia: TaskFrequency;
  valor_recompensa: number;
  status: TaskStatus;
  data_criacao: string;
  data_limite: string;
  data_conclusao?: string;
  /** Dias da semana: 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb */
  dias_semana?: number[];
  /** Datas (YYYY-MM-DD) onde esta tarefa recorrente NÃO deve aparecer */
  excecoes?: string[];
  /** Configurações de alarme */
  alarme_ativo?: boolean;
  alarme_hora?: string; // HH:mm
  alarme_som?: number;  // 1-5
}

export type RewardType = 'credito' | 'debito';

export interface RewardHistory {
  id: string;
  usuario_id: string;
  valor: number;
  tipo: RewardType;
  descricao: string;
  data: string;
}

export interface PantryItem {
  id: string;
  nome_item: string;
  quantidade: number;
  quantidade_minima: number;
  validade?: string;
  categoria: string;
}

export type ShoppingStatus = 'pendente' | 'comprado';

export interface ShoppingItem {
  id: string;
  nome_item: string;
  quantidade: number;
  status: ShoppingStatus;
  gerado_automaticamente: boolean;
}

export type MealType = 'cafe' | 'almoco' | 'jantar';

export interface MealPlan {
  id: string;
  data: string;
  refeicao: MealType;
  descricao: string;
  ingredientes_relacionados: string[];
}
