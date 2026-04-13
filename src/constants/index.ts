export const PANTRY_CATEGORIES = [
  'Grãos', 
  'Laticínios', 
  'Proteínas', 
  'Padaria', 
  'Frutas', 
  'Temperos', 
  'Verduras', 
  'Bebidas', 
  'Limpeza', 
  'Higiene',
  'Outros'
];

export const CATEGORY_EMOJI: Record<string, string> = {
  'Grãos': '🌾',
  'Laticínios': '🥛',
  'Proteínas': '🥚',
  'Padaria': '🍞',
  'Frutas': '🍎',
  'Temperos': '🫒',
  'Verduras': '🥬',
  'Bebidas': '🥤',
  'Limpeza': '🧼',
  'Higiene': '🧻',
  'Outros': '📦'
};

export const TASK_FREQUENCIES = [
  { value: 'unica', label: 'Única' },
  { value: 'diaria', label: 'Diária' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'mensal', label: 'Mensal' }
];

export const USER_LEVELS = {
  INICIANTE: 'Iniciante',
  ORGANIZADO: 'Organizado',
  MESTRE: 'Mestre da Casa'
};

export const LEVEL_EMOJI: Record<string, string> = {
  'Iniciante': '🌱',
  'Organizado': '🌿',
  'Mestre da Casa': '🌳'
};
