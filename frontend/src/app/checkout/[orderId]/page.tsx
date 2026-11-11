'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ApiError, fetchOrder, payOrder, PaymentResult } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { useCartStore } from '@/lib/cart-store';
import { formatPrice } from '@/lib/pricing';

type Method = 'WALLET' | 'CARD';

export default function CheckoutPage() {
  const router = useRouter();
  const params = useParams<{ orderId: string }>();
  const orderId = Number(params.orderId);

  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);
  const clearCart = useCartStore((s) => s.clear);

  const [authReady, setAuthReady] = useState(false);
  const [order, setOrder] = useState<{
    id: number;
    status: string;
    total: number;
  } | null>(null);
  const [loadError, setLoadError] = useState('');
  const [method, setMethod] = useState<Method>('WALLET');
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');
  const [result, setResult] = useState<PaymentResult | null>(null);

  // Chờ zustand đọc xong token từ localStorage
  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() =>
      setAuthReady(true),
    );
    setAuthReady(useAuthStore.persist.hasHydrated());
    return unsub;
  }, []);

  // Tải đơn hàng
  useEffect(() => {
    if (!authReady) return;
    if (!token) {
      router.push(`/login?next=/checkout/${orderId}`);
      return;
    }
    fetchOrder(token, orderId)
      .then(setOrder)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          logout();
          router.push(`/login?next=/checkout/${orderId}`);
          return;
        }
        setLoadError((err as Error).message);
      });
  }, [authReady, token, orderId, router, logout]);

  const handlePay = async () => {
    if (!token) return;
    setPayError('');
    setPaying(true);
    try {
      const r = await payOrder(
        token,
        orderId,
        method,
        simulateFailure,
        crypto.randomUUID(),
      );
      setResult(r);
      if (r.orderStatus === 'PAID') clearCart();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        router.push(`/login?next=/checkout/${orderId}`);
        return;
      }
      setPayError((err as Error).message);
    } finally {
      setPaying(false);
    }
  };

  if (loadError) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <p className="rounded-lg bg-red-50 p-3 text-red-700">{loadError}</p>
        <Link href="/cart" className="mt-4 inline-block text-amber-700 underline">
          Về giỏ hàng
        </Link>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-stone-500">Đang tải đơn hàng...</p>
      </main>
    );
  }

  // Thanh toán thành công
  if (result?.orderStatus === 'PAID') {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
          <p className="text-3xl">✓</p>
          <h1 className="mt-2 text-xl font-bold">Đặt hàng thành công</h1>
          <p className="mt-2">Mã đơn: #{result.orderId}</p>
          <p>Số tiền: {formatPrice(result.amount)}</p>
          <p className="text-sm text-stone-600">
            Trạng thái: {result.orderStatus}
          </p>
          <div className="mt-4 flex justify-center gap-4">
            <Link href="/orders" className="text-amber-700 underline">
              Xem lịch sử đơn
            </Link>
            <Link href="/" className="text-amber-700 underline">
              Về trang chủ
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Thanh toán lỗi
  if (result?.orderStatus === 'PAYMENT_FAILED') {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-3xl">✗</p>
          <h1 className="mt-2 text-xl font-bold">Thanh toán thất bại</h1>
          <p className="mt-2">Mã đơn: #{result.orderId}</p>
          <p className="text-sm text-stone-600">
            Trạng thái: {result.orderStatus}. Giỏ hàng vẫn được giữ nguyên.
          </p>
          <button
            onClick={() => {
              setResult(null);
              setSimulateFailure(false);
            }}
            className="mt-4 rounded-lg bg-stone-800 px-5 py-2 text-white"
          >
            Thử lại
          </button>
        </div>
      </main>
    );
  }

  // Đơn không còn thanh toán được (đã PAID, đã hủy...)
  if (order.status !== 'PENDING' && order.status !== 'PAYMENT_FAILED') {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <p className="rounded-lg bg-amber-50 p-3">
          Đơn #{order.id} đang ở trạng thái {order.status}, không thể thanh toán.
        </p>
        <Link href="/" className="mt-4 inline-block text-amber-700 underline">
          Về trang chủ
        </Link>
      </main>
    );
  }

  // Form thanh toán
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Thanh toán</h1>

      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <p className="text-sm text-stone-500">Đơn #{order.id}</p>
        <p className="mt-1 text-xl font-bold text-amber-700">
          Tổng: {formatPrice(order.total)}
        </p>

        <p className="mt-5 mb-2 font-medium">Phương thức</p>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={method === 'WALLET'}
            onChange={() => setMethod('WALLET')}
          />
          Ví điện tử
        </label>
        <label className="mt-1 flex items-center gap-2">
          <input
            type="radio"
            checked={method === 'CARD'}
            onChange={() => setMethod('CARD')}
          />
          Thẻ ngân hàng
        </label>
        <p className="mt-2 text-xs text-stone-500">Không dùng tiền mặt</p>

        <label className="mt-4 flex items-center gap-2 text-sm text-stone-600">
          <input
            type="checkbox"
            checked={simulateFailure}
            onChange={(e) => setSimulateFailure(e.target.checked)}
          />
          Giả lập thanh toán lỗi (để test)
        </label>

        {payError && (
          <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {payError}
          </p>
        )}

        <button
          onClick={handlePay}
          disabled={paying}
          className="mt-5 w-full rounded-lg bg-stone-800 px-5 py-2 text-white hover:bg-stone-700 disabled:opacity-50"
        >
          {paying ? 'Đang xử lý...' : 'Xác nhận trả'}
        </button>
      </div>
    </main>
  );
}
