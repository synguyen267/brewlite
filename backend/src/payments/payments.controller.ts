import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthedRequest } from '../auth/auth.types';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
@UseGuards(AuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  pay(
    @Body() dto: CreatePaymentDto,
    @Req() req: AuthedRequest,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    const key = idempotencyKey?.trim() || undefined;
    if (key && key.length > 100) {
      throw new BadRequestException('Idempotency-Key quá dài (tối đa 100 ký tự)');
    }
    return this.paymentsService.pay(dto, req.user.id, key);
  }
}
