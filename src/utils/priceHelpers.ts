/**
 * Utilitários para extração, conversão e cálculo exato de preços e descontos em BRL
 */

export function parsePriceToNumber(val: string | number | null | undefined): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;
  const str = String(val).trim();
  if (!str) return null;

  // Limpa tudo exceto números, pontos e vírgulas
  // Ex: "R$ 197,22" -> "197,22", "R$ 1.598,50" -> "1.598,50", "598" -> "598"
  const clean = str.replace(/[^\d.,]/g, '');
  if (!clean) return null;

  // Se tiver ponto e vírgula (ex: 1.598,50), remove pontos de milhar e substitui vírgula por ponto
  if (clean.includes('.') && clean.includes(',')) {
    const normalized = clean.replace(/\./g, '').replace(',', '.');
    const n = parseFloat(normalized);
    return isNaN(n) ? null : n;
  }

  // Se tiver apenas vírgula (ex: 197,22)
  if (clean.includes(',')) {
    const normalized = clean.replace(',', '.');
    const n = parseFloat(normalized);
    return isNaN(n) ? null : n;
  }

  // Se tiver apenas ponto
  if (clean.includes('.')) {
    const parts = clean.split('.');
    if (parts.length === 2 && parts[1].length === 3 && parts[0].length <= 3) {
      // Milhar brasileiro sem centavos (ex: 1.500)
      const n = parseFloat(clean.replace(/\./g, ''));
      return isNaN(n) ? null : n;
    }
    const n = parseFloat(clean);
    return isNaN(n) ? null : n;
  }

  const n = parseFloat(clean);
  return isNaN(n) ? null : n;
}

export function formatBRL(num: number): string {
  if (isNaN(num)) return 'R$ 0,00';
  return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export interface DiscountResult {
  percent: number;
  label: string;
  savings: string;
  savingsValue: number;
}

/**
 * Calcula o percentual real de desconto baseado no preço atual e no preço original:
 * Desconto = ((original - atual) / original) * 100
 */
export function calculateDiscount(
  current: string | number | null | undefined,
  original: string | number | null | undefined
): DiscountResult | null {
  const currNum = parsePriceToNumber(current);
  const origNum = parsePriceToNumber(original);

  if (currNum === null || origNum === null) return null;
  if (origNum <= 0 || currNum <= 0) return null;
  if (currNum >= origNum) return { percent: 0, label: '', savings: 'R$ 0,00', savingsValue: 0 };

  const savingsValue = origNum - currNum;
  const rawPercent = (savingsValue / origNum) * 100;
  const rounded = Math.round(rawPercent);

  if (rounded <= 0) return { percent: 0, label: '', savings: 'R$ 0,00', savingsValue: 0 };
  return {
    percent: rounded,
    label: `${rounded}% de desconto`,
    savings: formatBRL(savingsValue),
    savingsValue
  };
}
