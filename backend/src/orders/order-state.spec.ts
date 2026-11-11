import { ConflictException } from '@nestjs/common';
import { assertTransition, canTransition } from './order-state';

describe('Order state machine', () => {
  it('cho phép luồng thành công PENDING → PAID → PREPARING → READY → COMPLETED', () => {
    expect(() => assertTransition('PENDING', 'PAID')).not.toThrow();
    expect(() => assertTransition('PAID', 'PREPARING')).not.toThrow();
    expect(() => assertTransition('PREPARING', 'READY')).not.toThrow();
    expect(() => assertTransition('READY', 'COMPLETED')).not.toThrow();
  });

  it('cho phép thanh toán lỗi rồi thử lại', () => {
    expect(() => assertTransition('PENDING', 'PAYMENT_FAILED')).not.toThrow();
    expect(() => assertTransition('PAYMENT_FAILED', 'PAID')).not.toThrow();
  });

  it('chặn chuyển trạng thái sai (nhảy cóc)', () => {
    expect(() => assertTransition('PENDING', 'READY')).toThrow(
      ConflictException,
    );
    expect(() => assertTransition('PENDING', 'COMPLETED')).toThrow(
      ConflictException,
    );
    expect(() => assertTransition('PAID', 'PENDING')).toThrow(
      ConflictException,
    );
  });

  it('chặn chuyển ngược', () => {
    expect(canTransition('READY', 'PREPARING')).toBe(false);
    expect(canTransition('PREPARING', 'PAID')).toBe(false);
  });

  it('trạng thái kết thúc không đi tiếp được', () => {
    expect(canTransition('COMPLETED', 'PENDING')).toBe(false);
    expect(canTransition('COMPLETED', 'CANCELLED')).toBe(false);
    expect(canTransition('CANCELLED', 'PAID')).toBe(false);
  });
});
