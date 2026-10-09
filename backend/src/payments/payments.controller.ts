import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthedRequest } from '../auth/auth.types';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
@UseGuards(AuthGuard)
export class PaymentsController {
    constructor ( private readonly paymentsService: PaymentsService) {}

    @Post()
    pay(@Body() dto: CreatePaymentDto, @Req() req: AuthedRequest) {
        return this.paymentsService.pay(dto, req.user.id);
}
}