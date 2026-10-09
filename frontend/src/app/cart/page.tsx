'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ApiError, createOrder } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import {
  cartCount,
  cartTotal,
  itemUnitPrice,
  useCartStore,
} from '@/lib/cart-store';
import { TOPPINGS, formatPrice } from '@/lib/pricing';

export default function CartPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const setQty = useCartStore((s) => s.setQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const clear = useCartStore((s) => s.clear);
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);

  const [hydrated, setHydrated] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [orderDone, setOrderDone] = useState<{
    id: number;
    total: number;
    status: string;
  } | null>(null);

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

  const handleOrder = async () => {
    if (!token) {
      router.push('/login?next=/cart');
      return;
    }
    setOrderError('');
    setPlacing(true);
    try {
      const order = await createOrder(
        token,
        items.map((i) => ({
          productId: i.productId,
          size: i.size,
          toppings: i.toppings,
          qty: i.qty,
        })),
      );
      clear();
      setOrderDone(order);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        router.push('/login?next=/cart');
        return;
      }
      setOrderError((err as Error).message);
    } finally {
      setPlacing(false);
    }
  };

  if (orderDone) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
          <p className="text-3xl">✓</p>
          <h1 className="mt-2 text-xl font-bold">Đặt hàng thành công</h1>
          <p className="mt-2">Mã đơn: #{orderDone.id}</p>
          <p>Tổng tiền: {formatPrice(orderDone.total)}</p>
          <p className="text-sm text-stone-600">
            Trạng thái: {orderDone.status} (chờ thanh toán)
          </p>
          <Link href="/" className="mt-4 inline-block text-amber-700 underline">
            Về trang chủ
          </Link>
        </div>
      </main>
    );
  }

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

            {orderError && (
              <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {orderError}
              </p>
            )}

            <div className="mt-4 flex gap-3">
              <button
                onClick={clear}
                className="rounded-lg border border-stone-300 px-4 py-2 text-sm"
              >
                Xóa tất cả
              </button>
              <button
                onClick={handleOrder}
                disabled={placing}
                className="flex-1 rounded-lg bg-stone-800 px-5 py-2 text-white hover:bg-stone-700 disabled:opacity-50"
              >
                {placing
                  ? 'Đang đặt hàng...'
                  : token
                    ? 'Đặt hàng'
                    : 'Đăng nhập để đặt hàng'}
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}