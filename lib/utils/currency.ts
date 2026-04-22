export function formatCurrency(
  amount: number,
  currency: string = "NGN",
  locale: string = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat("en-US").format(amount);
}

export function parseCurrencyInput(value: string): number {
  return parseFloat(value.replace(/[^0-9.]/g, "")) || 0;
}
