/** Shared formatting helpers — used by both the client UI and the server-rendered email. Currency choice affects display only; no conversion is ever applied. */

export function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatCount(value: number | null): string {
  if (value === null) return "—";
  return formatNumber(Math.round(value));
}
