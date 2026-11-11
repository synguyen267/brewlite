import { BadRequestException } from '@nestjs/common';

export type Promo = {
  code: string;
  type: 'PERCENT' | 'FIXED';
  value: number; // PERCENT: số %, FIXED: số tiền giảm (đ)
  maxDiscount?: number; // trần giảm cho loại PERCENT
  minTotal?: number; // đơn tối thiểu để được áp mã
};

// Danh sách mã khuyến mãi hợp lệ (bài tập: lưu cứng trong code)
export const PROMOS: Promo[] = [
  { code: 'BREW10', type: 'PERCENT', value: 10, maxDiscount: 30000 },
  { code: 'GIAM20K', type: 'FIXED', value: 20000, minTotal: 100000 },
];

export function findPromo(code: string): Promo | undefined {
  const normalized = code.trim().toUpperCase();
  return PROMOS.find((p) => p.code === normalized);
}

export function calcDiscount(promo: Promo, subtotal: number): number {
  let discount =
    promo.type === 'PERCENT'
      ? Math.floor((subtotal * promo.value) / 100)
      : promo.value;
  if (promo.maxDiscount !== undefined) {
    discount = Math.min(discount, promo.maxDiscount);
  }
  return Math.min(discount, subtotal); // không giảm quá tổng tiền
}

// Áp mã (nếu có) lên tổng tiền hàng. Mã sai hoặc chưa đủ điều kiện thì báo lỗi.
export function applyPromo(
  code: string | undefined,
  subtotal: number,
): { discount: number; promoCode: string | null } {
  if (!code || code.trim() === '') {
    return { discount: 0, promoCode: null };
  }
  const promo = findPromo(code);
  if (!promo) {
    throw new BadRequestException('Mã giảm giá không hợp lệ');
  }
  if (promo.minTotal !== undefined && subtotal < promo.minTotal) {
    throw new BadRequestException(
      `Mã ${promo.code} chỉ áp dụng cho đơn từ ${promo.minTotal.toLocaleString('vi-VN')}đ`,
    );
  }
  return { discount: calcDiscount(promo, subtotal), promoCode: promo.code };
}

// Điểm thưởng: cứ 1.000đ được 1 điểm
export function calcLoyaltyPoints(total: number): number {
  return Math.floor(total / 1000);
}
