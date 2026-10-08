export type Size = 'S' | 'M' | 'L' | 'XL';

export const SIZES: { value: Size; label: string; extra: number }[] = [
  { value: 'S', label: 'S', extra: 0 },
  { value: 'M', label: 'M', extra: 5000 },
  { value: 'L', label: 'L', extra: 10000 },
  { value: 'XL', label: 'XL', extra: 15000 },
];

export const TOPPINGS: { value: string; label: string; extra: number }[] = [
  { value: 'tran-chau', label: 'Trân châu', extra: 5000 },
  { value: 'kem', label: 'Kem', extra: 5000 },
  { value: 'kem-muoi', label: 'Kem muối', extra: 10000},
];

export const formatPrice = (price: number) =>
  price.toLocaleString('vi-VN') + 'đ';

export function calcUnitPrice(
  basePrice: number,
  size: Size,
  toppings: string[],
): number {
  const sizeExtra = SIZES.find((s) => s.value === size)?.extra ?? 0;
  const toppingExtra = TOPPINGS.filter((t) => toppings.includes(t.value)).reduce(
    (sum, t) => sum + t.extra,
    0,
  );
  return basePrice + sizeExtra + toppingExtra;
}