import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { calcUnitPrice } from './pricing';
import { applyPromo } from './promo';

// Số lần thử lại khi bị đụng độ phiên bản (optimistic locking)
const MAX_RETRY = 20;

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrderDto, userId?: number) {
    const ids = [...new Set(dto.items.map((i) => i.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids } },
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    const items = dto.items.map((i) => {
      const product = byId.get(i.productId);
      if (!product) {
        throw new BadRequestException(`Sản phẩm ${i.productId} không tồn tại`);
      }
      const unitPrice = calcUnitPrice(product.price, i.size, i.toppings);
      return {
        productId: i.productId,
        size: i.size,
        toppings: i.toppings,
        qty: i.qty,
        unitPrice,
        lineTotal: unitPrice * i.qty,
      };
    });

    // Tổng tiền hàng, rồi áp mã khuyến mãi (nếu có)
    const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
    const { discount, promoCode } = applyPromo(dto.promoCode, subtotal);
    const total = subtotal - discount;

    // Gom số lượng theo sản phẩm, sắp xếp theo id để tránh deadlock
    const need = new Map<number, number>();
    for (const i of items) {
      need.set(i.productId, (need.get(i.productId) ?? 0) + i.qty);
    }
    const needSorted = [...need.entries()].sort((a, b) => a[0] - b[0]);

    // Trừ tồn kho và tạo đơn trong CÙNG một transaction:
    // đơn lỗi thì tồn kho tự hoàn lại.
    return this.prisma.$transaction(
      async (tx) => {
        for (const [productId, qty] of needSorted) {
          await this.reserveStock(tx, productId, qty);
        }
        return tx.order.create({
          data: { userId, total, discount, promoCode, items: { create: items } },
          include: { items: true },
        });
      },
      { maxWait: 10000, timeout: 20000 },
    );
  }

  // Optimistic locking: chỉ trừ kho nếu `version` chưa bị ai đổi và còn đủ hàng.
  private async reserveStock(
    tx: Prisma.TransactionClient,
    productId: number,
    qty: number,
  ) {
    for (let attempt = 0; attempt < MAX_RETRY; attempt++) {
      const p = await tx.product.findUnique({
        where: { id: productId },
        select: { name: true, stock: true, version: true },
      });
      if (!p) {
        throw new BadRequestException(`Sản phẩm ${productId} không tồn tại`);
      }
      if (p.stock < qty) {
        throw new ConflictException(`${p.name} chỉ còn ${p.stock} phần`);
      }
      const res = await tx.product.updateMany({
        where: { id: productId, version: p.version, stock: { gte: qty } },
        data: { stock: { decrement: qty }, version: { increment: 1 } },
      });
      if (res.count === 1) return; // trừ kho thành công
      // count = 0: có người vừa đổi dữ liệu, đọc lại và thử tiếp
    }
    throw new ConflictException('Hệ thống đang bận, vui lòng thử lại');
  }

  async findAllForUser(userId: number) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { id: 'desc' },
      include: {
        items: {
          include: { product: { select: { name: true, imageUrl: true } } },
        },
      },
    });
  }

  async findOneForUser(id: number, userId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: { select: { name: true, imageUrl: true } } },
        },
      },
    });
    if (!order || order.userId !== userId) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }
    return order;
  }
}
