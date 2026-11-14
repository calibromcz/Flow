/**
 * Helper universale per parsing numerico con supporto completo a virgola e punto decimale
 * (es. "5,50", "5.50", 5.5 -> 5.5)
 */
export const parseAmount = (val) => {
  if (typeof val === 'number') {
    return isNaN(val) ? 0 : Math.round(val * 100) / 100;
  }
  if (!val) return 0;
  const cleaned = String(val).replace(',', '.').replace(/[^0-9.-]+/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.round(num * 100) / 100;
};

