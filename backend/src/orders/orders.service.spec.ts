import { ConflictException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import type { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from './orders.service';

// Test tích hợp: chạy thật trên PostgreSQL (docker compose up -d db)
process.env.DATABASE_URL ??=
  'postgresql://brewlite:brewlite@localhost:5433/brewlite';

describe('Kiểm soát tồn kho khi đặt đồng thời', () => {
  const prisma = new PrismaClient();
  const service = new OrdersService(prisma as unknown as PrismaService);
  let productId = 0;

  const makeDto = (qty: number) => ({
    items: [{ productId, size: 'S' as const, toppings: [], qty }],
  });

  beforeAll(async () => {
    const p = await prisma.product.create({
      data: { name: '[TEST] Tồn kho', price: 10000, imageUrl: 'test', stock: 5 },
    });
    productId = p.id;
  });

  afterAll(async () => {
    await prisma.order.deleteMany({
      where: { items: { some: { productId } } },
    });
    await prisma.product.delete({ where: { id: productId } });
    await prisma.$disconnect();
  });

  it('10 đơn đặt cùng lúc, tồn kho 5 → đúng 5 đơn thành công, kho về 0', async () => {
    const results = await Promise.allSettled(
      Array.from({ length: 10 }, () => service.create(makeDto(1))),
    );

    const ok = results.filter((r) => r.status === 'fulfilled');
    const failed = results.filter(
      (r): r is PromiseRejectedResult => r.status === 'rejected',
    );

    expect(ok).toHaveLength(5);
    expect(failed).toHaveLength(5);
    failed.forEach((r) => expect(r.reason).toBeInstanceOf(ConflictException));

    const after = await prisma.product.findUnique({ where: { id: productId } });
    expect(after?.stock).toBe(0); // không bán quá số lượng còn lại
  });

  it('đặt vượt tồn kho trong một đơn thì bị chặn, kho giữ nguyên', async () => {
    await prisma.product.update({
      where: { id: productId },
      data: { stock: 3 },
    });

    await expect(service.create(makeDto(4))).rejects.toBeInstanceOf(
      ConflictException,
    );

    const after = await prisma.product.findUnique({ where: { id: productId } });
    expect(after?.stock).toBe(3);
  });
});
