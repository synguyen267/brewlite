'use client';

import Link from 'next/link';
import { cartCount, useCartStore } from '@/lib/cart-store';

export default function CartLink() {
    const count = useCartStore((s) => cartCount(s.items));
    return (
        <Link href="/cart" className="text-sm text-stone-600 hover:underline">
            Xem giỏ hàng ({count})
        </Link>
    );

}