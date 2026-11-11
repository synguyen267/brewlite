import { ConflictException } from '@nestjs/common';

export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PREPARING'
  | 'READY'
  | 'COMPLETED'
  | 'PAYMENT_FAILED'
  | 'CANCELLED';

// Bảng các chuyển trạng thái hợp lệ. Trạng thái nào không có trong danh sách thì bị chặn.
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['PAID', 'PAYMENT_FAILED', 'CANCELLED'],
  PAYMENT_FAILED: ['PAID', 'PAYMENT_FAILED', 'CANCELLED'], // thử lại thanh toán
  PAID: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY'],
  READY: ['COMPLETED'],
  COMPLETED: [], // trạng thái kết thúc
  CANCELLED: [], // trạng thái kết thúc
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: OrderStatus, to: OrderStatus): void {
  if (!canTransition(from, to)) {
    throw new ConflictException(
      `Không thể chuyển đơn từ ${from} sang ${to}`,
    );
  }
}
