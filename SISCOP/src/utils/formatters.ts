/**
 * Utilitários de formatação automática para campos cadastrais (Data, Telefone, CPF)
 */

/**
 * Formata sequência numérica em data no formato DD/MM/AAAA.
 * Exemplo: '15012026' -> '15/01/2026'
 */
export const formatBirthDate = (val: string): string => {
  if (!val) return '';
  const digits = val.replace(/\D/g, '');

  if (digits.length === 8) {
    const day = digits.slice(0, 2);
    const month = digits.slice(2, 4);
    const year = digits.slice(4, 8);
    return `${day}/${month}/${year}`;
  }

  if (digits.length === 6) {
    const day = digits.slice(0, 2);
    const month = digits.slice(2, 4);
    const year = digits.slice(4, 6);
    return `${day}/${month}/20${year}`;
  }

  return val.trim();
};

/**
 * Formata sequência numérica em telefone no formato (DD) 9 XXXX-XXXX ou (DD) XXXX-XXXX.
 * Exemplo: '35999558899' -> '(35) 9 9955-8899'
 */
export const formatPhoneNumber = (val: string): string => {
  if (!val) return '';
  const digits = val.replace(/\D/g, '');

  // 11 dígitos com 9 no início (Padrão celular BR com DDD)
  if (digits.length === 11) {
    const ddd = digits.slice(0, 2);
    const ninth = digits.slice(2, 3);
    const part1 = digits.slice(3, 7);
    const part2 = digits.slice(7, 11);
    return `(${ddd}) ${ninth} ${part1}-${part2}`;
  }

  // 10 dígitos (Telefone fixo com DDD)
  if (digits.length === 10) {
    const ddd = digits.slice(0, 2);
    const part1 = digits.slice(2, 6);
    const part2 = digits.slice(6, 10);
    return `(${ddd}) ${part1}-${part2}`;
  }

  // 9 dígitos (Sem DDD)
  if (digits.length === 9) {
    const ninth = digits.slice(0, 1);
    const part1 = digits.slice(1, 5);
    const part2 = digits.slice(5, 9);
    return `${ninth} ${part1}-${part2}`;
  }

  // 8 dígitos (Fixo sem DDD)
  if (digits.length === 8) {
    const part1 = digits.slice(0, 4);
    const part2 = digits.slice(4, 8);
    return `${part1}-${part2}`;
  }

  return val.trim();
};

/**
 * Formata sequência numérica em CPF no formato 000.000.000-00.
 * Exemplo: '12345678923' -> '123.456.789-23'
 */
export const formatCpfNumber = (val: string): string => {
  if (!val) return '';
  const digits = val.replace(/\D/g, '');

  if (digits.length === 11) {
    const p1 = digits.slice(0, 3);
    const p2 = digits.slice(3, 6);
    const p3 = digits.slice(6, 9);
    const p4 = digits.slice(9, 11);
    return `${p1}.${p2}.${p3}-${p4}`;
  }

  return val.trim();
};

/**
 * Formata sequência numérica em CEP no formato 00000-000.
 * Exemplo: '37550000' -> '37550-000'
 */
export const formatCepNumber = (val: string): string => {
  if (!val) return '';
  const digits = val.replace(/\D/g, '').slice(0, 8);
  if (digits.length === 8) {
    return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
  }
  return val.trim();
};

/**
 * Verifica se um cadastro possui vínculo com outro plano já existente
 * (através do registro no campo "Vinculação Identificativa").
 */
export const hasVinculo = (card: { linkedPlanNumbers?: string[] } | null | undefined): boolean => {
  if (!card || !card.linkedPlanNumbers || !Array.isArray(card.linkedPlanNumbers)) return false;
  return card.linkedPlanNumbers.some((p) => typeof p === 'string' && p.trim().length > 0);
};

/**
 * Extrai o número base do plano para exibição e ordenação (ex: 4550, 4882, ou 4385)
 */
export const getDisplayPlanNumber = (controlNumber: string): string => {
  if (!controlNumber) return '----';
  const trimmed = controlNumber.trim();

  // Se contiver hífen (ex: 4882-01 ou 4882-02), o número do plano é o prefixo
  if (trimmed.includes('-')) {
    const prefix = trimmed.split('-')[0].trim();
    const digits = prefix.replace(/\D/g, '');
    if (digits.length > 0) {
      return digits;
    }
  }

  const digits = trimmed.replace(/\D/g, '');
  if (digits.length > 0) {
    return digits;
  }
  return trimmed;
};

/**
 * Chave numérica para ordenação decrescente (o maior número/mais recente no topo da lista)
 */
export const getNumericSortKey = (card: { controlNumber?: string; createdAt?: string } | null | undefined): number => {
  if (!card || !card.controlNumber) return 0;
  const disp = getDisplayPlanNumber(card.controlNumber);
  const parsed = parseInt(disp, 10);
  if (!isNaN(parsed) && parsed > 0) return parsed;
  return 0;
};
