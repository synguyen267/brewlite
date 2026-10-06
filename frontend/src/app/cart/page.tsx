'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  cartCount,
  cartTotal,
  itemUnitPrice,
  useCartStore,
} from '@/lib/cart-store';
import { TOPPINGS, formatPrice } from '@/lib/pricing';

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const setQty = useCartStore((s) => s.setQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const clear = useCartStore((s) => s.clear);

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const unsub = useCartStore.persist.onFinishHydration(() =>
      setHydrated(true),
    );
    setHydrated(useCartStore.persist.hasHydrated());
    return unsub;
  }, []);

  const toppingText = (values: string[]) =>
    values.length === 0
      ? 'Không topping'
      : values
          .map((v) => TOPPINGS.find((t) => t.value === v)?.label ?? v)
          .join(', ');

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/" className="text-sm text-stone-500 hover:underline">
        ← Tiếp tục chọn đồ uống
      </Link>
      <h1 className="mt-4 mb-6 text-2xl font-bold">Giỏ hàng</h1>

      {!hydrated && <p className="text-stone-500">Đang tải giỏ hàng...</p>}

      {hydrated && items.length === 0 && (
        <div className="rounded-xl border border-stone-200 bg-white p-6 text-center">
          <p className="text-stone-500">Giỏ hàng đang trống.</p>
          <Link href="/" className="mt-3 inline-block text-amber-700 underline">
            Xem menu
          </Link>
        </div>
      )}

      {hydrated && items.length > 0 && (
        <>
          <ul className="space-y-3">
            {items.map((i) => (
              <li
                key={i.key}
                className="flex gap-3 rounded-xl border border-stone-200 bg-white p-3 shadow-sm"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={i.imageUrl}
                  alt={i.name}
                  className="h-20 w-20 rounded-lg object-cover"
                />
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <h2 className="font-medium">
                      {i.name} <span className="text-stone-500">({i.size})</span>
                    </h2>
                    <p className="text-xs text-stone-500">
                      {toppingText(i.toppings)}
                    </p>
                    <p className="text-sm text-amber-700">
                      {formatPrice(itemUnitPrice(i))} / ly
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setQty(i.key, i.qty - 1)}
                        disabled={i.qty <= 1}
                        className="h-7 w-7 rounded-md border border-stone-300 disabled:opacity-40"
                      >
                        −
                      </button>
                      <span className="w-6 text-center">{i.qty}</span>
                      <button
                        onClick={() => setQty(i.key, i.qty + 1)}
                        className="h-7 w-7 rounded-md border border-stone-300"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">
                        {formatPrice(itemUnitPrice(i) * i.qty)}
                      </span>
                      <button
                        onClick={() => removeItem(i.key)}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 rounded-xl border border-stone-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="text-stone-600">
                Tổng ({cartCount(items)} ly)
              </span>
              <span className="text-xl font-bold text-amber-700">
                {formatPrice(cartTotal(items))}
              </span>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                onClick={clear}
                className="rounded-lg border border-stone-300 px-4 py-2 text-sm"
              >
                Xóa tất cả
              </button>
              <button
                disabled
                title="Sẽ hoạt động ở Task 8 (thanh toán)"
                className="flex-1 cursor-not-allowed rounded-lg bg-stone-800 px-5 py-2 text-white opacity-50"
              >
                Thanh toán
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}