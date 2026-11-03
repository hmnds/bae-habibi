const formatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

export function formatPrice(value: string | number): string {
  const amount = typeof value === "number" ? value : Number.parseFloat(value);
  return formatter.format(Number.isFinite(amount) ? amount : 0);
}

