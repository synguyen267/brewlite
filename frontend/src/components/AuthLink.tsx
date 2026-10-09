'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';

export default function AuthLink() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  if (!user) {
    return (
      <Link href="/login" className="text-sm text-stone-600 hover:underline">
        Đăng nhập
      </Link>
    );
  }

  return (
    <span className="text-sm text-stone-600">
      {user.email} ·{' '}
      <button onClick={logout} className="underline">
        Đăng xuất
      </button>
    </span>
  );
}