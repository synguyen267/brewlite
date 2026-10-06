'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchProduct } from '@/lib/api';
import {
  SIZES,
  TOPPINGS,
  calcUnitPrice,
  formatPrice,
  type Size,
} from '@/lib/pricing';

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const invalidId = !Number.isInteger(id);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProduct(id),
    enabled: !invalidId,
    retry: false,
  });

  const [size, setSize] = useState<Size>('S');
  const [toppings, setToppings] = useState<string[]>([]);

  const toggleTopping = (value: string) =>
    setToppings((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value],
    );

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/" className="text-sm text-stone-500 hover:underline">
        ← Quay lại menu
      </Link>

      {isLoading && <p className="mt-6 text-stone-500">Đang tải...</p>}

      {(isError || invalidId) && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {invalidId
            ? 'Sản phẩm không hợp lệ.'
            : (error as Error)?.message ?? 'Có lỗi xảy ra.'}
        </div>
      )}

      {data && (
        <div className="mt-6 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.imageUrl}
            alt={data.name}
            className="h-56 w-full object-cover"
          />
          <div className="space-y-5 p-5">
            <div>
              <h1 className="text-2xl font-bold">{data.name}</h1>
              <p className="text-stone-500">Giá: {formatPrice(data.price)}</p>
            </div>

            <div>
              <h2 className="mb-2 font-medium">Size</h2>
              <div className="flex gap-2">
                {SIZES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setSize(s.value)}
                    className={`rounded-lg border px-4 py-2 text-sm ${
                      size === s.value
                        ? 'border-amber-700 bg-amber-700 text-white'
                        : 'border-stone-300 bg-white'
                    }`}
                  >
                    {s.label}
                    {s.extra > 0 && ` (+${formatPrice(s.extra)})`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="mb-2 font-medium">Topping</h2>
              <div className="space-y-2">
                {TOPPINGS.map((t) => (
                  <label key={t.value} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={toppings.includes(t.value)}
                      onChange={() => toggleTopping(t.value)}
                    />
                    <span>
                      {t.label} (+{formatPrice(t.extra)})
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <span className="text-lg font-bold text-amber-700">
                {formatPrice(calcUnitPrice(data.price, size, toppings))}
              </span>
              <button
                disabled
                title="Sẽ hoạt động ở Task 5 (giỏ hàng)"
                className="cursor-not-allowed rounded-lg bg-stone-800 px-5 py-2 text-white opacity-50"
              >
                Thêm vào giỏ
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}