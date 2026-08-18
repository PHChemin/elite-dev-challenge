/**
 * Valor do NumberInput como número. Campo em branco devolve null para o
 * payload omitir o campo. O texto vem no formato pt-BR: milhar `.`, decimal `,`.
 */
export function toNumber(value: number | string): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  const digits = value.trim().replaceAll('.', '').replace(',', '.');
  if (digits.length === 0) {
    return null;
  }
  const parsed = Number(digits);
  return Number.isFinite(parsed) ? parsed : null;
}

export function halfReaisFromFull(priceFull: number | string): number | null {
  const reais = toNumber(priceFull);
  if (reais === null) {
    return null;
  }
  return Math.floor(Math.round(reais * 100) / 2) / 100;
}
