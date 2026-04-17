/**
 * Formata um valor numérico para a moeda do sistema (Césares).
 */
export const formatCesares = (amount: number | null | undefined): string => {
  try {
    const value = typeof amount === 'number' ? amount : 0;
    const formatted = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
    
    return `${formatted} Césares`;
  } catch (e) {
    return '0,00 Césares';
  }
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
