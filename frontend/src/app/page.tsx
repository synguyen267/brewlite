'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchProducts } from '@/lib/api';

const formatPrice = (price: number) => price.toLocaleString('vi-VN') + 'đ';

export default function MenuPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">BrewLite</h1>
        <span className="text-sm text-stone-500">Xem giỏ hàng (0)</span>
      </header>

      {isLoading && <p className="text-stone-500">Đang tải menu...</p>}

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <p>Không tải được menu. Hãy kiểm tra backend đã chạy chưa.</p>
          <button onClick={() => refetch()} className="mt-2 underline">
            Thử lại
          </button>
        </div>
      )}

      {data && data.length === 0 && (
        <p className="text-stone-500">Hiện chưa có sản phẩm nào.</p>
      )}

      {data && data.length > 0 && (
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {data.map((p) => (
            <li
              key={p.id}
              className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.imageUrl}
                alt={p.name}
                className="h-36 w-full object-cover"
              />
              <div className="p-3">
                <h2 className="font-medium">{p.name}</h2>
                <p className="text-sm text-amber-700">{formatPrice(p.price)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}