/**
 * Formata um valor numérico para a moeda do sistema (Césares).
 */
export const formatCesares = (amount: number): string => {
  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  
  return `${formatted} Césares`;
};

/**
 * Formata uma data ISO para o formato brasileiro (DD/MM/AAAA).
 */
export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  } catch (e) {
    return dateStr;
  }
};
