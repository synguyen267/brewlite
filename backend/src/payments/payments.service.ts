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
import { calcLoyaltyPoints } from '../orders/promo';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { MockGatewayService } from './mock-gateway.service';

export type PaymentResult = {
  paymentId: number;
  paymentStatus: string;
  orderId: number;
  orderStatus: string;
  amount: number;
};

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: MockGatewayService,
  ) {}

  async pay(
    dto: CreatePaymentDto,
    userId: number,
    idempotencyKey?: string,
  ): Promise<PaymentResult> {
    // Idempotent: cùng Idempotency-Key thì trả lại kết quả cũ, không trừ tiền lần nữa
    if (idempotencyKey) {
      const replay = await this.findReplay(idempotencyKey, dto.orderId, userId);
      if (replay) return replay;
    }

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

    try {
      const { payment, updated } = await this.prisma.$transaction(
        async (tx) => {
          const payment = await tx.payment.create({
            data: {
              orderId: order.id,
              amount: order.total,
              method: dto.method,
              status: ok ? 'SUCCESS' : 'FAILED',
              idempotencyKey: idempotencyKey ?? null,
            },
          });
          const updated = await tx.order.update({
            where: { id: order.id },
            data: { status: next },
          });
          // Cộng điểm thưởng sau khi đơn PAID
          if (ok) {
            await tx.user.update({
              where: { id: userId },
              data: {
                loyaltyPoints: { increment: calcLoyaltyPoints(order.total) },
              },
            });
          }
          return { payment, updated };
        },
      );

      return {
        paymentId: payment.id,
        paymentStatus: payment.status,
        orderId: updated.id,
        orderStatus: updated.status,
        amount: payment.amount,
      };
    } catch (err) {
      // Hai yêu cầu cùng key đến sát nhau: yêu cầu đến sau bị vi phạm unique, trả kết quả của yêu cầu trước
      if (idempotencyKey && (err as { code?: string }).code === 'P2002') {
        const replay = await this.findReplay(idempotencyKey, dto.orderId, userId);
        if (replay) return replay;
      }
      throw err;
    }
  }

  private async findReplay(
    key: string,
    orderId: number,
    userId: number,
  ): Promise<PaymentResult | null> {
    const p = await this.prisma.payment.findUnique({
      where: { idempotencyKey: key },
      include: { order: true },
    });
    if (!p) return null;
    if (p.orderId !== orderId || p.order.userId !== userId) {
      throw new ConflictException(
        'Idempotency-Key đã được dùng cho một yêu cầu khác',
      );
    }
    return {
      paymentId: p.id,
      paymentStatus: p.status,
      orderId: p.orderId,
      orderStatus: p.status === 'SUCCESS' ? 'PAID' : 'PAYMENT_FAILED',
      amount: p.amount,
    };
  }
}
