export type Size = 'S' | 'M' | 'L';

export const SIZE_EXTRA: Record<Size, number> = { S: 0, M: 5000, L: 10000 };

export const TOPPING_EXTRA: Record<string, number> = {
  'tran-chau': 5000,
  kem: 5000,
};

export const TOPPING_VALUES = Object.keys(TOPPING_EXTRA);

export function calcUnitPrice(
  basePrice: number,
  size: Size,
  toppings: string[],
): number {
  const toppingExtra = toppings.reduce(
    (sum, t) => sum + (TOPPING_EXTRA[t] ?? 0),
    0,
  );
  return basePrice + SIZE_EXTRA[size] + toppingExtra;
}