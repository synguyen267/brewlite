import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  assertTransition,
  canTransition,
  OrderStatus,
} from '../orders/order-state';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { MockGatewayService } from './mock-gateway.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: MockGatewayService,
  ) {}

  async pay(dto: CreatePaymentDto, userId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId, userId },
    });
    if (!order || order.userId !== userId) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    const current = order.status as OrderStatus;
    if (!canTransition(current, 'PAID')) {
      throw new ConflictException(
        `Đơn đang ở trạng thái ${order.status}, không thể thanh toán`,
      );
    }

    const ok = await this.gateway.charge({
      amount: order.total,
      method: dto.method,
      simulateFailure: dto.simulateFailure,
    });

    const next: OrderStatus = ok ? 'PAID' : 'PAYMENT_FAILED';
    assertTransition(current, next);

    const [payment, updated] = await this.prisma.$transaction([
      this.prisma.payment.create({
        data: {
          orderId: order.id,
          amount: order.total,
          method: dto.method,
          status: ok ? 'SUCCESS' : 'FAILED',
        },
      }),
      this.prisma.order.update({
        where: { id: order.id },
        data: { status: next },
      }),
    ]);

    return {
      paymentId: payment.id,
      paymentStatus: payment.status,
      orderId: updated.id,
      orderStatus: updated.status,
      amount: payment.amount,
    };
  }
}
