import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { calcUnitPrice } from './pricing';

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

    const total = items.reduce((sum, i) => sum + i.lineTotal, 0);

    return this.prisma.order.create({
      data: { userId, total, items: { create: items } },
      include: { items: true },
    });
  }
}