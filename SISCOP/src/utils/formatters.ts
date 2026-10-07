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
