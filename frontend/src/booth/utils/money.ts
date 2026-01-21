export function formatMoney(cents: number, currency: string) {
  const value = (cents / 100).toFixed(2);
  return `${currency} ${value}`;
}
