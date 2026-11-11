import { ConflictException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import type { CreatePaymentDto } from './dto/create-payment.dto';
import type { MockGatewayService } from './mock-gateway.service';
import { PaymentsService } from './payments.service';

type Row = Record<string, unknown>;

// CSDL giả trong bộ nhớ, đủ để kiểm thử logic thanh toán
function makeService(chargeOk = true, total = 120000) {
  const order = { id: 1, userId: 7, status: 'PENDING', total };
  const payments: Row[] = [];
  const user = { id: 7, loyaltyPoints: 0 };
  let chargeCalls = 0;

  const prisma = {
    order: {
      findUnique: async () => ({ ...order }),
      update: async ({ data }: { data: { status: string } }) => {
        order.status = data.status;
        return { ...order };
      },
    },
    payment: {
      findUnique: async ({ where }: { where: { idempotencyKey: string } }) => {
        const p = payments.find((x) => x.idempotencyKey === where.idempotencyKey);
        return p ? { ...p, order: { ...order } } : null;
      },
      create: async ({ data }: { data: Row }) => {
        const p = { id: payments.length + 1, ...data };
        payments.push(p);
        return p;
      },
    },
    user: {
      update: async ({
        data,
      }: {
        data: { loyaltyPoints: { increment: number } };
      }) => {
        user.loyaltyPoints += data.loyaltyPoints.increment;
        return user;
      },
    },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(prisma),
  };

  const gateway = {
    charge: async () => {
      chargeCalls++;
      return chargeOk;
    },
  };

  const service = new PaymentsService(
    prisma as unknown as PrismaService,
    gateway as unknown as MockGatewayService,
  );
  return { service, payments, user, order, charges: () => chargeCalls };
}

const dto: CreatePaymentDto = { orderId: 1, method: 'WALLET' };

describe('Thanh toán idempotent', () => {
  it('gửi 2 lần cùng Idempotency-Key chỉ tạo 1 thanh toán', async () => {
    const { service, payments, charges } = makeService();

    const first = await service.pay(dto, 7, 'key-abc');
    const second = await service.pay(dto, 7, 'key-abc');

    expect(payments).toHaveLength(1); // chỉ 1 bản ghi thanh toán
    expect(charges()).toBe(1); // cổng thanh toán chỉ bị gọi 1 lần (không trừ tiền 2 lần)
    expect(second).toEqual(first); // cùng một kết quả
    expect(first.orderStatus).toBe('PAID');
  });

  it('không có key thì thanh toán lại đơn đã PAID bị chặn', async () => {
    const { service } = makeService();
    await service.pay(dto, 7);
    await expect(service.pay(dto, 7)).rejects.toBeInstanceOf(ConflictException);
  });

  it('key đã dùng cho đơn khác thì bị từ chối', async () => {
    const { service } = makeService();
    await service.pay(dto, 7, 'key-xyz');
    await expect(
      service.pay({ ...dto, orderId: 2 }, 7, 'key-xyz'),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('Điểm thưởng sau thanh toán', () => {
  it('thanh toán thành công cộng 1 điểm mỗi 1.000đ', async () => {
    const { service, user } = makeService(true, 120000);
    await service.pay(dto, 7, 'k1');
    expect(user.loyaltyPoints).toBe(120);
  });

  it('thanh toán lỗi thì không cộng điểm', async () => {
    const { service, user } = makeService(false, 120000);
    const r = await service.pay(dto, 7, 'k2');
    expect(r.orderStatus).toBe('PAYMENT_FAILED');
    expect(user.loyaltyPoints).toBe(0);
  });
});
