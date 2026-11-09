'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ApiError, fetchMyOrders, MyOrder } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { formatPrice } from '@/lib/pricing';

const STATUS_STYLE: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  PAID: 'bg-green-100 text-green-800',
  PAYMENT_FAILED: 'bg-red-100 text-red-800',
  PREPARING: 'bg-blue-100 text-blue-800',
  READY: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-stone-200 text-stone-700',
  CANCELLED: 'bg-stone-200 text-stone-700',
};

export default function OrdersPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);

  const [authReady, setAuthReady] = useState(false);
  const [orders, setOrders] = useState<MyOrder[] | null>(null);
  const [error, setError] = useState('');

  // Chờ zustand đọc xong token từ localStorage
  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() =>
      setAuthReady(true),
    );
    setAuthReady(useAuthStore.persist.hasHydrated());
    return unsub;
  }, []);

  useEffect(() => {
    if (!authReady) return;
    if (!token) {
      router.push('/login?next=/orders');
      return;
    }
    fetchMyOrders(token)
      .then(setOrders)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          logout();
          router.push('/login?next=/orders');
          return;
        }
        setError((err as Error).message);
      });
  }, [authReady, token, router, logout]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/" className="text-sm text-stone-500 hover:underline">
        ← Về menu
      </Link>
      <h1 className="mt-4 mb-6 text-2xl font-bold">Lịch sử đơn hàng</h1>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>
      )}

      {!error && orders === null && (
        <p className="text-stone-500">Đang tải đơn hàng...</p>
      )}

      {orders && orders.length === 0 && (
        <div className="rounded-xl border border-stone-200 bg-white p-6 text-center">
          <p className="text-stone-500">Bạn chưa có đơn hàng nào.</p>
          <Link href="/" className="mt-3 inline-block text-amber-700 underline">
            Xem menu
          </Link>
        </div>
      )}

      {orders && orders.length > 0 && (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li
              key={o.id}
              className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">Đơn #{o.id}</span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    STATUS_STYLE[o.status] ?? 'bg-stone-200 text-stone-700'
                  }`}
                >
                  {o.status}
                </span>
              </div>

              <ul className="mt-2 space-y-1 text-sm text-stone-600">
                {o.items.map((i) => (
                  <li key={i.id} className="flex justify-between">
                    <span>
                      {i.product.name} ({i.size}) x{i.qty}
                    </span>
                    <span>{formatPrice(i.lineTotal)}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-3">
                <span className="font-bold text-amber-700">
                  Tổng: {formatPrice(o.total)}
                </span>
                {(o.status === 'PENDING' || o.status === 'PAYMENT_FAILED') && (
                  <Link
                    href={`/checkout/${o.id}`}
                    className="rounded-lg bg-stone-800 px-4 py-1.5 text-sm text-white hover:bg-stone-700"
                  >
                    Thanh toán
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
