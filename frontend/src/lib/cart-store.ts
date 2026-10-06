import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { calcUnitPrice, type Size } from './pricing';

export type CartItem = {
  key: string;
  productId: number;
  name: string;
  imageUrl: string;
  basePrice: number;
  size: Size;
  toppings: string[];
  qty: number;
};

type NewItem = Omit<CartItem, 'key' | 'qty'>;

type CartState = {
  items: CartItem[];
  addItem: (item: NewItem, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  removeItem: (key: string) => void;
  clear: () => void;
};

const makeKey = (productId: number, size: Size, toppings: string[]) =>
  `${productId}|${size}|${[...toppings].sort().join(',')}`;

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      addItem: (item, qty = 1) =>
        set((state) => {
          const key = makeKey(item.productId, item.size, item.toppings);
          const existing = state.items.find((i) => i.key === key);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.key === key ? { ...i, qty: i.qty + qty } : i,
              ),
            };
          }
          return { items: [...state.items, { ...item, key, qty }] };
        }),

      setQty: (key, qty) =>
        set((state) => ({
          items:
            qty <= 0
              ? state.items.filter((i) => i.key !== key)
              : state.items.map((i) => (i.key === key ? { ...i, qty } : i)),
        })),

      removeItem: (key) =>
        set((state) => ({ items: state.items.filter((i) => i.key !== key) })),

      clear: () => set({ items: [] }),
    }),
    { name: 'brewlite-cart', skipHydration: true },
  ),
);

export const itemUnitPrice = (i: CartItem) =>
  calcUnitPrice(i.basePrice, i.size, i.toppings);

export const cartCount = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + i.qty, 0);

export const cartTotal = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + itemUnitPrice(i) * i.qty, 0);